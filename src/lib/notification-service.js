import { insert, fetchAll } from '@/lib/db';
import { TelegramService } from './telegram';

// Replicating PHP constant
const DEFAULT_DAYS_BEFORE_EXPIRY = 30;
const RATE_LIMIT_DELAY_MS = 100; // microseconds in PHP was small, using small MS here

export class NotificationService {
    constructor(telegramService, settings) {
        this.telegramService = telegramService;
        this.settings = settings;
    }

    /**
     * Check for expiring licenses and send notifications
     */
    async checkAndSendExpiryNotifications() {
        if (!this.isNotificationSystemActive()) {
            return {
                success: false,
                message: 'ระบบแจ้งเตือนถูกปิดอยู่'
            };
        }

        const expiringLicenses = await this.getExpiringLicenses();

        if (!expiringLicenses || expiringLicenses.length === 0) {
            return {
                success: true,
                message: 'ไม่มีใบอนุญาตที่ต้องแจ้งเตือน'
            };
        }

        return await this.sendNotificationsForLicenses(expiringLicenses);
    }

    async getExpiringLicenses() {
        const daysBeforeExpiry = this.getDaysBeforeExpiry();

        // Node-postgres uses $1, $2 placeholders parameters
        // Need to simulate DATEDIFF and CURDATE() for PostgreSQL if using generic SQL,
        // or keep using what works for the specific DB.
        // Assuming the underlying DB is PostgreSQL (Neon), specific syntax changes might be needed
        // compared to MySQL.
        // Postgres: CURRENT_DATE, - operator for dates returns integer days

        // Original PHP/MySQL:
        // DATEDIFF(l.expiry_date, CURDATE()) as days_until_expiry
        // WHERE l.expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
        // AND DATE(nl.sent_at) = CURDATE()

        // PostgreSQL equivalent:
        // (l.expiry_date - CURRENT_DATE) as days_until_expiry
        // WHERE l.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + interval 'X days'
        // AND nl.sent_at::date = CURRENT_DATE

        const query = `
            SELECT l.*, s.shop_name, lt.type_name,
                   (l.expiry_date - CURRENT_DATE) as days_until_expiry
            FROM licenses l 
            JOIN shops s ON l.shop_id = s.id
            JOIN license_types lt ON l.license_type_id = lt.id
            LEFT JOIN notification_logs nl ON l.id = nl.license_id 
                AND nl.sent_at::date = CURRENT_DATE
            WHERE l.status = 'active' 
            AND l.expiry_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + ($1 || ' days')::interval)
            AND nl.id IS NULL
            ORDER BY l.expiry_date ASC
        `;

        return await fetchAll(query, [daysBeforeExpiry]);
    }

    async sendTestNotification() {
        const result = await this.telegramService.sendTestNotification();
        if (result.success) {
            return { success: true, message: 'ส่งข้อความทดสอบสำเร็จ' };
        }
        return { success: false, message: 'ส่งข้อความล้มเหลว: ' + result.error };
    }

    isNotificationSystemActive() {
        return !!this.settings.is_active;
    }

    getDaysBeforeExpiry() {
        return parseInt(this.settings.days_before_expiry || DEFAULT_DAYS_BEFORE_EXPIRY);
    }

    async sendNotificationsForLicenses(licenses) {
        let successCount = 0;
        let failCount = 0;

        for (const license of licenses) {
            const wasSuccessful = await this.sendAndLogNotification(license);

            if (wasSuccessful) successCount++;
            else failCount++;

            // Rate limit delay
            await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY_MS));
        }

        return {
            success: true,
            message: `ส่งแจ้งเตือนสำเร็จ ${successCount} รายการ, ล้มเหลว ${failCount} รายการ`,
            data: { success_count: successCount, fail_count: failCount }
        };
    }

    async sendAndLogNotification(license) {
        const result = await this.telegramService.sendExpiryNotification(license);

        await this.logNotification(
            license.id,
            result.success,
            result.success ? 'Sent' : (result.error || 'Failed')
        );

        return result.success;
    }

    async logNotification(licenseId, success, message) {
        await insert('notification_logs', {
            license_id: licenseId,
            status: success ? 'success' : 'failed',
            message: message,
            // sent_at defaults to current timestamp in DB usually, but we can rely on default
        });
    }
}
