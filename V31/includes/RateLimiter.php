<?php
/**
 * Rate Limiter
 * 
 * Session-based rate limiting to prevent brute force attacks
 * Suitable for shared hosting environments
 */

class RateLimiter
{
    private const SESSION_KEY = 'rate_limits';

    // Default configurations
    private const DEFAULT_LIMITS = [
        'login' => [
            'max_attempts' => 5,
            'window_seconds' => 900,     // 15 minutes
            'lockout_seconds' => 1800,   // 30 minutes lockout
        ],
        'api' => [
            'max_attempts' => 100,
            'window_seconds' => 60,      // 1 minute
            'lockout_seconds' => 300,    // 5 minutes lockout
        ],
        'password_reset' => [
            'max_attempts' => 3,
            'window_seconds' => 3600,    // 1 hour
            'lockout_seconds' => 3600,   // 1 hour lockout
        ],
    ];

    /**
     * Check if action is allowed and record attempt
     * 
     * @param string $action Action identifier (e.g., 'login', 'api')
     * @param string|null $identifier Additional identifier (e.g., username, IP)
     * @return array ['allowed' => bool, 'remaining' => int, 'retry_after' => int|null]
     */
    public static function check(string $action, ?string $identifier = null): array
    {
        $config = self::getConfig($action);
        $key = self::buildKey($action, $identifier);

        self::initSession();
        self::cleanExpired();

        $data = $_SESSION[self::SESSION_KEY][$key] ?? null;

        // Check if currently locked out
        if ($data && isset($data['locked_until'])) {
            if (time() < $data['locked_until']) {
                return [
                    'allowed' => false,
                    'remaining' => 0,
                    'retry_after' => $data['locked_until'] - time(),
                    'message' => 'ถูกระงับชั่วคราว กรุณาลองใหม่ภายหลัง'
                ];
            } else {
                // Lockout expired, reset
                unset($_SESSION[self::SESSION_KEY][$key]);
                $data = null;
            }
        }

        // Initialize if no data
        if (!$data) {
            $data = [
                'attempts' => 0,
                'window_start' => time(),
            ];
        }

        // Check if window has expired
        if (time() - $data['window_start'] > $config['window_seconds']) {
            $data = [
                'attempts' => 0,
                'window_start' => time(),
            ];
        }

        // Increment attempts
        $data['attempts']++;

        // Check if exceeded
        $remaining = max(0, $config['max_attempts'] - $data['attempts']);
        $allowed = $data['attempts'] <= $config['max_attempts'];

        // Apply lockout if exceeded
        if (!$allowed) {
            $data['locked_until'] = time() + $config['lockout_seconds'];
        }

        // Save state
        $_SESSION[self::SESSION_KEY][$key] = $data;

        return [
            'allowed' => $allowed,
            'remaining' => $remaining,
            'retry_after' => $allowed ? null : $config['lockout_seconds'],
            'message' => $allowed ? null : 'เกินจำนวนครั้งที่กำหนด กรุณาลองใหม่ภายหลัง'
        ];
    }

    /**
     * Record a failed attempt without checking
     * 
     * @param string $action
     * @param string|null $identifier
     */
    public static function recordFailure(string $action, ?string $identifier = null): void
    {
        self::check($action, $identifier);
    }

    /**
     * Reset attempts for an action (call on successful login)
     * 
     * @param string $action
     * @param string|null $identifier
     */
    public static function reset(string $action, ?string $identifier = null): void
    {
        self::initSession();
        $key = self::buildKey($action, $identifier);
        unset($_SESSION[self::SESSION_KEY][$key]);
    }

    /**
     * Get remaining attempts
     * 
     * @param string $action
     * @param string|null $identifier
     * @return int
     */
    public static function getRemainingAttempts(string $action, ?string $identifier = null): int
    {
        $config = self::getConfig($action);
        $key = self::buildKey($action, $identifier);

        self::initSession();

        $data = $_SESSION[self::SESSION_KEY][$key] ?? null;

        if (!$data) {
            return $config['max_attempts'];
        }

        // Check if locked
        if (isset($data['locked_until']) && time() < $data['locked_until']) {
            return 0;
        }

        // Check if window expired
        if (time() - $data['window_start'] > $config['window_seconds']) {
            return $config['max_attempts'];
        }

        return max(0, $config['max_attempts'] - $data['attempts']);
    }

    /**
     * Check and respond with error if rate limited
     * 
     * @param string $action
     * @param string|null $identifier
     * @return bool True if allowed, exits with error if not
     */
    public static function checkOrFail(string $action, ?string $identifier = null): bool
    {
        $result = self::check($action, $identifier);

        if (!$result['allowed']) {
            require_once __DIR__ . '/ApiResponse.php';
            http_response_code(429); // Too Many Requests
            ApiResponse::error(
                $result['message'],
                ['retry_after' => $result['retry_after']],
                429
            );
        }

        return true;
    }

    /**
     * Get configuration for action
     */
    private static function getConfig(string $action): array
    {
        return self::DEFAULT_LIMITS[$action] ?? self::DEFAULT_LIMITS['api'];
    }

    /**
     * Build storage key
     */
    private static function buildKey(string $action, ?string $identifier): string
    {
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $parts = [$action, $ip];

        if ($identifier) {
            $parts[] = md5($identifier);
        }

        return implode(':', $parts);
    }

    /**
     * Initialize session storage
     */
    private static function initSession(): void
    {
        if (!isset($_SESSION[self::SESSION_KEY])) {
            $_SESSION[self::SESSION_KEY] = [];
        }
    }

    /**
     * Clean expired entries
     */
    private static function cleanExpired(): void
    {
        if (!isset($_SESSION[self::SESSION_KEY])) {
            return;
        }

        $now = time();
        $maxWindow = max(array_column(self::DEFAULT_LIMITS, 'window_seconds'));
        $maxLockout = max(array_column(self::DEFAULT_LIMITS, 'lockout_seconds'));
        $maxAge = max($maxWindow, $maxLockout);

        foreach ($_SESSION[self::SESSION_KEY] as $key => $data) {
            $age = $now - ($data['window_start'] ?? 0);
            $lockoutExpired = !isset($data['locked_until']) || $now > $data['locked_until'];

            if ($age > $maxAge && $lockoutExpired) {
                unset($_SESSION[self::SESSION_KEY][$key]);
            }
        }
    }

    /**
     * Get client IP (handles proxies)
     * 
     * @return string
     */
    public static function getClientIp(): string
    {
        // Check for proxy headers (be careful in production)
        $headers = [
            'HTTP_CF_CONNECTING_IP',     // Cloudflare
            'HTTP_X_FORWARDED_FOR',      // General proxy
            'HTTP_X_REAL_IP',            // Nginx proxy
            'REMOTE_ADDR',               // Direct connection
        ];

        foreach ($headers as $header) {
            if (!empty($_SERVER[$header])) {
                $ip = $_SERVER[$header];
                // X-Forwarded-For can contain multiple IPs
                if (strpos($ip, ',') !== false) {
                    $ip = trim(explode(',', $ip)[0]);
                }
                if (filter_var($ip, FILTER_VALIDATE_IP)) {
                    return $ip;
                }
            }
        }

        return '0.0.0.0';
    }
}
