<?php
/**
 * Request Helper Utilities
 * Common request handling functions
 * Eliminates duplicate request parsing code
 */

class RequestHelper
{
    /**
     * Set JSON content-type header
     */
    public static function setJsonHeader(): void
    {
        header('Content-Type: application/json; charset=UTF-8');
    }

    /**
     * Get and parse JSON request body
     * Returns associative array or empty array if invalid
     */
    public static function getJsonInput(): array
    {
        $json = file_get_contents('php://input');
        $data = json_decode($json, true);
        return is_array($data) ? $data : [];
    }

    /**
     * Get HTTP request method
     */
    public static function getMethod(): string
    {
        return $_SERVER['REQUEST_METHOD'];
    }

    /**
     * Get query parameter or default value
     */
    public static function get(string $key, $default = null)
    {
        return $_GET[$key] ?? $default;
    }

    /**
     * Check if query parameter exists
     */
    public static function has(string $key): bool
    {
        return isset($_GET[$key]);
    }

    /**
     * Validate required fields in data array
     * Returns array of missing field names
     */
    public static function validateRequired(array $data, array $requiredFields): array
    {
        $missing = [];
        foreach ($requiredFields as $field) {
            if (empty($data[$field])) {
                $missing[] = $field;
            }
        }
        return $missing;
    }
}
