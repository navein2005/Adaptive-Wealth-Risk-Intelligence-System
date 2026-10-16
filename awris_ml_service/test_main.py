import asyncio
import os
import tempfile
import time
import unittest
from types import SimpleNamespace
from unittest.mock import patch

import main


class GroqRateLimitTests(unittest.TestCase):
    def setUp(self):
        self.original_api_key = main.GROQ_API_KEY
        self.original_gemini_api_key = main.GEMINI_API_KEY
        self.original_cooldown_db = main.PROVIDER_COOLDOWN_DB
        self.temp_dir = tempfile.TemporaryDirectory()
        main.GROQ_API_KEY = "test-key"
        main.GEMINI_API_KEY = ""
        main.PROVIDER_COOLDOWN_DB = os.path.join(self.temp_dir.name, "cooldown.sqlite3")

    def tearDown(self):
        main.GROQ_API_KEY = self.original_api_key
        main.GEMINI_API_KEY = self.original_gemini_api_key
        main.PROVIDER_COOLDOWN_DB = self.original_cooldown_db
        self.temp_dir.cleanup()

    def ask_about_a_car(self):
        query = main.ChatQuery(
            user_query="Can I afford a car?",
            monthly_income=4000,
            total_balance=10000,
            invested_amount=5000,
        )
        return asyncio.run(main.chat_with_advisor(query))

    def test_rate_limit_honors_retry_after_and_skips_provider_during_cooldown(self):
        response = SimpleNamespace(
            status_code=429,
            headers={"Retry-After": "120"},
            text="rate limited",
        )
        with patch.object(main.requests, "post", return_value=response) as post:
            fallback = self.ask_about_a_car()

        self.assertEqual(post.call_count, 1)
        self.assertIn("Evaluating vehicle financing", fallback["response"])
        self.assertGreaterEqual(main._get_provider_cooldown_until("groq"), time.time() + 119)

        with patch.object(main.requests, "post") as post:
            fallback_during_cooldown = self.ask_about_a_car()

        post.assert_not_called()
        self.assertIn("Evaluating vehicle financing", fallback_during_cooldown["response"])

    def test_invalid_retry_after_uses_one_minute_default(self):
        self.assertEqual(main._retry_after_seconds("not-a-date"), 60.0)

    def test_timeout_uses_existing_fallback(self):
        with patch.object(main.requests, "post", side_effect=main.requests.Timeout):
            fallback = self.ask_about_a_car()

        self.assertIn("Evaluating vehicle financing", fallback["response"])

    def test_success_after_cooldown_clears_persisted_state(self):
        main._set_provider_cooldown_until("groq", time.time() - 1)
        response = SimpleNamespace(
            status_code=200,
            json=lambda: {"choices": [{"message": {"content": "Live response"}}]},
        )

        with patch.object(main.requests, "post", return_value=response) as post, \
                patch("builtins.print"):
            result = self.ask_about_a_car()

        post.assert_called_once()
        self.assertEqual(result["response"], "Live response")
        self.assertEqual(main._get_provider_cooldown_until("groq"), 0.0)

    def test_gemini_is_used_after_groq_rate_limit(self):
        main.GEMINI_API_KEY = "gemini-test-key"
        groq_rate_limit = SimpleNamespace(
            status_code=429,
            headers={"Retry-After": "120"},
            text="rate limited",
        )
        gemini_success = SimpleNamespace(
            status_code=200,
            json=lambda: {
                "candidates": [
                    {"content": {"parts": [{"text": "Gemini response"}]}}
                ]
            },
        )
        with patch.object(
            main.requests,
            "post",
            side_effect=[groq_rate_limit, gemini_success],
        ) as post:
            result = self.ask_about_a_car()

        self.assertEqual(post.call_count, 2)
        self.assertTrue(post.call_args.args[0].endswith(":generateContent"))
        self.assertEqual(post.call_args.kwargs["headers"]["x-goog-api-key"], "gemini-test-key")
        self.assertEqual(result["response"], "Gemini response")

        with patch.object(main.requests, "post", return_value=gemini_success) as post:
            result_during_groq_cooldown = self.ask_about_a_car()

        post.assert_called_once()
        self.assertTrue(post.call_args.args[0].endswith(":generateContent"))
        self.assertEqual(result_during_groq_cooldown["response"], "Gemini response")

    def test_gemini_rate_limit_uses_heuristic_and_persists_cooldown(self):
        main.GEMINI_API_KEY = "gemini-test-key"
        groq_rate_limit = SimpleNamespace(
            status_code=429,
            headers={"Retry-After": "120"},
            text="rate limited",
        )
        gemini_rate_limit = SimpleNamespace(
            status_code=429,
            headers={"Retry-After": "90"},
            text="rate limited",
        )
        with patch.object(
            main.requests,
            "post",
            side_effect=[groq_rate_limit, gemini_rate_limit],
        ):
            result = self.ask_about_a_car()

        self.assertIn("Evaluating vehicle financing", result["response"])
        self.assertGreaterEqual(main._get_provider_cooldown_until("gemini"), time.time() + 89)

    def test_provider_request_does_not_block_event_loop(self):
        response = SimpleNamespace(
            status_code=200,
            json=lambda: {"choices": [{"message": {"content": "Live response"}}]},
        )

        def slow_post(*args, **kwargs):
            time.sleep(0.1)
            return response

        async def check_event_loop_responsiveness():
            with patch.object(main.requests, "post", side_effect=slow_post):
                request_task = asyncio.create_task(
                    main.chat_with_advisor(
                        main.ChatQuery(
                            user_query="Can I afford a car?",
                            monthly_income=4000,
                            total_balance=10000,
                            invested_amount=5000,
                        )
                    )
                )
                await asyncio.sleep(0.01)
                self.assertFalse(request_task.done())
                await request_task

        asyncio.run(check_event_loop_responsiveness())


if __name__ == "__main__":
    unittest.main()
