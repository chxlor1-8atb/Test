<?php
/**
 * Telegram Service
 * Handles all Telegram API interactions
 * 
 * Following Clean Code principles:
 * - Single Responsibility: Only manages Telegram communication
 * - Dependency Injection: Receives configuration via constructor
 * - Meaningful Names: Clear method and variable names
 * - Small Functions: Each method does one thing
 */

require_once __DIR__ . '/NotificationConfig.php';

class TelegramService
{
    private string $botToken;
    private string $chatId;

    public function __construct(string $botToken, string $chatId)
    {
        $this->botToken = $botToken;
        $this->chatId = $chatId;
    }

    /**
     * Send a message to Telegram
     * 
     * @param string $message The message to send
     * @return array ['success' => bool, 'error' => string|null]
     */
    public function sendMessage(string $message): array
    {
        $apiUrl = $this->buildApiUrl();
        $postData = $this->buildMessageData($message);

        return $this->executeRequest($apiUrl, $postData);
    }

    /**
     * Send an expiry notification for a license
     * 
     * @param array $license License data including shop_name, type_name, etc.
     * @return array ['success' => bool, 'error' => string|null]
     */
    public function sendExpiryNotification(array $license): array
    {
        $message = $this->buildExpiryMessage($license);
        return $this->sendMessage($message);
    }

    /**
     * Send a test notification
     * 
     * @return array ['success' => bool, 'error' => string|null]
     */
    public function sendTestNotification(): array
    {
        $message = $this->buildTestMessage();
        return $this->sendMessage($message);
    }

    /**
     * Build the Telegram API URL for sending messages
     */
    private function buildApiUrl(): string
    {
        return NotificationConfig::TELEGRAM_API_BASE_URL
            . $this->botToken
            . '/sendMessage';
    }

    /**
     * Build message data for Telegram API
     */
    private function buildMessageData(string $message): array
    {
        return [
            'chat_id' => $this->chatId,
            'text' => $message,
            'parse_mode' => NotificationConfig::TELEGRAM_PARSE_MODE
        ];
    }

    /**
     * Build expiry notification message
     */
    private function buildExpiryMessage(array $license): string
    {
        $lines = [
            "⚠️ แจ้งเตือนใบอนุญาตใกล้หมดอายุ",
            "",
            "🏪 ร้าน: {$license['shop_name']}",
            "📄 ประเภท: {$license['type_name']}",
            "🔢 เลขที่: {$license['license_number']}",
            "📅 หมดอายุ: {$license['expiry_date']}",
            "⏰ เหลือ: {$license['days_until_expiry']} วัน"
        ];

        return implode("\n", $lines);
    }

    /**
     * Build test notification message
     */
    private function buildTestMessage(): string
    {
        $lines = [
            "🔔 ทดสอบการแจ้งเตือน",
            "",
            "ระบบจัดการใบอนุญาตร้านค้า",
            "เวลา: " . date('Y-m-d H:i:s')
        ];

        return implode("\n", $lines);
    }

    /**
     * Execute HTTP request to Telegram API
     */
    private function executeRequest(string $url, array $data): array
    {
        $context = $this->createHttpContext($data);
        $response = @file_get_contents($url, false, $context);

        if ($response === false) {
            return $this->createErrorResult('Connection failed');
        }

        return $this->parseResponse($response);
    }

    /**
     * Create HTTP context for the request
     */
    private function createHttpContext(array $data): mixed
    {
        $options = [
            'http' => [
                'method' => 'POST',
                'header' => 'Content-Type: application/x-www-form-urlencoded',
                'content' => http_build_query($data),
                'timeout' => NotificationConfig::TELEGRAM_REQUEST_TIMEOUT_SECONDS
            ]
        ];

        return stream_context_create($options);
    }

    /**
     * Parse Telegram API response
     */
    private function parseResponse(string $response): array
    {
        $decodedResponse = json_decode($response, true);

        if ($this->isSuccessfulResponse($decodedResponse)) {
            return $this->createSuccessResult();
        }

        $errorMessage = $decodedResponse['description'] ?? 'Unknown error';
        return $this->createErrorResult($errorMessage);
    }

    /**
     * Check if response indicates success
     */
    private function isSuccessfulResponse(?array $response): bool
    {
        return $response !== null && ($response['ok'] ?? false);
    }

    /**
     * Create success result array
     */
    private function createSuccessResult(): array
    {
        return ['success' => true, 'error' => null];
    }

    /**
     * Create error result array
     */
    private function createErrorResult(string $error): array
    {
        return ['success' => false, 'error' => $error];
    }
}
