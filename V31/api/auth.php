<?php
/**
 * Authentication API
 * Endpoints: login, logout, check
 * 
 * Security features:
 * - Rate limiting for login attempts
 * - Session regeneration on login
 * - Secure session handling
 * - CSRF token generation
 */

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/ApiResponse.php';
require_once __DIR__ . '/../includes/RequestHelper.php';
require_once __DIR__ . '/../includes/SecurityHeaders.php';
require_once __DIR__ . '/../includes/RateLimiter.php';
require_once __DIR__ . '/../includes/CsrfProtection.php';
require_once __DIR__ . '/../includes/InputValidator.php';

// Apply security headers
SecurityHeaders::apply();
RequestHelper::setJsonHeader();

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'login':
        handleLogin();
        break;
    case 'logout':
        handleLogout();
        break;
    case 'check':
        checkAuth();
        break;
    case 'csrf':
        getCsrfToken();
        break;
    default:
        ApiResponse::error('Invalid action');
}

function handleLogin()
{
    $data = RequestHelper::getJsonInput();

    // Validate input
    $username = InputValidator::cleanString($data['username'] ?? '');
    $password = $data['password'] ?? '';

    if (empty($username) || empty($password)) {
        ApiResponse::error('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
    }

    // Check rate limiting
    $rateCheck = RateLimiter::check('login', $username);
    if (!$rateCheck['allowed']) {
        $retryMinutes = ceil($rateCheck['retry_after'] / 60);
        ApiResponse::error(
            "เข้าสู่ระบบล้มเหลวหลายครั้ง กรุณารอ {$retryMinutes} นาที",
            ['retry_after' => $rateCheck['retry_after']],
            429
        );
    }

    $user = db()->fetchOne(
        "SELECT * FROM users WHERE username = ?",
        [$username]
    );

    if (!$user || !password_verify($password, $user['password'])) {
        // Record failed attempt
        RateLimiter::recordFailure('login', $username);

        $remaining = RateLimiter::getRemainingAttempts('login', $username);
        $message = 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
        if ($remaining > 0 && $remaining <= 3) {
            $message .= " (เหลืออีก {$remaining} ครั้ง)";
        }

        ApiResponse::error($message);
    }

    // Login successful - reset rate limiter
    RateLimiter::reset('login', $username);

    // Regenerate session ID to prevent session fixation
    session_regenerate_id(true);

    // Set session data
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['username'] = $user['username'];
    $_SESSION['full_name'] = $user['full_name'];
    $_SESSION['role'] = $user['role'];
    $_SESSION['login_time'] = time();
    $_SESSION['ip_address'] = RateLimiter::getClientIp();

    // Generate CSRF token for subsequent requests
    $csrfToken = CsrfProtection::generateToken();

    ApiResponse::success('เข้าสู่ระบบสำเร็จ', [
        'user' => [
            'id' => $user['id'],
            'username' => $user['username'],
            'full_name' => $user['full_name'],
            'role' => $user['role']
        ],
        'csrf_token' => $csrfToken
    ]);
}

function handleLogout()
{
    // Clear all session data
    $_SESSION = [];

    // Delete session cookie
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(
            session_name(),
            '',
            time() - 42000,
            $params['path'],
            $params['domain'],
            $params['secure'],
            $params['httponly']
        );
    }

    // Destroy session
    session_destroy();

    ApiResponse::success('ออกจากระบบสำเร็จ');
}

function checkAuth()
{
    if (isset($_SESSION['user_id'])) {
        // Validate session hasn't been hijacked (basic IP check)
        $currentIp = RateLimiter::getClientIp();
        $sessionIp = $_SESSION['ip_address'] ?? $currentIp;

        // Note: IP validation can be too strict for mobile users
        // Uncomment if you want strict IP binding:
        // if ($currentIp !== $sessionIp) {
        //     handleLogout();
        //     ApiResponse::error('Session invalidated due to IP change');
        // }

        ApiResponse::success('Authenticated', [
            'user' => [
                'id' => $_SESSION['user_id'],
                'username' => $_SESSION['username'],
                'full_name' => $_SESSION['full_name'],
                'role' => $_SESSION['role']
            ],
            'csrf_token' => CsrfProtection::getToken()
        ]);
    } else {
        ApiResponse::error('Not authenticated');
    }
}

function getCsrfToken()
{
    // Only provide CSRF token to authenticated users
    if (!isset($_SESSION['user_id'])) {
        ApiResponse::error('Not authenticated', [], 401);
    }

    ApiResponse::success('Token generated', CsrfProtection::getTokenData());
}
