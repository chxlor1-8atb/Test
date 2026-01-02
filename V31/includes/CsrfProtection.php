<?php
/**
 * CSRF Protection Manager
 * 
 * Provides CSRF token generation and validation
 * Protects against Cross-Site Request Forgery attacks
 */

class CsrfProtection
{
    private const TOKEN_NAME = 'csrf_token';
    private const TOKEN_LENGTH = 32;
    private const TOKEN_LIFETIME = 3600; // 1 hour

    /**
     * Generate a new CSRF token and store in session
     * 
     * @return string The generated token
     */
    public static function generateToken(): string
    {
        $token = bin2hex(random_bytes(self::TOKEN_LENGTH));

        $_SESSION[self::TOKEN_NAME] = [
            'token' => $token,
            'expires' => time() + self::TOKEN_LIFETIME
        ];

        return $token;
    }

    /**
     * Get current CSRF token or generate new one
     * 
     * @return string The CSRF token
     */
    public static function getToken(): string
    {
        // Check if token exists and is valid
        if (self::hasValidToken()) {
            return $_SESSION[self::TOKEN_NAME]['token'];
        }

        // Generate new token
        return self::generateToken();
    }

    /**
     * Check if a valid token exists in session
     * 
     * @return bool
     */
    private static function hasValidToken(): bool
    {
        if (!isset($_SESSION[self::TOKEN_NAME])) {
            return false;
        }

        $tokenData = $_SESSION[self::TOKEN_NAME];

        // Check expiration
        if (!isset($tokenData['expires']) || $tokenData['expires'] < time()) {
            unset($_SESSION[self::TOKEN_NAME]);
            return false;
        }

        return isset($tokenData['token']);
    }

    /**
     * Validate a CSRF token
     * 
     * @param string|null $token The token to validate
     * @return bool True if token is valid
     */
    public static function validateToken(?string $token): bool
    {
        if (empty($token)) {
            return false;
        }

        if (!self::hasValidToken()) {
            return false;
        }

        $storedToken = $_SESSION[self::TOKEN_NAME]['token'];

        // Use timing-safe comparison
        return hash_equals($storedToken, $token);
    }

    /**
     * Get token from request (checks multiple sources)
     * 
     * @return string|null
     */
    public static function getTokenFromRequest(): ?string
    {
        // Check JSON body first
        $input = file_get_contents('php://input');
        if ($input) {
            $data = json_decode($input, true);
            if (isset($data['csrf_token'])) {
                return $data['csrf_token'];
            }
        }

        // Check POST data
        if (isset($_POST['csrf_token'])) {
            return $_POST['csrf_token'];
        }

        // Check header (for AJAX requests)
        if (isset($_SERVER['HTTP_X_CSRF_TOKEN'])) {
            return $_SERVER['HTTP_X_CSRF_TOKEN'];
        }

        return null;
    }

    /**
     * Validate request CSRF token automatically
     * Call this at the start of state-changing endpoints
     * 
     * @param bool $exitOnFailure Whether to exit with error on failure
     * @return bool True if valid
     */
    public static function validateRequest(bool $exitOnFailure = true): bool
    {
        // Skip validation for GET requests (they should be safe/idempotent)
        if ($_SERVER['REQUEST_METHOD'] === 'GET') {
            return true;
        }

        // Skip validation for localhost in development
        $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
        if (in_array($host, ['localhost', '127.0.0.1'])) {
            return true;
        }

        $token = self::getTokenFromRequest();
        $isValid = self::validateToken($token);

        if (!$isValid && $exitOnFailure) {
            require_once __DIR__ . '/ApiResponse.php';
            ApiResponse::forbidden('Invalid or missing CSRF token');
        }

        return $isValid;
    }

    /**
     * Regenerate token (call after successful state change)
     * 
     * @return string New token
     */
    public static function regenerateToken(): string
    {
        unset($_SESSION[self::TOKEN_NAME]);
        return self::generateToken();
    }

    /**
     * Get token data for API response (include in login response)
     * 
     * @return array Token data for client
     */
    public static function getTokenData(): array
    {
        return [
            'csrf_token' => self::getToken(),
            'expires_in' => self::TOKEN_LIFETIME
        ];
    }
}
