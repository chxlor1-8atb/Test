<?php
/**
 * Input Validation & Sanitization Helper
 * 
 * Provides comprehensive input validation and sanitization
 * to prevent XSS, injection attacks, and data integrity issues
 */

class InputValidator
{
    /**
     * Sanitize string for safe output (XSS prevention)
     * 
     * @param string|null $input
     * @return string
     */
    public static function sanitizeString(?string $input): string
    {
        if ($input === null) {
            return '';
        }
        return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
    }

    /**
     * Sanitize string for database storage (less strict than output)
     * 
     * @param string|null $input
     * @return string
     */
    public static function cleanString(?string $input): string
    {
        if ($input === null) {
            return '';
        }
        // Remove null bytes and trim
        return trim(str_replace("\0", '', $input));
    }

    /**
     * Validate and sanitize email
     * 
     * @param string|null $email
     * @return string|false Returns sanitized email or false if invalid
     */
    public static function validateEmail(?string $email)
    {
        if (empty($email)) {
            return false;
        }

        $email = filter_var(trim($email), FILTER_SANITIZE_EMAIL);
        return filter_var($email, FILTER_VALIDATE_EMAIL) ?: false;
    }

    /**
     * Validate Thai phone number
     * 
     * @param string|null $phone
     * @return string|false Returns cleaned phone or false if invalid
     */
    public static function validatePhone(?string $phone)
    {
        if (empty($phone)) {
            return false;
        }

        // Remove all non-digits
        $cleaned = preg_replace('/[^0-9]/', '', $phone);

        // Thai phone numbers: 9-10 digits, starting with 0
        if (strlen($cleaned) >= 9 && strlen($cleaned) <= 10 && $cleaned[0] === '0') {
            return $cleaned;
        }

        return false;
    }

    /**
     * Validate integer within range
     * 
     * @param mixed $value
     * @param int $min
     * @param int $max
     * @return int|false
     */
    public static function validateInt($value, int $min = PHP_INT_MIN, int $max = PHP_INT_MAX)
    {
        $filtered = filter_var($value, FILTER_VALIDATE_INT, [
            'options' => [
                'min_range' => $min,
                'max_range' => $max
            ]
        ]);

        return $filtered !== false ? $filtered : false;
    }

    /**
     * Validate positive ID (for database IDs)
     * 
     * @param mixed $id
     * @return int|false
     */
    public static function validateId($id)
    {
        return self::validateInt($id, 1);
    }

    /**
     * Validate date format (Y-m-d)
     * 
     * @param string|null $date
     * @return string|false
     */
    public static function validateDate(?string $date)
    {
        if (empty($date)) {
            return false;
        }

        $d = DateTime::createFromFormat('Y-m-d', $date);
        return ($d && $d->format('Y-m-d') === $date) ? $date : false;
    }

    /**
     * Validate datetime format (Y-m-d H:i:s)
     * 
     * @param string|null $datetime
     * @return string|false
     */
    public static function validateDateTime(?string $datetime)
    {
        if (empty($datetime)) {
            return false;
        }

        $d = DateTime::createFromFormat('Y-m-d H:i:s', $datetime);
        return ($d && $d->format('Y-m-d H:i:s') === $datetime) ? $datetime : false;
    }

    /**
     * Validate enum value
     * 
     * @param string|null $value
     * @param array $allowedValues
     * @return string|false
     */
    public static function validateEnum(?string $value, array $allowedValues)
    {
        if (empty($value)) {
            return false;
        }

        return in_array($value, $allowedValues, true) ? $value : false;
    }

    /**
     * Validate URL
     * 
     * @param string|null $url
     * @return string|false
     */
    public static function validateUrl(?string $url)
    {
        if (empty($url)) {
            return false;
        }

        $url = filter_var(trim($url), FILTER_SANITIZE_URL);
        return filter_var($url, FILTER_VALIDATE_URL) ?: false;
    }

    /**
     * Validate username (alphanumeric, underscore, no spaces)
     * 
     * @param string|null $username
     * @param int $minLength
     * @param int $maxLength
     * @return string|false
     */
    public static function validateUsername(?string $username, int $minLength = 3, int $maxLength = 50)
    {
        if (empty($username)) {
            return false;
        }

        $username = trim($username);
        $length = mb_strlen($username);

        if ($length < $minLength || $length > $maxLength) {
            return false;
        }

        // Allow alphanumeric, underscore, and Thai characters
        if (!preg_match('/^[a-zA-Z0-9_\p{Thai}]+$/u', $username)) {
            return false;
        }

        return $username;
    }

    /**
     * Validate password strength
     * 
     * @param string|null $password
     * @param int $minLength
     * @return array ['valid' => bool, 'errors' => array]
     */
    public static function validatePassword(?string $password, int $minLength = 8): array
    {
        $errors = [];

        if (empty($password)) {
            return ['valid' => false, 'errors' => ['รหัสผ่านห้ามว่าง']];
        }

        if (strlen($password) < $minLength) {
            $errors[] = "รหัสผ่านต้องมีอย่างน้อย {$minLength} ตัวอักษร";
        }

        // Optional: Add more password rules
        // if (!preg_match('/[A-Z]/', $password)) {
        //     $errors[] = 'รหัสผ่านต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว';
        // }

        return [
            'valid' => empty($errors),
            'errors' => $errors
        ];
    }

    /**
     * Sanitize filename for safe storage
     * 
     * @param string|null $filename
     * @return string
     */
    public static function sanitizeFilename(?string $filename): string
    {
        if (empty($filename)) {
            return '';
        }

        // Remove path traversal attempts
        $filename = basename($filename);

        // Remove dangerous characters
        $filename = preg_replace('/[^a-zA-Z0-9_\-\.]/', '_', $filename);

        // Remove multiple dots (prevent .php.jpg attacks)
        $filename = preg_replace('/\.+/', '.', $filename);

        return $filename;
    }

    /**
     * Validate and sanitize array of IDs
     * 
     * @param array|null $ids
     * @return array
     */
    public static function validateIdArray(?array $ids): array
    {
        if (empty($ids) || !is_array($ids)) {
            return [];
        }

        $validIds = [];
        foreach ($ids as $id) {
            $validId = self::validateId($id);
            if ($validId !== false) {
                $validIds[] = $validId;
            }
        }

        return array_unique($validIds);
    }

    /**
     * Validate pagination parameters
     * 
     * @param mixed $page
     * @param mixed $limit
     * @param int $maxLimit
     * @return array ['page' => int, 'limit' => int, 'offset' => int]
     */
    public static function validatePagination($page, $limit, int $maxLimit = 100): array
    {
        $page = max(1, (int) ($page ?? 1));
        $limit = min($maxLimit, max(1, (int) ($limit ?? 20)));
        $offset = ($page - 1) * $limit;

        return [
            'page' => $page,
            'limit' => $limit,
            'offset' => $offset
        ];
    }
}
