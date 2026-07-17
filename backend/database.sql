CREATE DATABASE IF NOT EXISTS jumpstart CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE jumpstart;

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('student', 'company', 'admin') NOT NULL DEFAULT 'student',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ojt_applications (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  school VARCHAR(255) NOT NULL,
  program VARCHAR(255) NOT NULL,
  year_level VARCHAR(30) NOT NULL,
  student_id VARCHAR(100) NOT NULL,
  preferred_industry VARCHAR(100) NOT NULL,
  required_hours SMALLINT UNSIGNED NOT NULL,
  preferred_start_date DATE NOT NULL,
  skills TEXT NULL,
  motivation TEXT NOT NULL,
  resume_path VARCHAR(255) NOT NULL,
  transcript_path VARCHAR(255) NULL,
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ojt_application_user FOREIGN KEY (user_id) REFERENCES users(id)
);
