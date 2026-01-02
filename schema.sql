-- Partial Reset: Drop tables if they exist to ensure clean slate
DROP TABLE IF EXISTS notification_logs CASCADE;
DROP TABLE IF EXISTS notification_settings CASCADE;
DROP TABLE IF EXISTS licenses CASCADE;
DROP TABLE IF EXISTS license_types CASCADE;
DROP TABLE IF EXISTS shops CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    email VARCHAR(255),
    phone VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Shops Table
CREATE TABLE shops (
    id SERIAL PRIMARY KEY,
    shop_code VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    owner_name VARCHAR(255),
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    notes TEXT,
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- License Types Table
CREATE TABLE license_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    validity_period INT NOT NULL DEFAULT 365,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Licenses Table
CREATE TABLE licenses (
    id SERIAL PRIMARY KEY,
    license_number VARCHAR(100),
    shop_id INT REFERENCES shops(id) ON DELETE CASCADE,
    license_type_id INT REFERENCES license_types(id) ON DELETE SET NULL,
    issue_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    notes TEXT,
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notification Settings Table
CREATE TABLE notification_settings (
    id INT PRIMARY KEY,
    telegram_bot_token VARCHAR(255),
    telegram_chat_id VARCHAR(255),
    days_before_expiry INT DEFAULT 30,
    is_active BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notification Logs Table
CREATE TABLE notification_logs (
    id SERIAL PRIMARY KEY,
    license_id INT REFERENCES licenses(id) ON DELETE SET NULL,
    message TEXT,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50),
    error_message TEXT
);

-- Initial Admin User
-- Password: 'password' -> Hash: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
INSERT INTO users (full_name, username, password, role) 
VALUES ('Admin User', 'admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin');

-- Default License Types
INSERT INTO license_types (name, validity_period) VALUES 
('รายปี (Yearly)', 365),
('รายเดือน (Monthly)', 30);

-- Initialize notification settings
INSERT INTO notification_settings (id, days_before_expiry, is_active) 
VALUES (1, 30, false);
