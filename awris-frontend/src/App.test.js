import { render, screen } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  localStorage.clear();
});

test('renders the sign-in form when no session is saved', () => {
  render(<App />);

  expect(screen.getByRole('heading', { name: 'Sign In to AWRIS' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
});

test('always opens sign-in and clears a previously saved session', () => {
  localStorage.setItem('awris_user', JSON.stringify({ user_id: 1, full_name: 'Returning User' }));

  render(<App />);

  expect(screen.getByRole('heading', { name: 'Sign In to AWRIS' })).toBeInTheDocument();
  expect(localStorage.getItem('awris_user')).toBeNull();
});
