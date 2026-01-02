<?php
/**
 * Notifications API
 * Telegram notification management
 * 
 * Clean Code Improvements:
 * - Thin controller pattern: delegates to service layer
 * - Single Responsibility: only handles HTTP requests/responses
 * - Dependency Injection: creates and injects dependencies
 * - No business logic: all logic moved to services
 */

// Set JSON header first to ensure all errors are returned as JSON
header('Content-Type: application/json; charset=UTF-8');

// Global exception handler to catch all errors
set_exception_handler(function ($e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
    exit;
});

// Convert PHP errors to exceptions
set_error_handler(function ($severity, $message, $file, $line) {
    throw new ErrorException($message, 0, $severity, $file, $line);
});

try {
    require_once __DIR__ . '/../includes/db.php';
    require_once __DIR__ . '/../includes/TelegramService.php';
    require_once __DIR__ . '/../includes/NotificationService.php';
    require_once __DIR__ . '/../includes/NotificationConfig.php';
    require_once __DIR__ . '/../includes/ApiResponse.php';
    require_once __DIR__ . '/../includes/AuthMiddleware.php';
    require_once __DIR__ . '/../includes/RequestHelper.php';
    require_once __DIR__ . '/../includes/SecurityHeaders.php';
    require_once __DIR__ . '/../includes/CsrfProtection.php';

    // Apply security headers
    SecurityHeaders::apply();
    // Set JSON header
    RequestHelper::setJsonHeader();

    // Check authentication
    AuthMiddleware::requireAuth();

    // Validate CSRF for state-changing operations
    $stateChangingActions = ['save_settings', 'test', 'send_expiry'];
    $action = $_GET['action'] ?? 'settings';
    if (in_array($action, $stateChangingActions)) {
        CsrfProtection::validateRequest();
    }

    $action = $_GET['action'] ?? 'settings';

    switch ($action) {
        case 'settings':
            handleGetSettings();
            break;
        case 'save_settings':
            handleSaveSettings();
            break;
        case 'test':
            handleTestNotification();
            break;
        case 'send_expiry':
        case 'check-expiring':
            handleCheckExpiringLicenses();
            break;
        case 'logs':
            handleGetNotificationLogs();
            break;
        default:
            ApiResponse::error('Invalid action');
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage(),
        'debug' => defined('IS_PRODUCTION') && !IS_PRODUCTION ? $e->getTraceAsString() : null
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Get notification settings
 */
function handleGetSettings(): void
{
    $settings = getNotificationSettings();

    // Mask bot token for security
    if (!empty($settings['telegram_bot_token'])) {
        $settings['telegram_bot_token_masked'] = maskBotToken($settings['telegram_bot_token']);
    }

    ApiResponse::success('Success', ['settings' => $settings]);
}

/**
 * Save notification settings (Admin only)
 */
function handleSaveSettings(): void
{
    AuthMiddleware::requireAdmin(); // Admin only

    $requestData = RequestHelper::getJsonInput();
    $updateData = prepareSettingsUpdateData($requestData);

    saveNotificationSettings($updateData);

    ApiResponse::success('บันทึกการตั้งค่าสำเร็จ');
}

/**
 * Send test notification
 */
function handleTestNotification(): void
{
    $settings = getNotificationSettings();

    validateTelegramConfiguration($settings);

    $telegramService = createTelegramService($settings);
    $notificationService = createNotificationService($telegramService, $settings);

    $result = $notificationService->sendTestNotification();

    ApiResponse::send($result['success'], $result['message']);
}

/**
 * Check for expiring licenses and send notifications
 */
function handleCheckExpiringLicenses(): void
{
    $settings = getNotificationSettings();

    validateTelegramConfiguration($settings);

    $telegramService = createTelegramService($settings);
    $notificationService = createNotificationService($telegramService, $settings);

    $result = $notificationService->checkAndSendExpiryNotifications();

    ApiResponse::send($result['success'], $result['message'], $result['data'] ?? []);
}

/**
 * Get notification logs
 */
function handleGetNotificationLogs(): void
{
    $logs = db()->fetchAll(
        "SELECT nl.*, l.license_number, s.shop_name
         FROM notification_logs nl
         LEFT JOIN licenses l ON nl.license_id = l.id
         LEFT JOIN shops s ON l.shop_id = s.id
         ORDER BY nl.sent_at DESC
         LIMIT ?",
        [NotificationConfig::MAX_NOTIFICATION_LOGS]
    );

    ApiResponse::success('Success', ['logs' => $logs]);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get or create default notification settings
 */
function getNotificationSettings(): array
{
    $settings = db()->fetchOne("SELECT * FROM notification_settings WHERE id = 1");

    if (!$settings) {
        createDefaultSettings();
        $settings = db()->fetchOne("SELECT * FROM notification_settings WHERE id = 1");
    }

    return $settings;
}

/**
 * Create default notification settings
 */
function createDefaultSettings(): void
{
    db()->query(
        "INSERT INTO notification_settings (id, days_before_expiry, is_active) 
         VALUES (1, ?, 0)",
        [NotificationConfig::DEFAULT_DAYS_BEFORE_EXPIRY]
    );
}

/**
 * Save notification settings to database
 */
function saveNotificationSettings(array $updateData): void
{
    $exists = db()->fetchOne("SELECT id FROM notification_settings WHERE id = 1");

    if ($exists) {
        db()->update('notification_settings', $updateData, 'id = 1');
    } else {
        $updateData['id'] = 1;
        db()->insert('notification_settings', $updateData);
    }
}

/**
 * Prepare settings update data from request
 */
function prepareSettingsUpdateData(array $requestData): array
{
    $updateData = [
        'days_before_expiry' => $requestData['days_before_expiry']
            ?? NotificationConfig::DEFAULT_DAYS_BEFORE_EXPIRY,
        'is_active' => ($requestData['is_active'] ?? false) ? 1 : 0
    ];

    // Only update token if provided
    if (!empty($requestData['telegram_bot_token'])) {
        $updateData['telegram_bot_token'] = $requestData['telegram_bot_token'];
    }

    if (!empty($requestData['telegram_chat_id'])) {
        $updateData['telegram_chat_id'] = $requestData['telegram_chat_id'];
    }

    return $updateData;
}

/**
 * Mask bot token for security (show only partial)
 */
function maskBotToken(string $token): string
{
    $startLength = NotificationConfig::TOKEN_MASK_START_LENGTH;
    $endLength = NotificationConfig::TOKEN_MASK_END_LENGTH;

    return substr($token, 0, $startLength) . '...' . substr($token, -$endLength);
}

/**
 * Create TelegramService instance
 */
function createTelegramService(array $settings): TelegramService
{
    return new TelegramService(
        $settings['telegram_bot_token'],
        $settings['telegram_chat_id']
    );
}

/**
 * Create NotificationService instance
 */
function createNotificationService(TelegramService $telegramService, array $settings): NotificationService
{
    return new NotificationService($telegramService, $settings);
}

/**
 * Validate Telegram configuration exists
 */
function validateTelegramConfiguration(array $settings): void
{
    if (empty($settings['telegram_bot_token']) || empty($settings['telegram_chat_id'])) {
        ApiResponse::error('กรุณาตั้งค่า Telegram Bot Token และ Chat ID ก่อน');
    }
}
