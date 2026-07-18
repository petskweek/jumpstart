CREATE DATABASE IF NOT EXISTS jumpstart CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE jumpstart;

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('student', 'company', 'admin') NOT NULL DEFAULT 'student',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_profiles (
  user_id INT UNSIGNED PRIMARY KEY,
  phone VARCHAR(50) NULL,
  school VARCHAR(255) NULL,
  program VARCHAR(255) NULL,
  year_level VARCHAR(30) NULL,
  student_number VARCHAR(100) NULL,
  skills TEXT NULL,
  preferred_industry VARCHAR(100) NULL,
  resume_path VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_student_profile_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS company_profiles (
  user_id INT UNSIGNED PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(100) NULL,
  phone VARCHAR(50) NULL,
  address VARCHAR(255) NULL,
  industry VARCHAR(100) NULL,
  description TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_company_profile_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS documents (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  document_type ENUM('resume', 'transcript', 'recommendation', 'other') NOT NULL DEFAULT 'other',
  original_name VARCHAR(255) NOT NULL,
  storage_path VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_document_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_documents_user (user_id, document_type)
);

CREATE TABLE IF NOT EXISTS job_postings (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id INT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  department VARCHAR(100) NULL,
  description TEXT NOT NULL,
  location VARCHAR(255) NULL,
  required_hours SMALLINT UNSIGNED NOT NULL,
  requirements TEXT NULL,
  status ENUM('draft', 'active', 'closed') NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_posting_company FOREIGN KEY (company_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_postings_company_status (company_id, status)
);

CREATE TABLE IF NOT EXISTS ojt_applications (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  job_posting_id INT UNSIGNED NULL,
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
  status ENUM('pending', 'reviewed', 'approved', 'rejected', 'withdrawn') NOT NULL DEFAULT 'pending',
  company_status ENUM('pending', 'accepted', 'rejected') NOT NULL DEFAULT 'pending',
  reviewed_by INT UNSIGNED NULL,
  reviewed_at DATETIME NULL,
  review_notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_application_student FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_application_posting FOREIGN KEY (job_posting_id) REFERENCES job_postings(id) ON DELETE SET NULL,
  CONSTRAINT fk_application_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_applications_student_status (user_id, status),
  INDEX idx_applications_posting_status (job_posting_id, status)
);

CREATE TABLE IF NOT EXISTS placements (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  application_id INT UNSIGNED NOT NULL UNIQUE,
  student_id INT UNSIGNED NOT NULL,
  company_id INT UNSIGNED NOT NULL,
  job_posting_id INT UNSIGNED NULL,
  start_date DATE NOT NULL,
  end_date DATE NULL,
  required_hours SMALLINT UNSIGNED NOT NULL,
  status ENUM('pending', 'active', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  approved_by INT UNSIGNED NULL,
  approved_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_placement_application FOREIGN KEY (application_id) REFERENCES ojt_applications(id) ON DELETE CASCADE,
  CONSTRAINT fk_placement_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_placement_company FOREIGN KEY (company_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_placement_posting FOREIGN KEY (job_posting_id) REFERENCES job_postings(id) ON DELETE SET NULL,
  CONSTRAINT fk_placement_approver FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_placements_company_status (company_id, status),
  INDEX idx_placements_student_status (student_id, status)
);

CREATE TABLE IF NOT EXISTS time_records (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  placement_id INT UNSIGNED NOT NULL,
  work_date DATE NOT NULL,
  clock_in DATETIME NULL,
  clock_out DATETIME NULL,
  hours_worked DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  status ENUM('open', 'submitted', 'approved', 'rejected') NOT NULL DEFAULT 'open',
  approved_by INT UNSIGNED NULL,
  approved_at DATETIME NULL,
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_time_record_placement FOREIGN KEY (placement_id) REFERENCES placements(id) ON DELETE CASCADE,
  CONSTRAINT fk_time_record_approver FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY uq_time_record_day (placement_id, work_date),
  INDEX idx_time_records_status (placement_id, status)
);

CREATE TABLE IF NOT EXISTS evaluations (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  placement_id INT UNSIGNED NOT NULL,
  evaluator_id INT UNSIGNED NOT NULL,
  period_type ENUM('weekly', 'monthly', 'final') NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  work_quality TINYINT UNSIGNED NULL,
  attendance TINYINT UNSIGNED NULL,
  communication TINYINT UNSIGNED NULL,
  overall_score DECIMAL(3,2) NULL,
  comments TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_evaluation_placement FOREIGN KEY (placement_id) REFERENCES placements(id) ON DELETE CASCADE,
  CONSTRAINT fk_evaluation_evaluator FOREIGN KEY (evaluator_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_evaluation_period (placement_id, period_type, period_start, period_end),
  INDEX idx_evaluations_placement (placement_id, period_type)
);

CREATE TABLE IF NOT EXISTS generated_reports (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  generated_by INT UNSIGNED NOT NULL,
  report_type ENUM('student_placement', 'ojt_progress', 'system_records') NOT NULL,
  filters_json JSON NULL,
  storage_path VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_report_generator FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_reports_type_created (report_type, created_at)
);
