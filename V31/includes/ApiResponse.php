<?php
/**
 * API Response Helper
 * Provides consistent JSON response formatting
 * Eliminates duplicate response() functions across API files
 */

class ApiResponse
{
    /**
     * Send JSON success response
     */
    public static function success(string $message, array $data = [], int $httpCode = 200): void
    {
        self::send(true, $message, $data, $httpCode);
    }

    /**
     * Send JSON error response
     */
    public static function error(string $message, array $data = [], int $httpCode = 400): void
    {
        self::send(false, $message, $data, $httpCode);
    }

    /**
     * Send 401 Unauthorized response
     */
    public static function unauthorized(string $message = 'Unauthorized'): void
    {
        self::send(false, $message, [], 401);
    }

    /**
     * Send 403 Forbidden response
     */
    public static function forbidden(string $message = 'Access denied'): void
    {
        self::send(false, $message, [], 403);
    }

    /**
     * Send 404 Not Found response
     */
    public static function notFound(string $message = 'Resource not found'): void
    {
        self::send(false, $message, [], 404);
    }

    /**
     * Send 405 Method Not Allowed response
     */
    public static function methodNotAllowed(string $message = 'Method not allowed'): void
    {
        self::send(false, $message, [], 405);
    }

    /**
     * Core method to send JSON response and exit
     * Made public for cases where you need full control
     */
    public static function send(bool $success, string $message, array $data = [], int $httpCode = 200): void
    {
        http_response_code($httpCode);
        header('Content-Type: application/json; charset=UTF-8');

        echo json_encode(
            array_merge(
                [
                    'success' => $success,
                    'message' => $message
                ],
                $data
            ),
            JSON_UNESCAPED_UNICODE
        );

        exit;
    }
}
