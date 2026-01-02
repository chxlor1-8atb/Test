<?php
/**
 * Shop License Management System - Configuration
 * 
 * Security-enhanced configuration file
 */

// =============================================================================
// ENVIRONMENT DETECTION
// =============================================================================
$httpHost = $_SERVER['HTTP_HOST'] ?? $_SERVER['SERVER_NAME'] ?? 'localhost';
define('IS_PRODUCTION', !in_array($httpHost, ['localhost', '127.0.0.1', '::1']));
define('IS_HTTPS', (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
    || ($_SERVER['SERVER_PORT'] ?? 80) == 443
    || (!empty($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https'));

// =============================================================================
// DATABASE CONFIGURATION
// =============================================================================
define('DB_HOST', 'localhost');
define('DB_NAME', 'if0_40655723_shoplicense');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// =============================================================================
// SESSION SECURITY CONFIGURATION
// =============================================================================
// Session timeout in seconds (30 minutes)
define('SESSION_TIMEOUT', 1800);

// Session cookie settings
ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
ini_set('session.use_strict_mode', 1);
ini_set('session.cookie_samesite', 'Lax');

// Production-only secure settings
if (IS_PRODUCTION && IS_HTTPS) {
    ini_set('session.cookie_secure', 1);
}

// Start session
session_start();

// Check session timeout
if (isset($_SESSION['last_activity'])) {
    if (time() - $_SESSION['last_activity'] > SESSION_TIMEOUT) {
        // Session has expired
        session_unset();
        session_destroy();
        session_start();
    }
}
$_SESSION['last_activity'] = time();

// =============================================================================
// ERROR HANDLING
// =============================================================================
if (IS_PRODUCTION) {
    // Production: Hide errors, log them
    error_reporting(E_ALL);
    ini_set('display_errors', 0);
    ini_set('log_errors', 1);
    // Update this path for your production server
    // ini_set('error_log', '/path/to/error.log');
} else {
    // Development: Show errors
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
}

// =============================================================================
// TIMEZONE
// =============================================================================
date_default_timezone_set('Asia/Bangkok');

// =============================================================================
// APPLICATION SETTINGS
// =============================================================================
define('APP_NAME', 'ระบบจัดการใบอนุญาตร้านค้า');
define('APP_VERSION', '1.0.0');

// CORS Headers for API - Commented out to prevent session issues
// These should be set in individual API endpoints if needed
/*
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=UTF-8');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
*/
