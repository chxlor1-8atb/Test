-- PostgreSQL Schema for Shop License System
-- Converted from MySQL for Neon database

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Shops table
CREATE TABLE IF NOT EXISTS shops (
    id SERIAL PRIMARY KEY,
    shop_code VARCHAR(50),
    shop_name VARCHAR(255) NOT NULL,
    owner_name VARCHAR(100),
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(100),
    tax_id VARCHAR(20),
    status VARCHAR(20) DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    updated_by INTEGER REFERENCES users(id)
);

-- License Types table
CREATE TABLE IF NOT EXISTS license_types (
    id SERIAL PRIMARY KEY,
    type_name VARCHAR(100) NOT NULL,
    description TEXT,
    validity_period INTEGER DEFAULT 365,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Licenses table
CREATE TABLE IF NOT EXISTS licenses (
    id SERIAL PRIMARY KEY,
    shop_id INTEGER REFERENCES shops(id) ON DELETE CASCADE,
    license_type_id INTEGER REFERENCES license_types(id),
    license_number VARCHAR(100),
    issue_date DATE,
    expiry_date DATE,
    status VARCHAR(20) DEFAULT 'active',
    notes TEXT,
    file_path VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    updated_by INTEGER REFERENCES users(id)
);

-- Notification Settings table
CREATE TABLE IF NOT EXISTS notification_settings (
    id INTEGER PRIMARY KEY,
    telegram_bot_token VARCHAR(255),
    telegram_chat_id VARCHAR(100),
    days_before_expiry INTEGER DEFAULT 30,
    is_active INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notification Logs table
CREATE TABLE IF NOT EXISTS notification_logs (
    id SERIAL PRIMARY KEY,
    license_id INTEGER REFERENCES licenses(id) ON DELETE CASCADE,
    status VARCHAR(20),
    message TEXT,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin user (password: password)
INSERT INTO users (username, full_name, email, password, role) 
VALUES ('admin', 'Administrator', 'admin@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Insert sample license types
INSERT INTO license_types (type_name, description, validity_period) VALUES
('ใบอนุญาตขายสุรา', 'ใบอนุญาตขายสุราประเภทต่างๆ', 365),
('ใบอนุญาตขายบุหรี่', 'ใบอนุญาตขายบุหรี่และยาสูบ', 365),
('ใบอนุญาตขายอาหาร', 'ใบอนุญาตประกอบกิจการอาหาร', 365),
('ใบอนุญาตสถานประกอบการ', 'ใบอนุญาตตั้งสถานประกอบการ', 365)
ON CONFLICT DO NOTHING;

-- ==========================================
-- HR / Job Application System Schema
-- ==========================================

-- Positions table
CREATE TABLE IF NOT EXISTS positions (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    description TEXT,
    requirements TEXT,
    salary_min INTEGER,
    salary_max INTEGER,
    location VARCHAR(100),
    type VARCHAR(20) DEFAULT 'Full-time',
    status VARCHAR(20) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    updated_by INTEGER REFERENCES users(id)
);

-- Applications table
CREATE TABLE IF NOT EXISTS applications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    position_id INTEGER REFERENCES positions(id),
    upload_path TEXT,
    cover_letter TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES users(id)
);

-- Application Details table
CREATE TABLE IF NOT EXISTS application_details (
    id SERIAL PRIMARY KEY,
    application_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
    fullname VARCHAR(100),
    registered_address TEXT,
    present_address TEXT,
    telephone VARCHAR(20),
    mobile VARCHAR(20),
    marital_status VARCHAR(20),
    birthplace VARCHAR(100),
    birthdate DATE,
    age INTEGER,
    weight INTEGER,
    height INTEGER,
    nationality VARCHAR(50),
    race VARCHAR(50),
    religion VARCHAR(50),
    id_card VARCHAR(20),
    issued_at VARCHAR(100),
    issued_date DATE,
    photo_path VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    military_service VARCHAR(20),
    military_service_when VARCHAR(100),
    military_service_exempt_reason VARCHAR(255),
    emergency_contact_name VARCHAR(100),
    emergency_contact_address TEXT,
    emergency_contact_tel VARCHAR(20),
    emergency_contact_relationship VARCHAR(50),
    desired_salary VARCHAR(50) DEFAULT '0'
);

-- Application Drafts table
CREATE TABLE IF NOT EXISTS application_drafts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    position_id INTEGER REFERENCES positions(id),
    data TEXT,
    resume_path VARCHAR(255),
    photo_path VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Application Education table
CREATE TABLE IF NOT EXISTS application_education (
    id SERIAL PRIMARY KEY,
    application_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
    level VARCHAR(20) NOT NULL,
    period_from VARCHAR(20),
    period_to VARCHAR(20),
    institute VARCHAR(100),
    degree VARCHAR(100),
    major VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contact Info table
CREATE TABLE IF NOT EXISTS contact_info (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    working_hours VARCHAR(100) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES users(id)
);

-- Email Logs table
CREATE TABLE IF NOT EXISTS email_logs (
    id SERIAL PRIMARY KEY,
    application_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
    admin_id INTEGER REFERENCES users(id),
    email_to VARCHAR(255) NOT NULL,
    email_subject VARCHAR(255) NOT NULL,
    email_body TEXT NOT NULL,
    interview_date DATE,
    interview_time TIME,
    interview_location VARCHAR(255),
    interview_format VARCHAR(100),
    interviewer_name VARCHAR(100),
    confirmation_token VARCHAR(255),
    template_id VARCHAR(100),
    service_id VARCHAR(100),
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    future_opportunity_title VARCHAR(255),
    future_opportunity_paragraph1 TEXT,
    future_opportunity_paragraph2 TEXT
);

-- Form Data table
CREATE TABLE IF NOT EXISTS form_data (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Interview Confirmations table
CREATE TABLE IF NOT EXISTS interview_confirmations (
    id SERIAL PRIMARY KEY,
    application_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
    confirmed_at TIMESTAMP,
    interview_date DATE NOT NULL,
    interview_time TIME,
    interview_location VARCHAR(255),
    interview_format VARCHAR(100),
    interviewer_name VARCHAR(100),
    confirmation_token VARCHAR(255) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Password Resets table
CREATE TABLE IF NOT EXISTS password_resets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert Sample Data (Migrations from dump)
-- Users (Merging with existing)
INSERT INTO users (username, full_name, email, password, role) VALUES
('chxlor', 'Chaiwat Sangsanit', 'chxlor@gmail.com', '$2y$10$Re1M4oDtZY/UBgLm82vGPO7CKNLP/I3GKul3MXd3dvygRm6n37BUG', 'admin'),
('user', 'User Test', 'user@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user')
ON CONFLICT (username) DO NOTHING;

-- Positions
INSERT INTO positions (title, department, description, requirements, salary_min, salary_max, location, type, status) VALUES
('Senior Software Engineer', 'IT', 'พัฒนาและดูแลระบบหลักขององค์กร', '- ประสบการณ์ 5 ปีขึ้นไป\n- เชี่ยวชาญ PHP, JavaScript', 80000, 120000, 'กรุงเทพฯ', 'Full-time', 'closed'),
('UX/UI Designer', 'IT', 'ออกแบบและพัฒนา User Interface', '- ประสบการณ์ 3 ปีขึ้นไป\n- เชี่ยวชาญ Figma, Adobe XD', 45000, 75000, 'กรุงเทพฯ', 'Full-time', 'closed'),
('Digital Marketing', 'Marketing', 'วางแผนและดำเนินการด้านการตลาดดิจิทัล', '- ประสบการณ์ 2 ปีขึ้นไป\n- เชี่ยวชาญ Google Ads, Facebook Ads', 35000, 55000, 'กรุงเทพฯ', 'Full-time', 'closed'),
('IT Network Supervisor', 'IT', 'ดูแลระบบ Network ภายในบริษัททั้งหมด', 'อายุไม่เกิน 50 ปี\r\nประสบการณ์ 2 ปี ขึ้นไป', 16000, 30000, 'กรุงเทพฯ', 'Contract', 'closed');

-- Contact Info
INSERT INTO contact_info (name, email, phone, address, working_hours) VALUES
('นายชัยวัฒน์ สังข์สนิท', 'chxlor@gmail.com', '098-648-5736', '225 ถนนภักดีบริรักษ์ อำเภอนางรอง จังหวัดบุรีรัมย์ บุรีรัมย์ 31110', 'จันทร์-ศุกร์ เวลา 08:00-17:00 น.');
