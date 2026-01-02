<?php
/**
 * Notification Configuration
 * Centralized constants for notification system
 * 
 * Following Clean Code principles:
 * - No magic numbers
 * - Self-documenting constants
 * - Single source of truth
 */

class NotificationConfig
{
    /**
     * Default number of days before expiry to send notifications
     */
    public const DEFAULT_DAYS_BEFORE_EXPIRY = 30;

    /**
     * Delay between sending messages to avoid rate limiting (microseconds)
     * 100000 microseconds = 0.1 seconds
     */
    public const RATE_LIMIT_DELAY_MICROSECONDS = 100000;

    /**
     * Maximum number of notification logs to retrieve
     */
    public const MAX_NOTIFICATION_LOGS = 100;

    /**
     * Telegram message parse mode
     */
    public const TELEGRAM_PARSE_MODE = 'HTML';

    /**
     * Telegram API request timeout in seconds
     */
    public const TELEGRAM_REQUEST_TIMEOUT_SECONDS = 10;

    /**
     * Telegram API base URL
     */
    public const TELEGRAM_API_BASE_URL = 'https://api.telegram.org/bot';

    /**
     * Bot token mask length for security display
     */
    public const TOKEN_MASK_START_LENGTH = 10;
    public const TOKEN_MASK_END_LENGTH = 5;
}
