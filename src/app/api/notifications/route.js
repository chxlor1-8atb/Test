import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { NextResponse } from 'next/server';
import { executeQuery, fetchOne, fetchAll } from '@/lib/db';
import { sessionOptions } from '@/lib/session';
import { logActivity, ACTIVITY_ACTIONS, ENTITY_TYPES } from '@/lib/activityLogger';

// Helper function to get current user from session
async function getCurrentUser() {
    const cookieStore = await cookies();
    const session = await getIronSession(cookieStore, sessionOptions);
    return session.userId ? { id: session.userId, username: session.username } : null;
}

async function sendTelegramMessage(token, chatId, message) {
    if (!token || !chatId) throw new Error('Token or Chat ID missing');
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'HTML'
        })
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.description || 'Telegram API Error');
    return data;
}

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    try {
        if (action === 'settings') {
            const settings = await fetchOne('SELECT * FROM notification_settings LIMIT 1');
            return NextResponse.json({
                success: true,
                settings: settings || { days_before_expiry: 30, is_active: false }
            });
        }

        if (action === 'logs') {
            const logs = await fetchAll('SELECT * FROM notification_logs ORDER BY sent_at DESC LIMIT 50');
            return NextResponse.json({ success: true, logs });
        }

        return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { action } = body;

        if (action === 'save_settings') {
            const { telegram_bot_token, telegram_chat_id, days_before_expiry, is_active } = body;

            // Mask or update token? Front-end logic handles masking usually.
            // If token is empty string, maybe don't update it? Original JS sends simplified/masked token logic?
            // "กรอกเฉพาะเมื่อต้องการเปลี่ยนแปลง Token" - implies frontend sends basic masked string if unchanged.
            // But here we just update what we get. The SQL UPDATE should handle it.
            // Actually, let's fetch existing first.

            const existing = await fetchOne('SELECT * FROM notification_settings LIMIT 1');
            let newToken = telegram_bot_token;
            if (!newToken && existing) newToken = existing.telegram_bot_token;

            // Update
            await executeQuery(
                `UPDATE notification_settings SET 
                 telegram_bot_token = $1, 
                 telegram_chat_id = $2, 
                 days_before_expiry = $3, 
                 is_active = $4,
                 updated_at = NOW()
                 WHERE id = (SELECT id FROM notification_settings LIMIT 1)`,
                [newToken, telegram_chat_id, days_before_expiry, is_active]
            );

            // Log activity
            const currentUser = await getCurrentUser();
            await logActivity({
                userId: currentUser?.id || null,
                action: ACTIVITY_ACTIONS.UPDATE,
                entityType: ENTITY_TYPES.SETTINGS,
                details: `บันทึกการตั้งค่าการแจ้งเตือน (เปิดใช้งาน: ${is_active ? 'ใช่' : 'ไม่'}, แจ้งล่วงหน้า: ${days_before_expiry} วัน)`
            });

            return NextResponse.json({ success: true, message: 'บันทึกการตั้งค่าเรียบร้อย' });
        }

        if (action === 'test') {
            const settings = await fetchOne('SELECT * FROM notification_settings LIMIT 1');
            if (!settings || !settings.telegram_bot_token || !settings.telegram_chat_id) {
                return NextResponse.json({ success: false, message: 'ยังไม่ได้ตั้งค่า Telegram' });
            }

            try {
                await sendTelegramMessage(
                    settings.telegram_bot_token,
                    settings.telegram_chat_id,
                    '🔔 <b>Test Notification</b>\nทดสอบการแจ้งเตือนจากระบบ Shop License'
                );
                return NextResponse.json({ success: true, message: 'ส่งข้อความทดสอบสำเร็จ' });
            } catch (err) {
                return NextResponse.json({ success: false, message: 'ส่งข้อความไม่สำเร็จ: ' + err.message });
            }
        }

        if (action === 'check-expiring') {
            const settings = await fetchOne('SELECT * FROM notification_settings LIMIT 1');
            if (!settings || !settings.is_active) {
                return NextResponse.json({ success: false, message: 'การแจ้งเตือนถูกปิดอยู่' });
            }

            // Find expiring licenses
            const days = settings.days_before_expiry || 30;
            const expiringLicenses = await fetchAll(`
                SELECT l.*, s.shop_name, t.name as type_name 
                FROM licenses l
                JOIN shops s ON l.shop_id = s.id
                JOIN license_types t ON l.license_type_id = t.id
                WHERE l.status = 'active'
                AND l.expiry_date <= (CURRENT_DATE + interval '${days} days')
                AND l.expiry_date >= CURRENT_DATE
            `);

            let sentCount = 0;
            let errorCount = 0;

            for (const license of expiringLicenses) {
                const daysLeft = Math.ceil((new Date(license.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
                const message = `⚠️ <b>แจ้งเตือนใบอนุญาตใกล้หมดอายุ</b>\n\n` +
                    `ร้านค้า: <b>${license.shop_name}</b>\n` +
                    `ประเภท: ${license.type_name}\n` +
                    `หมดอายุ: ${new Date(license.expiry_date).toLocaleDateString('th-TH')}\n` +
                    `เหลือเวลา: ${daysLeft} วัน`;

                try {
                    await sendTelegramMessage(settings.telegram_bot_token, settings.telegram_chat_id, message);
                    await executeQuery(
                        `INSERT INTO notification_logs (shop_name, status, message) VALUES ($1, 'success', $2)`,
                        [license.shop_name, message]
                    );
                    sentCount++;
                } catch (err) {
                    await executeQuery(
                        `INSERT INTO notification_logs (shop_name, status, message) VALUES ($1, 'error', $2)`,
                        [license.shop_name, err.message]
                    );
                    errorCount++;
                }
            }

            return NextResponse.json({
                success: true,
                message: `ส่งการแจ้งเตือนสำเร็จ ${sentCount} รายการ (ผิดพลาด ${errorCount} รายการ)`
            });
        }

        if (action === 'clear_logs') {
            const { ids } = body;
            
            if (ids && Array.isArray(ids) && ids.length > 0) {
                // Delete specific logs
                // Use a parameterized query for safety. 
                // Since executeQuery doesn't support array directly for IN clause easily in this basic helper properly without unnest or multiple placeholders.
                // We'll generate placeholders like $1, $2, ...
                const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
                await executeQuery(
                    `DELETE FROM notification_logs WHERE id IN (${placeholders})`,
                    ids
                );
                return NextResponse.json({ success: true, message: `ลบประวัติการแจ้งเตือน ${ids.length} รายการเรียบร้อยแล้ว` });
            } else {
                // Delete all
                await executeQuery('DELETE FROM notification_logs');
                return NextResponse.json({ success: true, message: 'ล้างประวัติการแจ้งเตือนทั้งหมดเรียบร้อยแล้ว' });
            }
        }

        return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
