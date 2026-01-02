<?php
/**
 * Security Headers Manager
 * 
 * Provides centralized security headers for all API endpoints
 * Auto-detects production/development environment
 */

class SecurityHeaders
{
    /**
     * Check if running in production environment
     */
    public static function isProduction(): bool
    {
        $host = $_SERVER['HTTP_HOST'] ?? $_SERVER['SERVER_NAME'] ?? 'localhost';
        return !in_array($host, ['localhost', '127.0.0.1', '::1']);
    }

    /**
     * Apply all security headers
     * 
     * @param array $options Optional overrides
     */
    public static function apply(array $options = []): void
    {
        $defaults = [
            'contentType' => true,
            'frameOptions' => true,
            'xssProtection' => true,
            'referrerPolicy' => true,
            'csp' => true,
            'hsts' => self::isProduction(), // Only in production with HTTPS
            'cacheControl' => true,
        ];

        $config = array_merge($defaults, $options);

        // Prevent MIME-type sniffing
        if ($config['contentType']) {
            header('X-Content-Type-Options: nosniff');
        }

        // Prevent clickjacking
        if ($config['frameOptions']) {
            header('X-Frame-Options: DENY');
        }

        // Enable XSS filter in browsers
        if ($config['xssProtection']) {
            header('X-XSS-Protection: 1; mode=block');
        }

        // Control referrer information
        if ($config['referrerPolicy']) {
            header('Referrer-Policy: strict-origin-when-cross-origin');
        }

        // Content Security Policy
        if ($config['csp']) {
            // Permissive CSP for development, can be stricter in production
            $cspDirectives = [
                "default-src 'self'",
                "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://cdnjs.cloudflare.com",
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
                "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com",
                "img-src 'self' data: https:",
                "connect-src 'self'",
                "frame-src https://challenges.cloudflare.com",
            ];
            header('Content-Security-Policy: ' . implode('; ', $cspDirectives));
        }

        // HTTP Strict Transport Security (HTTPS only)
        if ($config['hsts'] && self::isProduction()) {
            header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
        }

        // Prevent caching of sensitive data
        if ($config['cacheControl']) {
            header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
            header('Pragma: no-cache');
        }
    }

    /**
     * Apply minimal headers for public endpoints (like login)
     */
    public static function applyPublic(): void
    {
        self::apply([
            'cacheControl' => false, // Allow some caching for public pages
        ]);
    }

    /**
     * Apply strict headers for sensitive endpoints (like user management)
     */
    public static function applyStrict(): void
    {
        self::apply([
            'frameOptions' => true,
            'cacheControl' => true,
        ]);

        // Additional headers for sensitive operations
        header('X-Permitted-Cross-Domain-Policies: none');
    }
}
