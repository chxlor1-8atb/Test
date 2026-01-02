import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';
import { fetchOne, fetchAll, update, insert } from '@/lib/db';
import { TelegramService } from '@/lib/telegram';
import { NotificationService } from '@/lib/notification-service';

export async function GET(request) {
    const session = await getSession();
    if (!session.userId) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'settings';

    if (action === 'settings') {
        return await handleGetSettings();
    } else if (action === 'logs') {
        return await handleGetLogs();
    }

    return NextResponse.json({ success: false, message: 'Invalid action' });
}

export async function POST(request) {
    const session = await getSession();
    if (!session.userId) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    try {
        if (action === 'save_settings') {
            if (session.role !== 'admin') {
                return NextResponse.json({ success: false, message: 'Admin access required' }, { status: 403 });
            }
            return await handleSaveSettings(request);
        } else if (action === 'test') {
            return await handleTestNotification();
        } else if (action === 'check-expiring' || action === 'send_expiry') {
            return await handleCheckExpiring();
        }

        return NextResponse.json({ success: false, message: 'Invalid action' });
    } catch (error) {
        console.error('Notification API Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

async function getSession() {
    const cookieStore = await cookies();
    return await getIronSession(cookieStore, sessionOptions);
}

// --- Handlers ---

async function handleGetSettings() {
    let settings = await fetchOne("SELECT * FROM notification_settings WHERE id = 1");

    if (!settings) {
        // Create default if not exists
        await insert('notification_settings', { id: 1, days_before_expiry: 30, is_active: 0 });
        settings = await fetchOne("SELECT * FROM notification_settings WHERE id = 1");
    }

    // Mask token
    if (settings && settings.telegram_bot_token) {
        const token = settings.telegram_bot_token;
        const start = token.substring(0, 4);
        const end = token.substring(token.length - 4);
        settings.telegram_bot_token_masked = `${start}...${end}`;
    }

    return NextResponse.json({ success: true, settings });
}

async function handleGetLogs() {
    const logs = await fetchAll(`
        SELECT nl.*, l.license_number, s.shop_name
        FROM notification_logs nl
        LEFT JOIN licenses l ON nl.license_id = l.id
        LEFT JOIN shops s ON l.shop_id = s.id
        ORDER BY nl.sent_at DESC
        LIMIT 50
    `);
    // Assuming 50 limit for now, PHPs config had a constant

    return NextResponse.json({ success: true, logs });
}

async function handleSaveSettings(request) {
    const data = await request.json();

    // Prepare update data
    const updateData = {
        days_before_expiry: parseInt(data.days_before_expiry || 30),
        is_active: data.is_active ? 1 : 0
    };

    if (data.telegram_bot_token) {
        updateData.telegram_bot_token = data.telegram_bot_token;
    }

    if (data.telegram_chat_id) {
        updateData.telegram_chat_id = data.telegram_chat_id;
    }

    const exists = await fetchOne("SELECT id FROM notification_settings WHERE id = 1");
    if (exists) {
        await update('notification_settings', updateData, 'id = $1', [1]);
    } else {
        updateData.id = 1;
        await insert('notification_settings', updateData);
    }

    return NextResponse.json({ success: true, message: 'บันทึกการตั้งค่าสำเร็จ' });
}

async function handleTestNotification() {
    const { telegramService, notificationService } = await getServices();

    // Validate config first
    if (!telegramService.botToken || !telegramService.chatId) {
        return NextResponse.json({ success: false, message: 'กรุณาตั้งค่า Telegram Bot Token และ Chat ID ก่อน' });
    }

    const result = await notificationService.sendTestNotification();
    return NextResponse.json(result);
}

async function handleCheckExpiring() {
    const { telegramService, notificationService } = await getServices();

    // Validate config
    if (!telegramService.botToken || !telegramService.chatId) {
        return NextResponse.json({ success: false, message: 'กรุณาตั้งค่า Telegram Bot Token และ Chat ID ก่อน' });
    }

    const result = await notificationService.checkAndSendExpiryNotifications();
    return NextResponse.json(result);
}

async function getServices() {
    let settings = await fetchOne("SELECT * FROM notification_settings WHERE id = 1");
    if (!settings) {
        await insert('notification_settings', { id: 1, days_before_expiry: 30, is_active: 0 });
        settings = await fetchOne("SELECT * FROM notification_settings WHERE id = 1");
    }

    const telegramService = new TelegramService(settings.telegram_bot_token, settings.telegram_chat_id);
    const notificationService = new NotificationService(telegramService, settings);

    return { telegramService, notificationService };
}
