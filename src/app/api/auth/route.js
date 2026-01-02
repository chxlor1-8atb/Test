import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { fetchOne } from '@/lib/db';
import { sessionOptions } from '@/lib/session';
import { NextResponse } from 'next/server';

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
            { success: false, message: 'เกิดข้อผิดพลาด: ' + err.message },
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
            { success: false, message: 'เกิดข้อผิดพลาด' },
            { status: 500 }
        );
    }
}

async function handleLogin(request) {
    const data = await request.json();
    const username = (data.username || '').trim();
    const password = data.password || '';

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

    return NextResponse.json({
        success: true,
        message: 'เข้าสู่ระบบสำเร็จ',
        data: {
            user: {
                id: user.id,
                username: user.username,
                full_name: user.full_name,
                role: user.role,
            },
        },
    });
}

async function handleLogout() {
    const cookieStore = await cookies();
    const session = await getIronSession(cookieStore, sessionOptions);
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
            data: {
                user: {
                    id: session.userId,
                    username: session.username,
                    full_name: session.fullName,
                    role: session.role,
                },
            },
        });
    }

    return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
    );
}
