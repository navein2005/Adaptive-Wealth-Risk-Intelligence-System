-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 15, 2026 at 01:43 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `awris_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `analytics_profiles`
--

CREATE TABLE `analytics_profiles` (
  `analytics_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `savings_rate` decimal(5,2) DEFAULT 0.00,
  `expense_volatility` enum('LOW','MEDIUM','HIGH') DEFAULT 'LOW',
  `risk_capacity_score` decimal(5,2) DEFAULT 0.00,
  `investor_type` enum('CONSERVATIVE','MODERATE','AGGRESSIVE') DEFAULT 'MODERATE',
  `cluster_label` varchar(50) DEFAULT NULL,
  `stock_allocation_pct` int(11) DEFAULT 60,
  `bond_allocation_pct` int(11) DEFAULT 30,
  `cash_allocation_pct` int(11) DEFAULT 10,
  `ai_recommendation_text` text DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `budgets`
--

CREATE TABLE `budgets` (
  `budget_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `category` varchar(100) NOT NULL,
  `budget_limit` decimal(12,2) NOT NULL DEFAULT 500.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `budgets`
--

INSERT INTO `budgets` (`budget_id`, `user_id`, `category`, `budget_limit`, `created_at`) VALUES
(1, 2, 'Food & Dining', 800.00, '2026-10-15 03:30:10'),
(2, 2, 'Rental & Housing', 1200.00, '2026-10-15 03:30:10'),
(3, 2, 'Bills & Utilities', 350.00, '2026-10-15 03:30:10'),
(4, 2, 'Transportation & Petrol', 400.00, '2026-10-15 03:30:10'),
(5, 2, 'Entertainment & Leisure', 300.00, '2026-10-15 03:30:10'),
(6, 1, 'Food & Dining', 800.00, '2026-10-15 11:23:03'),
(7, 1, 'Rental & Housing', 1200.00, '2026-10-15 11:23:03'),
(8, 1, 'Bills & Utilities', 350.00, '2026-10-15 11:23:03'),
(9, 1, 'Transportation & Petrol', 400.00, '2026-10-15 11:23:03'),
(10, 1, 'Entertainment & Leisure', 300.00, '2026-10-15 11:23:03');

-- --------------------------------------------------------

--
-- Table structure for table `category_budgets`
--

CREATE TABLE `category_budgets` (
  `budget_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `category` varchar(100) NOT NULL,
  `monthly_budget` decimal(10,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `category_budgets`
--

INSERT INTO `category_budgets` (`budget_id`, `user_id`, `category`, `monthly_budget`, `created_at`) VALUES
(1, 1, 'Food & Dining', 700.00, '2026-10-01 03:56:06'),
(2, 1, 'Bills & Utilities', 400.00, '2026-10-01 03:56:06'),
(3, 1, 'Rent', 1000.00, '2026-10-01 03:56:06'),
(4, 1, 'Entertainment', 300.00, '2026-10-01 03:56:06'),
(5, 1, 'Transfer', 500.00, '2026-10-01 03:56:06');

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `payment_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `bill_type` varchar(50) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `payment_date` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `simulation_records`
--

CREATE TABLE `simulation_records` (
  `simulation_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `monthly_investment` decimal(12,2) NOT NULL,
  `expected_return_pct` decimal(5,2) NOT NULL,
  `projection_years` int(11) DEFAULT 10,
  `worst_case_val` decimal(14,2) NOT NULL,
  `average_case_val` decimal(14,2) NOT NULL,
  `best_case_val` decimal(14,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `transactions`
--

CREATE TABLE `transactions` (
  `transaction_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `wallet_id` int(11) NOT NULL,
  `category` varchar(50) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `transaction_type` enum('INCOME','EXPENSE','INVESTMENT') NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `transaction_date` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `transactions`
--

INSERT INTO `transactions` (`transaction_id`, `user_id`, `wallet_id`, `category`, `amount`, `transaction_type`, `description`, `transaction_date`, `created_at`) VALUES
(8, 1, 1, 'Salary', 4200.00, 'INCOME', 'Monthly Tech Engineering Salary', '2026-10-01', '2026-10-07 03:52:15'),
(9, 1, 1, 'Rent', 900.00, 'EXPENSE', 'Penang Island Condo Rental Transfer', '2026-10-02', '2026-10-07 03:52:15'),
(10, 1, 1, 'Bills & Utilities', 185.40, 'EXPENSE', 'Tenaga Nasional Berhad (TNB)', '2026-10-03', '2026-10-07 03:52:15'),
(11, 1, 1, 'Bills & Utilities', 45.00, 'EXPENSE', 'Perbadanan Bekalan Air (PBA)', '2026-10-04', '2026-10-07 03:52:15'),
(12, 1, 1, 'Transfer', 50.00, 'EXPENSE', 'Transfer to Maybank (114012345678) - Vigneesh', '2026-10-07', '2026-10-07 03:52:15'),
(13, 1, 1, 'Food & Dining', 15.00, 'EXPENSE', 'DuitNow QR: Zus Coffee (Gurney Plaza) - Coffee & Pastry', '2026-10-07', '2026-10-07 03:52:15'),
(14, 1, 1, 'Food & Dining', 32.50, 'EXPENSE', 'DuitNow QR: Nasi Kandar Line Clear', '2026-10-06', '2026-10-07 03:52:15'),
(15, 1, 1, 'Investment', 500.00, 'INVESTMENT', 'StashAway MY / Wahed Robo-Advisor DCA', '2026-10-05', '2026-10-07 03:52:15'),
(16, 1, 1, 'Salary', 4200.00, 'INCOME', 'Monthly Tech Engineering Salary', '2026-09-01', '2026-10-07 03:52:15'),
(17, 1, 1, 'Rent', 900.00, 'EXPENSE', 'Penang Island Condo Rental Transfer', '2026-09-02', '2026-10-07 03:52:15'),
(18, 1, 1, 'Bills & Utilities', 178.20, 'EXPENSE', 'Tenaga Nasional Berhad (TNB)', '2026-09-03', '2026-10-07 03:52:15'),
(19, 1, 1, 'Food & Dining', 420.00, 'EXPENSE', 'Lotus Hypermarket Groceries & Meals', '2026-09-12', '2026-10-07 03:52:15'),
(20, 1, 1, 'Entertainment', 149.00, 'EXPENSE', 'Anytime Fitness Monthly Subscription', '2026-09-15', '2026-10-07 03:52:15'),
(21, 1, 1, 'Transfer', 120.00, 'EXPENSE', 'Transfer to CIMB Bank - F&B Bill Split', '2026-09-20', '2026-10-07 03:52:15'),
(22, 1, 1, 'Investment', 500.00, 'INVESTMENT', 'StashAway MY DCA', '2026-09-05', '2026-10-07 03:52:15'),
(23, 1, 1, 'Salary', 4200.00, 'INCOME', 'Monthly Tech Engineering Salary', '2026-08-01', '2026-10-07 03:52:15'),
(24, 1, 1, 'Rent', 900.00, 'EXPENSE', 'Penang Island Condo Rental Transfer', '2026-08-02', '2026-10-07 03:52:15'),
(25, 1, 1, 'Bills & Utilities', 192.00, 'EXPENSE', 'TNB Electricity Bill', '2026-08-04', '2026-10-07 03:52:15'),
(26, 1, 1, 'Food & Dining', 380.00, 'EXPENSE', 'Village Grocer Queensbay & Cafes', '2026-08-16', '2026-10-07 03:52:15'),
(27, 1, 1, 'Entertainment', 149.00, 'EXPENSE', 'Anytime Fitness Monthly Subscription', '2026-08-15', '2026-10-07 03:52:15'),
(28, 1, 1, 'Transfer', 80.00, 'EXPENSE', 'Transfer to Public Bank - Badminton Court Booking', '2026-08-22', '2026-10-07 03:52:15'),
(29, 1, 1, 'Investment', 500.00, 'INVESTMENT', 'StashAway MY DCA', '2026-08-05', '2026-10-07 03:52:15'),
(30, 1, 1, 'Salary', 4200.00, 'INCOME', 'Monthly Tech Engineering Salary', '2026-07-01', '2026-10-07 03:52:15'),
(31, 1, 1, 'Rent', 900.00, 'EXPENSE', 'Penang Island Condo Rental Transfer', '2026-07-02', '2026-10-07 03:52:15'),
(32, 1, 1, 'Bills & Utilities', 165.00, 'EXPENSE', 'TNB Electricity Bill', '2026-07-03', '2026-10-07 03:52:15'),
(33, 1, 1, 'Food & Dining', 450.00, 'EXPENSE', 'Groceries & Dining Out', '2026-07-14', '2026-10-07 03:52:15'),
(34, 1, 1, 'Entertainment', 149.00, 'EXPENSE', 'Anytime Fitness Monthly Subscription', '2026-07-15', '2026-10-07 03:52:15'),
(35, 1, 1, 'Investment', 500.00, 'INVESTMENT', 'StashAway MY DCA', '2026-07-05', '2026-10-07 03:52:15'),
(36, 1, 1, 'Salary', 4200.00, 'INCOME', 'Monthly Tech Engineering Salary', '2026-06-01', '2026-10-07 03:52:15'),
(37, 1, 1, 'Salary', 1000.00, 'INCOME', 'Freelance Web Project Milestone Payment', '2026-06-18', '2026-10-07 03:52:15'),
(38, 1, 1, 'Rent', 900.00, 'EXPENSE', 'Penang Island Condo Rental Transfer', '2026-06-02', '2026-10-07 03:52:15'),
(39, 1, 1, 'Food & Dining', 510.00, 'EXPENSE', 'Birthday Celebration & Meals', '2026-06-16', '2026-10-07 03:52:15'),
(40, 1, 1, 'Investment', 500.00, 'INVESTMENT', 'StashAway MY DCA', '2026-06-05', '2026-10-07 03:52:15'),
(41, 1, 1, 'Transfer', 40.00, 'EXPENSE', 'Transfer to Maybank (111111111111) - Cinema', '2026-10-07', '2026-10-07 04:09:48'),
(42, 4, 5, 'Top-Up / Deposit', 250.00, 'INCOME', 'FPX Online Reload via Maybank2u (Ref: FPXDF4C2D95)', '2026-10-15', '2026-10-14 16:29:40'),
(43, 4, 5, 'Food & Dining', 20.00, 'EXPENSE', 'DuitNow QR: 00020201021126420014A00000061500 - DuitNow Transfer', '2026-10-15', '2026-10-14 16:37:39'),
(44, 2, 3, 'Food & Dining', 20.00, 'EXPENSE', 'DuitNow QR: 00020201021126440014A00000061500 - DuitNow Transfer', '2026-10-15', '2026-10-15 03:25:42'),
(45, 2, 3, 'Transfer', 200.00, 'EXPENSE', 'Transfer to Maybank (111111111111) - Funds Transfer', '2026-10-15', '2026-10-15 03:27:24'),
(48, 2, 3, 'Utilities', 10.00, 'EXPENSE', '00020201021126420014A00000061500 (DuitNow Transfer) - DN-CAFFA42E', '2026-10-15', '2026-10-15 03:43:46');

-- --------------------------------------------------------

--
-- Table structure for table `transfers`
--

CREATE TABLE `transfers` (
  `transfer_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `recipient_account` varchar(100) NOT NULL,
  `recipient_bank` varchar(50) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `transfers`
--

INSERT INTO `transfers` (`transfer_id`, `user_id`, `recipient_account`, `recipient_bank`, `amount`, `created_at`) VALUES
(1, 1, '111111111111', 'Maybank', 10.00, '2026-08-26 07:33:17');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `google_id` varchar(100) DEFAULT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `monthly_income` decimal(12,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `full_name`, `email`, `password_hash`, `google_id`, `phone_number`, `monthly_income`, `created_at`) VALUES
(1, 'Navein Rajan', 'navein@example.com', '$2y$10$demoHashedPasswordDummyValue12345', NULL, NULL, 4200.00, '2026-08-26 07:28:52'),
(2, 'NR DIGITALS', 'nrdigitals.media@gmail.com', '', '114957963934187567729', NULL, 4500.00, '2026-10-13 06:45:43'),
(3, 'Navein A/L Rajanderan', 'p23015451@student.newinti.edu.my', '', '103525574051822639004', NULL, 4500.00, '2026-10-14 15:40:16'),
(4, 'Car Music', 'carmusic959@gmail.com', '', '105896593939145230806', NULL, 1700.00, '2026-10-14 15:57:33');

-- --------------------------------------------------------

--
-- Table structure for table `wallets`
--

CREATE TABLE `wallets` (
  `wallet_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `total_balance` decimal(12,2) DEFAULT 0.00,
  `total_income` decimal(12,2) DEFAULT 0.00,
  `total_expense` decimal(12,2) DEFAULT 0.00,
  `total_invested` decimal(12,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `wallets`
--

INSERT INTO `wallets` (`wallet_id`, `user_id`, `total_balance`, `total_income`, `total_expense`, `total_invested`) VALUES
(1, 1, 12300.00, 4200.00, 2330.00, 3500.00),
(2, 1, 12340.00, 25200.00, 13420.00, 4500.00),
(3, 2, 11770.00, 12000.00, 230.00, 0.00),
(4, 3, 0.00, 0.00, 0.00, 0.00),
(5, 4, 230.00, 250.00, 20.00, 0.00);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `analytics_profiles`
--
ALTER TABLE `analytics_profiles`
  ADD PRIMARY KEY (`analytics_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `budgets`
--
ALTER TABLE `budgets`
  ADD PRIMARY KEY (`budget_id`),
  ADD UNIQUE KEY `user_category` (`user_id`,`category`);

--
-- Indexes for table `category_budgets`
--
ALTER TABLE `category_budgets`
  ADD PRIMARY KEY (`budget_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`payment_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `simulation_records`
--
ALTER TABLE `simulation_records`
  ADD PRIMARY KEY (`simulation_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`transaction_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `wallet_id` (`wallet_id`);

--
-- Indexes for table `transfers`
--
ALTER TABLE `transfers`
  ADD PRIMARY KEY (`transfer_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `wallets`
--
ALTER TABLE `wallets`
  ADD PRIMARY KEY (`wallet_id`),
  ADD KEY `user_id` (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `analytics_profiles`
--
ALTER TABLE `analytics_profiles`
  MODIFY `analytics_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `budgets`
--
ALTER TABLE `budgets`
  MODIFY `budget_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `category_budgets`
--
ALTER TABLE `category_budgets`
  MODIFY `budget_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `payment_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `simulation_records`
--
ALTER TABLE `simulation_records`
  MODIFY `simulation_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `transactions`
--
ALTER TABLE `transactions`
  MODIFY `transaction_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=49;

--
-- AUTO_INCREMENT for table `transfers`
--
ALTER TABLE `transfers`
  MODIFY `transfer_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `wallets`
--
ALTER TABLE `wallets`
  MODIFY `wallet_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `analytics_profiles`
--
ALTER TABLE `analytics_profiles`
  ADD CONSTRAINT `analytics_profiles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `category_budgets`
--
ALTER TABLE `category_budgets`
  ADD CONSTRAINT `category_budgets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `simulation_records`
--
ALTER TABLE `simulation_records`
  ADD CONSTRAINT `simulation_records_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `transactions`
--
ALTER TABLE `transactions`
  ADD CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `transactions_ibfk_2` FOREIGN KEY (`wallet_id`) REFERENCES `wallets` (`wallet_id`) ON DELETE CASCADE;

--
-- Constraints for table `transfers`
--
ALTER TABLE `transfers`
  ADD CONSTRAINT `transfers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `wallets`
--
ALTER TABLE `wallets`
  ADD CONSTRAINT `wallets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
