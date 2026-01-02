-- phpMyAdmin SQL Dump
-- version 4.9.0.1
-- https://www.phpmyadmin.net/
--
-- Host: sql105.infinityfree.com
-- Generation Time: Jan 01, 2026 at 12:16 AM
-- Server version: 11.4.9-MariaDB
-- PHP Version: 7.2.22

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `if0_38400422_hr_ttv`
--

-- --------------------------------------------------------

--
-- Table structure for table `applications`
--

CREATE TABLE `applications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `position_id` int(11) NOT NULL,
  `upload_path` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cover_letter` longtext DEFAULT NULL COMMENT 'Plain text cover letter only',
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `applications`
--

INSERT INTO `applications` (`id`, `user_id`, `position_id`, `upload_path`, `cover_letter`, `status`, `created_at`, `updated_at`, `updated_by`) VALUES
(59, 2, 8, '[]', 'สวัสดี', 'pending', '2025-05-21 03:09:59', '2025-05-21 03:09:59', NULL),
(60, 2, 6, '[]', '-', 'approved', '2025-05-29 23:12:59', '2025-05-31 21:38:43', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `application_details`
--

CREATE TABLE `application_details` (
  `id` int(11) NOT NULL,
  `application_id` int(11) NOT NULL,
  `fullname` varchar(100) DEFAULT NULL,
  `registered_address` text DEFAULT NULL,
  `present_address` text DEFAULT NULL,
  `telephone` varchar(20) DEFAULT NULL,
  `mobile` varchar(20) DEFAULT NULL,
  `marital_status` varchar(20) DEFAULT NULL,
  `birthplace` varchar(100) DEFAULT NULL,
  `birthdate` date DEFAULT NULL,
  `age` int(3) DEFAULT NULL,
  `weight` int(3) DEFAULT NULL,
  `height` int(3) DEFAULT NULL,
  `nationality` varchar(50) DEFAULT NULL,
  `race` varchar(50) DEFAULT NULL,
  `religion` varchar(50) DEFAULT NULL,
  `id_card` varchar(20) DEFAULT NULL,
  `issued_at` varchar(100) DEFAULT NULL,
  `issued_date` date DEFAULT NULL,
  `photo_path` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `military_service` varchar(20) DEFAULT NULL,
  `military_service_when` varchar(100) DEFAULT NULL,
  `military_service_exempt_reason` varchar(255) DEFAULT NULL,
  `emergency_contact_name` varchar(100) DEFAULT NULL,
  `emergency_contact_address` text DEFAULT NULL,
  `emergency_contact_tel` varchar(20) DEFAULT NULL,
  `emergency_contact_relationship` varchar(50) DEFAULT NULL,
  `desired_salary` varchar(50) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `application_details`
--

INSERT INTO `application_details` (`id`, `application_id`, `fullname`, `registered_address`, `present_address`, `telephone`, `mobile`, `marital_status`, `birthplace`, `birthdate`, `age`, `weight`, `height`, `nationality`, `race`, `religion`, `id_card`, `issued_at`, `issued_date`, `photo_path`, `created_at`, `military_service`, `military_service_when`, `military_service_exempt_reason`, `emergency_contact_name`, `emergency_contact_address`, `emergency_contact_tel`, `emergency_contact_relationship`, `desired_salary`) VALUES
(52, 59, 'Chaiwat Sangsanit', '-', '-', '-', '098-6485736', '-', '-', NULL, 0, 0, 0, 'ไทย', 'ไทย', '-', '-', '-', NULL, 'uploads/photos/photo_2_20250521_100959_4de62418720b0c57.png', '2025-05-21 03:09:59', '-', '-', '-', '-', '-', '-', '-', '10'),
(53, 60, 'Chaiwat Sangsanit', '-', '-', '-', '0986485736', '-', '-', NULL, 0, 0, 0, 'ไทย', 'ไทย', '-', '-', '-', NULL, NULL, '2025-05-29 23:12:59', '-', '-', '-', '-', '-', '-', '-', '0');

-- --------------------------------------------------------

--
-- Table structure for table `application_drafts`
--

CREATE TABLE `application_drafts` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `position_id` int(11) NOT NULL,
  `data` longtext DEFAULT NULL COMMENT 'JSON format containing all application data',
  `resume_path` varchar(255) DEFAULT NULL COMMENT 'JSON array of attachments for draft',
  `photo_path` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `application_education`
--

CREATE TABLE `application_education` (
  `id` int(11) NOT NULL,
  `application_id` int(11) NOT NULL,
  `level` enum('secondary','preuni','vocational','college','university') NOT NULL,
  `period_from` varchar(20) DEFAULT NULL,
  `period_to` varchar(20) DEFAULT NULL,
  `institute` varchar(100) DEFAULT NULL,
  `degree` varchar(100) DEFAULT NULL,
  `major` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `contact_info`
--

CREATE TABLE `contact_info` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `address` text NOT NULL,
  `working_hours` varchar(100) NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `contact_info`
--

INSERT INTO `contact_info` (`id`, `name`, `email`, `phone`, `address`, `working_hours`, `updated_at`, `updated_by`) VALUES
(1, 'นายชัยวัฒน์ สังข์สนิท', 'chxlor@gmail.com', '098-648-5736', '225 ถนนภักดีบริรักษ์ อำเภอนางรอง จังหวัดบุรีรัมย์ บุรีรัมย์ 31110', 'จันทร์-ศุกร์ เวลา 08:00-17:00 น.', '2025-12-09 05:16:27', 20);

-- --------------------------------------------------------

--
-- Table structure for table `email_logs`
--

CREATE TABLE `email_logs` (
  `id` int(11) NOT NULL,
  `application_id` int(11) NOT NULL,
  `admin_id` int(11) NOT NULL,
  `email_to` varchar(255) NOT NULL,
  `email_subject` varchar(255) NOT NULL,
  `email_body` text NOT NULL,
  `interview_date` date DEFAULT NULL,
  `interview_time` time DEFAULT NULL,
  `interview_location` varchar(255) DEFAULT NULL,
  `interview_format` varchar(100) DEFAULT NULL,
  `interviewer_name` varchar(100) DEFAULT NULL,
  `confirmation_token` varchar(255) DEFAULT NULL,
  `template_id` varchar(100) DEFAULT NULL,
  `service_id` varchar(100) DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `future_opportunity_title` varchar(255) DEFAULT NULL,
  `future_opportunity_paragraph1` text DEFAULT NULL,
  `future_opportunity_paragraph2` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `email_logs`
--

INSERT INTO `email_logs` (`id`, `application_id`, `admin_id`, `email_to`, `email_subject`, `email_body`, `interview_date`, `interview_time`, `interview_location`, `interview_format`, `interviewer_name`, `confirmation_token`, `template_id`, `service_id`, `rejection_reason`, `created_at`, `future_opportunity_title`, `future_opportunity_paragraph1`, `future_opportunity_paragraph2`) VALUES
(35, 60, 1, 'chxlor@gmail.com', 'ยินดีด้วย! ใบสมัครของคุณผ่านการคัดเลือกแล้ว - IT Network Supervisor', 'เรียน คุณChaiwat Sangsanit\n\nเรายินดีที่จะแจ้งให้ทราบว่า ใบสมัครของคุณสำหรับตำแหน่ง IT Network Supervisor ได้ผ่านการพิจารณาเบื้องต้นแล้ว\n\nเราประทับใจในประสบการณ์และทักษะของคุณ และต้องการเชิญคุณเข้าร่วมการสัมภาษณ์เพื่อพูดคุยเกี่ยวกับโอกาสในการร่วมงานกับเรา\n\nโปรดยืนยันการเข้าร่วมสัมภาษณ์โดยการคลิกที่ลิงก์ด้านล่าง\n\nขอแสดงความนับถือ\nฝ่ายทรัพยากรบุคคล\nTTV SUPPLYCHAIN', '2025-04-18', '09:40:00', 'หน้าบริษัท', 'ณ สำนักงาน', 'ชัยวัฒน์', '93b18301223cdd950f6aae197932d286667579cb5afe392b66db9d5506de3284f364187604c619899a0b68f9e9378419', 'template_aftje05', 'service_1yhujb7', '', '2025-06-01 04:38:43', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `form_data`
--

CREATE TABLE `form_data` (
  `id` int(11) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `interview_confirmations`
--

CREATE TABLE `interview_confirmations` (
  `id` int(11) NOT NULL,
  `application_id` int(11) NOT NULL,
  `confirmed_at` datetime DEFAULT NULL,
  `interview_date` date NOT NULL,
  `interview_time` time DEFAULT NULL,
  `interview_location` varchar(255) DEFAULT NULL,
  `interview_format` varchar(100) DEFAULT NULL,
  `interviewer_name` varchar(100) DEFAULT NULL,
  `confirmation_token` varchar(255) NOT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `interview_confirmations`
--

INSERT INTO `interview_confirmations` (`id`, `application_id`, `confirmed_at`, `interview_date`, `interview_time`, `interview_location`, `interview_format`, `interviewer_name`, `confirmation_token`, `notes`, `created_at`, `updated_at`) VALUES
(8, 60, NULL, '2025-04-18', '09:40:00', 'หน้าบริษัท', 'ณ สำนักงาน', 'ชัยวัฒน์', '93b18301223cdd950f6aae197932d286667579cb5afe392b66db9d5506de3284f364187604c619899a0b68f9e9378419', NULL, '2025-06-01 04:38:43', '2025-06-01 04:38:43');

-- --------------------------------------------------------

--
-- Table structure for table `password_resets`
--

CREATE TABLE `password_resets` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `token` varchar(64) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `password_resets`
--

INSERT INTO `password_resets` (`id`, `user_id`, `token`, `expires_at`, `used`, `created_at`) VALUES
(32, 20, '5551a319e41e1717ea364a1d2b0d421dd508845931d09f8490571b71e16ec72d', '2025-12-09 12:08:03', 1, '2025-12-09 04:08:03');

-- --------------------------------------------------------

--
-- Table structure for table `positions`
--

CREATE TABLE `positions` (
  `id` int(11) NOT NULL,
  `title` varchar(100) NOT NULL,
  `department` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `requirements` text DEFAULT NULL,
  `salary_min` int(11) DEFAULT NULL,
  `salary_max` int(11) DEFAULT NULL,
  `location` varchar(100) DEFAULT NULL,
  `type` enum('Full-time','Part-time','Contract','Internship') DEFAULT 'Full-time',
  `status` enum('open','closed','draft') DEFAULT 'draft',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` int(11) DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `positions`
--

INSERT INTO `positions` (`id`, `title`, `department`, `description`, `requirements`, `salary_min`, `salary_max`, `location`, `type`, `status`, `created_at`, `updated_at`, `created_by`, `updated_by`) VALUES
(1, 'Senior Software Engineer', 'IT', 'พัฒนาและดูแลระบบหลักขององค์กร', '- ประสบการณ์ 5 ปีขึ้นไป\n- เชี่ยวชาญ PHP, JavaScript\n- มีประสบการณ์ด้าน Cloud', 80000, 120000, 'กรุงเทพฯ', 'Full-time', 'closed', '2025-02-19 06:42:23', '2025-12-09 05:13:13', 1, 20),
(2, 'UX/UI Designer', 'IT', 'ออกแบบและพัฒนา User Interface', '- ประสบการณ์ 3 ปีขึ้นไป\n- เชี่ยวชาญ Figma, Adobe XD', 45000, 75000, 'กรุงเทพฯ', 'Full-time', 'closed', '2025-02-19 06:42:23', '2025-12-09 05:13:20', 1, 20),
(3, 'Digital Marketing', 'Marketing', 'วางแผนและดำเนินการด้านการตลาดดิจิทัล', '- ประสบการณ์ 2 ปีขึ้นไป\n- เชี่ยวชาญ Google Ads, Facebook Ads', 35000, 55000, 'กรุงเทพฯ', 'Full-time', 'closed', '2025-02-19 06:42:23', '2025-12-09 05:13:25', 1, 20),
(6, 'IT Network Supervisor', 'IT', 'ดูแลระบบ Network ภายในบริษัททั้งหมด', 'อายุไม่เกิน 50 ปี\r\nประสบการณ์ 2 ปี ขึ้นไป', 16000, 30000, 'กรุงเทพฯ', 'Contract', 'closed', '2025-05-09 02:25:55', '2025-05-31 21:24:48', 1, 1),
(7, 'GG', 'IT', 'นอน', 'ไม่มี', 100000, 1000000, 'กรุงเทพฯ', 'Full-time', 'closed', '2025-05-20 01:16:47', '2025-05-20 06:57:07', 1, 20),
(8, 'ITv twest', 'IT', 'wasd', '20+', 10000, 150000, 'กรุงเทพฯ', 'Full-time', 'closed', '2025-05-20 06:56:26', '2025-05-31 19:22:07', 20, 1);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('user','admin') DEFAULT 'user',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `last_login` timestamp NULL DEFAULT NULL,
  `reset_token` varchar(64) DEFAULT NULL,
  `reset_token_expiry` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `phone`, `password`, `role`, `created_at`, `updated_at`, `last_login`, `reset_token`, `reset_token_expiry`) VALUES
(1, 'Admin User', 'admin@hr.ttv', '0812345678', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', '2025-02-19 06:42:23', '2025-07-21 12:29:41', '2025-07-21 12:29:41', NULL, NULL),
(2, 'Chaiwat Sangsanit', 'user@test.com', '0899999999', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', '2025-02-19 06:59:35', '2025-06-06 11:30:09', '2025-06-06 11:30:09', NULL, NULL),
(20, 'Chaiwat Sangsanit', 'chxlor@gmail.com', '098-648-5736', '$2y$10$Re1M4oDtZY/UBgLm82vGPO7CKNLP/I3GKul3MXd3dvygRm6n37BUG', 'admin', '2025-05-20 06:52:59', '2025-12-11 07:36:03', '2025-12-11 07:36:03', NULL, NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `applications`
--
ALTER TABLE `applications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `position_id` (`position_id`),
  ADD KEY `updated_by` (`updated_by`),
  ADD KEY `idx_application_status` (`status`),
  ADD KEY `idx_application_dates` (`created_at`,`updated_at`);
ALTER TABLE `applications` ADD FULLTEXT KEY `upload_path` (`upload_path`);

--
-- Indexes for table `application_details`
--
ALTER TABLE `application_details`
  ADD PRIMARY KEY (`id`),
  ADD KEY `application_id` (`application_id`),
  ADD KEY `idx_details_birthdate` (`birthdate`),
  ADD KEY `idx_details_id_card` (`id_card`);

--
-- Indexes for table `application_drafts`
--
ALTER TABLE `application_drafts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_position` (`user_id`,`position_id`),
  ADD KEY `position_id` (`position_id`);

--
-- Indexes for table `application_education`
--
ALTER TABLE `application_education`
  ADD PRIMARY KEY (`id`),
  ADD KEY `application_id` (`application_id`);

--
-- Indexes for table `contact_info`
--
ALTER TABLE `contact_info`
  ADD PRIMARY KEY (`id`),
  ADD KEY `updated_by` (`updated_by`);

--
-- Indexes for table `email_logs`
--
ALTER TABLE `email_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `application_id` (`application_id`),
  ADD KEY `admin_id` (`admin_id`);

--
-- Indexes for table `form_data`
--
ALTER TABLE `form_data`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `interview_confirmations`
--
ALTER TABLE `interview_confirmations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `application_id` (`application_id`);

--
-- Indexes for table `password_resets`
--
ALTER TABLE `password_resets`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `token` (`token`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `positions`
--
ALTER TABLE `positions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `updated_by` (`updated_by`),
  ADD KEY `idx_position_status` (`status`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_user_email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `applications`
--
ALTER TABLE `applications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=61;

--
-- AUTO_INCREMENT for table `application_details`
--
ALTER TABLE `application_details`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=54;

--
-- AUTO_INCREMENT for table `application_drafts`
--
ALTER TABLE `application_drafts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `application_education`
--
ALTER TABLE `application_education`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=123;

--
-- AUTO_INCREMENT for table `contact_info`
--
ALTER TABLE `contact_info`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `email_logs`
--
ALTER TABLE `email_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

--
-- AUTO_INCREMENT for table `form_data`
--
ALTER TABLE `form_data`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `interview_confirmations`
--
ALTER TABLE `interview_confirmations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `password_resets`
--
ALTER TABLE `password_resets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT for table `positions`
--
ALTER TABLE `positions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `applications`
--
ALTER TABLE `applications`
  ADD CONSTRAINT `applications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `applications_ibfk_2` FOREIGN KEY (`position_id`) REFERENCES `positions` (`id`),
  ADD CONSTRAINT `applications_ibfk_3` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `application_details`
--
ALTER TABLE `application_details`
  ADD CONSTRAINT `application_details_ibfk_1` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `application_drafts`
--
ALTER TABLE `application_drafts`
  ADD CONSTRAINT `application_drafts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `application_drafts_ibfk_2` FOREIGN KEY (`position_id`) REFERENCES `positions` (`id`);

--
-- Constraints for table `application_education`
--
ALTER TABLE `application_education`
  ADD CONSTRAINT `application_education_ibfk_1` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `contact_info`
--
ALTER TABLE `contact_info`
  ADD CONSTRAINT `contact_info_ibfk_1` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `email_logs`
--
ALTER TABLE `email_logs`
  ADD CONSTRAINT `email_logs_ibfk_1` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `email_logs_ibfk_2` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `interview_confirmations`
--
ALTER TABLE `interview_confirmations`
  ADD CONSTRAINT `interview_confirmations_ibfk_1` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `password_resets`
--
ALTER TABLE `password_resets`
  ADD CONSTRAINT `password_resets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `positions`
--
ALTER TABLE `positions`
  ADD CONSTRAINT `positions_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `positions_ibfk_2` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
