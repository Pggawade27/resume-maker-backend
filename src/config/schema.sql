CREATE DATABASE IF NOT EXISTS resume_maker;
USE resume_maker;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS otps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_expires (expires_at)
);

CREATE TABLE IF NOT EXISTS templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  preview_icon VARCHAR(10) NOT NULL DEFAULT '📄',
  description VARCHAR(500) DEFAULT '',
  style_hint VARCHAR(100) DEFAULT '',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS resumes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) DEFAULT 'Untitled Resume',
  full_name VARCHAR(255) DEFAULT '',
  email VARCHAR(255) DEFAULT '',
  phone VARCHAR(50) DEFAULT '',
  skills TEXT,
  experience TEXT,
  education TEXT,
  summary TEXT,
  template_id INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE SET NULL
);

-- Add new columns to templates if upgrading existing DB
ALTER TABLE templates ADD COLUMN IF NOT EXISTS description VARCHAR(500) DEFAULT '';
ALTER TABLE templates ADD COLUMN IF NOT EXISTS style_hint VARCHAR(100) DEFAULT '';

-- Remove is_paid if upgrading existing DB
ALTER TABLE resumes DROP COLUMN IF EXISTS is_paid;

-- Set default template_id if null
ALTER TABLE resumes MODIFY COLUMN template_id INT DEFAULT 1;

INSERT INTO templates (id, name, description, style_hint) VALUES
  (1, 'Jake''s Resume', 'Clean single-column ATS-friendly layout inspired by classic LaTeX templates', 'single-col'),
  (2, 'Awesome CV', 'Two-column with dark gradient header and sidebar — modern and striking', 'two-col-sidebar'),
  (3, 'ModernCV Classic', 'Professional with blue gradient accent bar and clean typography', 'classic'),
  (4, 'AltaCV', 'Teal-accented two-column with circular avatar header', 'two-col-teal'),
  (5, 'Deedy Resume', 'Tech-focused with bold dark header and yellow accents', 'dark-header'),
  (6, 'Crisp Minimal', 'Ultra-minimal with elegant serif name and lavender-pink accents', 'minimal')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  style_hint = VALUES(style_hint);
