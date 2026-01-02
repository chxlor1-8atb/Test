<?php
/**
 * Authentication & Authorization Middleware
 * Centralized authentication and authorization checks
 * Eliminates duplicate auth checks across API files
 */

require_once __DIR__ . '/ApiResponse.php';

class AuthMiddleware
{
    /**
     * Require user to be authenticated
     * Exits with 401 if not authenticated
     */
    public static function requireAuth(): void
    {
        if (!isset($_SESSION['user_id'])) {
            ApiResponse::unauthorized();
        }
    }

    /**
     * Require user to have admin role
     * Exits with 401 if not authenticated, 403 if not admin
     */
    public static function requireAdmin(): void
    {
        self::requireAuth();

        if ($_SESSION['role'] !== 'admin') {
            ApiResponse::forbidden();
        }
    }

    /**
     * Require user to have one of the specified roles
     * Exits with 401 if not authenticated, 403 if role doesn't match
     */
    public static function requireRoles(array $allowedRoles): void
    {
        self::requireAuth();

        if (!in_array($_SESSION['role'], $allowedRoles)) {
            ApiResponse::forbidden('You do not have permission to perform this action');
        }
    }

    /**
     * Check if current user is authenticated (without exiting)
     */
    public static function isAuthenticated(): bool
    {
        return isset($_SESSION['user_id']);
    }

    /**
     * Check if current user has admin role (without exiting)
     */
    public static function isAdmin(): bool
    {
        return self::isAuthenticated() && $_SESSION['role'] === 'admin';
    }

    /**
     * Get current user ID or null
     */
    public static function getUserId(): ?int
    {
        return $_SESSION['user_id'] ?? null;
    }

    /**
     * Get current user role or null
     */
    public static function getRole(): ?string
    {
        return $_SESSION['role'] ?? null;
    }
}
