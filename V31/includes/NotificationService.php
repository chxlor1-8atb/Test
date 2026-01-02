<?php
/**
 * Notification Service
 * Manages notification business logic
 * 
 * Following Clean Code principles:
 * - Single Responsibility: Handles notification logic only
 * - Dependency Inversion: Depends on TelegramService abstraction
 * - Small Functions: Each function has clear, single purpose
 * - Meaningful Names: Self-documenting code
 */

require_once __DIR__ . '/TelegramService.php';
require_once __DIR__ . '/NotificationConfig.php';

class NotificationService
{
    private TelegramService $telegramService;
    private array $settings;

    public function __construct(TelegramService $telegramService, array $settings)
    {
        $this->telegramService = $telegramService;
        $this->settings = $settings;
    }

    /**
     * Check for expiring licenses and send notifications
     * 
     * @return array ['success' => bool, 'message' => string, 'data' => array]
     */
    public function checkAndSendExpiryNotifications(): array
    {
        if (!$this->isNotificationSystemActive()) {
            return $this->createInactiveSystemResponse();
        }

        $expiringLicenses = $this->getExpiringLicenses();

        if (empty($expiringLicenses)) {
            return $this->createNoLicensesResponse();
        }

        return $this->sendNotificationsForLicenses($expiringLicenses);
    }

    /**
     * Get licenses that are expiring within configured days
     * 
     * @return array Array of license records
     */
    public function getExpiringLicenses(): array
    {
        $daysBeforeExpiry = $this->getDaysBeforeExpiry();

        $query = "
            SELECT l.*, s.shop_name, lt.type_name,
                   DATEDIFF(l.expiry_date, CURDATE()) as days_until_expiry
            FROM licenses l 
            JOIN shops s ON l.shop_id = s.id
            JOIN license_types lt ON l.license_type_id = lt.id
            LEFT JOIN notification_logs nl ON l.id = nl.license_id 
                AND DATE(nl.sent_at) = CURDATE()
            WHERE l.status = 'active' 
            AND l.expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
            AND nl.id IS NULL
            ORDER BY l.expiry_date ASC
        ";

        return db()->fetchAll($query, [$daysBeforeExpiry]);
    }

    /**
     * Send test notification
     * 
     * @return array ['success' => bool, 'message' => string]
     */
    public function sendTestNotification(): array
    {
        $result = $this->telegramService->sendTestNotification();

        if ($result['success']) {
            return [
                'success' => true,
                'message' => 'ส่งข้อความทดสอบสำเร็จ'
            ];
        }

        return [
            'success' => false,
            'message' => 'ส่งข้อความล้มเหลว: ' . $result['error']
        ];
    }

    /**
     * Check if notification system is active
     */
    private function isNotificationSystemActive(): bool
    {
        return (bool) $this->settings['is_active'];
    }

    /**
     * Get configured days before expiry for notifications
     */
    private function getDaysBeforeExpiry(): int
    {
        return (int) ($this->settings['days_before_expiry']
            ?? NotificationConfig::DEFAULT_DAYS_BEFORE_EXPIRY);
    }

    /**
     * Send notifications for multiple licenses
     */
    private function sendNotificationsForLicenses(array $licenses): array
    {
        $successCount = 0;
        $failCount = 0;

        foreach ($licenses as $license) {
            $wasSuccessful = $this->sendAndLogNotification($license);

            if ($wasSuccessful) {
                $successCount++;
            } else {
                $failCount++;
            }

            $this->applyRateLimitDelay();
        }

        return $this->createNotificationSummaryResponse($successCount, $failCount);
    }

    /**
     * Send notification for a single license and log the result
     */
    private function sendAndLogNotification(array $license): bool
    {
        $result = $this->telegramService->sendExpiryNotification($license);

        $this->logNotification(
            $license['id'],
            $result['success'],
            $result['success']
            ? $this->telegramService->sendExpiryNotification($license)['error'] ?? 'Sent'
            : $result['error']
        );

        return $result['success'];
    }

    /**
     * Log notification attempt to database
     */
    private function logNotification(int $licenseId, bool $success, string $message): void
    {
        db()->insert('notification_logs', [
            'license_id' => $licenseId,
            'status' => $success ? 'success' : 'failed',
            'message' => $message
        ]);
    }

    /**
     * Apply delay to avoid rate limiting
     */
    private function applyRateLimitDelay(): void
    {
        usleep(NotificationConfig::RATE_LIMIT_DELAY_MICROSECONDS);
    }

    /**
     * Create response for inactive notification system
     */
    private function createInactiveSystemResponse(): array
    {
        return [
            'success' => false,
            'message' => 'ระบบแจ้งเตือนถูกปิดอยู่'
        ];
    }

    /**
     * Create response when no licenses need notification
     */
    private function createNoLicensesResponse(): array
    {
        return [
            'success' => true,
            'message' => 'ไม่มีใบอนุญาตที่ต้องแจ้งเตือน'
        ];
    }

    /**
     * Create summary response after sending notifications
     */
    private function createNotificationSummaryResponse(int $successCount, int $failCount): array
    {
        return [
            'success' => true,
            'message' => "ส่งแจ้งเตือนสำเร็จ {$successCount} รายการ, ล้มเหลว {$failCount} รายการ",
            'data' => [
                'success_count' => $successCount,
                'fail_count' => $failCount
            ]
        ];
    }
}
