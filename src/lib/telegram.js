const NotificationConfig = {
    TELEGRAM_API_BASE_URL: 'https://api.telegram.org/bot',
    TELEGRAM_PARSE_MODE: 'HTML',
    // Default request timeout handled by fetch options if needed
    TOKEN_MASK_START_LENGTH: 4,
    TOKEN_MASK_END_LENGTH: 4,
};

export class TelegramService {
    constructor(botToken, chatId) {
        this.botToken = botToken;
        this.chatId = chatId;
    }

    /**
     * Send a message to Telegram
     * @param {string} message 
     * @returns {Promise<{success: boolean, error: string|null}>}
     */
    async sendMessage(message) {
        const apiUrl = this.buildApiUrl();
        const postData = this.buildMessageData(message);

        return this.executeRequest(apiUrl, postData);
    }

    /**
     * Send an expiry notification for a license
     * @param {object} license 
     * @returns {Promise<{success: boolean, error: string|null}>}
     */
    async sendExpiryNotification(license) {
        const message = this.buildExpiryMessage(license);
        return this.sendMessage(message);
    }

    /**
     * Send a test notification
     * @returns {Promise<{success: boolean, error: string|null}>}
     */
    async sendTestNotification() {
        const message = this.buildTestMessage();
        return this.sendMessage(message);
    }

    buildApiUrl() {
        return `${NotificationConfig.TELEGRAM_API_BASE_URL}${this.botToken}/sendMessage`;
    }

    buildMessageData(message) {
        // fetch expects body as string or URLSearchParams for generic POST
        // For x-www-form-urlencoded:
        const params = new URLSearchParams();
        params.append('chat_id', this.chatId);
        params.append('text', message);
        params.append('parse_mode', NotificationConfig.TELEGRAM_PARSE_MODE);
        return params;
    }

    buildExpiryMessage(license) {
        const lines = [
            "⚠️ แจ้งเตือนใบอนุญาตใกล้หมดอายุ",
            "",
            `🏪 ร้าน: ${license.shop_name}`,
            `📄 ประเภท: ${license.type_name}`,
            `🔢 เลขที่: ${license.license_number}`,
            `📅 หมดอายุ: ${this.formatDate(license.expiry_date)}`,
            `⏰ เหลือ: ${license.days_until_expiry} วัน`
        ];
        return lines.join("\n");
    }

    buildTestMessage() {
        const lines = [
            "🔔 ทดสอบการแจ้งเตือน",
            "",
            "ระบบจัดการใบอนุญาตร้านค้า",
            `เวลา: ${new Date().toLocaleString('th-TH')}`
        ];
        return lines.join("\n");
    }

    formatDate(dateStr) {
        // Simple formatter, can use existing utils if imported, but keeping self-contained for lib
        try {
            return new Date(dateStr).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
        } catch {
            return dateStr;
        }
    }

    async executeRequest(url, data) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: data
            });

            const result = await response.json();

            if (result.ok) {
                return { success: true, error: null };
            } else {
                return { success: false, error: result.description || 'Unknown Telegram error' };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

export { NotificationConfig };
