import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { fetchOne } from '@/lib/db';
import { sessionOptions } from '@/lib/session';
import { NextResponse } from 'next/server';
import { logActivity, ACTIVITY_ACTIONS, ENTITY_TYPES } from '@/lib/activityLogger';

// Cloudflare Turnstile Verification
async function verifyTurnstile(token) {
    const secretKey = process.env.TURNSTILE_SECRET_KEY || '1x0000000000000000000000000000000AA'; // Use testing key as fallback/dev
    
    if (!token) return false;

    try {
        const formData = new FormData();
        formData.append('secret', secretKey);
        formData.append('response', token);

        const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            body: formData,
        });

        const outcome = await result.json();
        return outcome.success;
    } catch (e) {
        console.error('Turnstile verification error:', e);
        return false;
    }
}

export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');

        switch (action) {
            case 'login':
                return await handleLogin(request);
            case 'logout':
                return await handleLogout();
            default:
                return NextResponse.json({ success: false, message: 'Invalid action' });
        }
    } catch (err) {
        console.error('Auth error:', err);
        return NextResponse.json(
            { success: false, message: 'เกิดข้อผิดพลาดภายในระบบ' },
            { status: 500 }
        );
    }
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');

        if (action === 'check') {
            return await checkAuth();
        }

        return NextResponse.json({ success: false, message: 'Invalid action' });
    } catch (err) {
        console.error('Auth error:', err);
        return NextResponse.json(
            { success: false, message: 'เกิดข้อผิดพลาดภายในระบบ' },
            { status: 500 }
        );
    }
}

async function handleLogin(request) {
    const data = await request.json();
    const username = (data.username || '').trim();
    const password = data.password || '';
    const turnstileToken = data['cf-turnstile-response'];

    // 1. Verify Turnstile CAPTCHA
    const isHuman = await verifyTurnstile(turnstileToken);
    
    // In development mode, you might want to skip this or use a specific flag
    // But for security, we enforce it if a token is expected
    if (!isHuman && process.env.NODE_ENV === 'production') {
        return NextResponse.json({
            success: false,
            message: 'การตรวจสอบความปลอดภัยล้มเหลว (CAPTCHA Failed)'
        });
    }

    if (!username || !password) {
        return NextResponse.json({
            success: false,
            message: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน'
        });
    }

    // Find user by username
    const user = await fetchOne(
        'SELECT * FROM users WHERE username = $1',
        [username]
    );

    if (!user) {
        return NextResponse.json({
            success: false,
            message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'
        });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
        return NextResponse.json({
            success: false,
            message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'
        });
    }

    // Create session using cookies()
    const cookieStore = await cookies();
    const session = await getIronSession(cookieStore, sessionOptions);

    session.userId = user.id;
    session.username = user.username;
    session.fullName = user.full_name;
    session.role = user.role;
    session.loginTime = Date.now();
    await session.save();

    // Log login activity
    await logActivity({
        userId: user.id,
        action: ACTIVITY_ACTIONS.LOGIN,
        entityType: ENTITY_TYPES.AUTH,
        details: `เข้าสู่ระบบด้วยชื่อผู้ใช้: ${user.username}`
    });

    return NextResponse.json({
        success: true,
        message: 'เข้าสู่ระบบสำเร็จ',
        user: {
            id: user.id,
            username: user.username,
            full_name: user.full_name,
            role: user.role,
        },
    });
}

async function handleLogout() {
    const cookieStore = await cookies();
    const session = await getIronSession(cookieStore, sessionOptions);

    // Log logout activity before destroying session
    if (session.userId) {
        await logActivity({
            userId: session.userId,
            action: ACTIVITY_ACTIONS.LOGOUT,
            entityType: ENTITY_TYPES.AUTH,
            details: `ออกจากระบบ: ${session.username}`
        });
    }

    session.destroy();

    return NextResponse.json({ success: true, message: 'ออกจากระบบสำเร็จ' });
}

async function checkAuth() {
    const cookieStore = await cookies();
    const session = await getIronSession(cookieStore, sessionOptions);

    if (session.userId) {
        return NextResponse.json({
            success: true,
            message: 'Authenticated',
            user: {
                id: session.userId,
                username: session.username,
                full_name: session.fullName,
                role: session.role,
            },
        });
    }

    return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
    );
}
