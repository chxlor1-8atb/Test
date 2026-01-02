import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import bcrypt from 'bcryptjs';
import { fetchAll, fetchOne, insert, update, remove } from '@/lib/db';
import { sessionOptions } from '@/lib/session';
import { NextResponse } from 'next/server';

async function requireAdmin() {
    const cookieStore = await cookies();
    const session = await getIronSession(cookieStore, sessionOptions);
    if (!session.userId || session.role !== 'admin') return null;
    return session;
}

export async function GET(request) {
    try {
        const session = await requireAdmin();
        if (!session) {
            return NextResponse.json({ success: false, message: 'ไม่มีสิทธิ์ดำเนินการ' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (id) {
            const user = await fetchOne(
                'SELECT id, username, full_name, email, phone, role, created_at FROM users WHERE id = $1',
                [id]
            );
            return NextResponse.json({ success: true, message: 'Success', user });
        } else {
            const users = await fetchAll(
                'SELECT id, username, full_name, email, phone, role, created_at FROM users ORDER BY id DESC'
            );
            return NextResponse.json({ success: true, message: 'Success', users });
        }
    } catch (err) {
        console.error('Users GET error:', err);
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const session = await requireAdmin();
        if (!session) {
            return NextResponse.json({ success: false, message: 'ไม่มีสิทธิ์ดำเนินการ' }, { status: 403 });
        }

        const data = await request.json();

        if (!data.username || !data.password || !data.full_name) {
            return NextResponse.json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
        }

        // Check if username exists
        const exists = await fetchOne('SELECT id FROM users WHERE username = $1', [data.username]);
        if (exists) {
            return NextResponse.json({ success: false, message: 'ชื่อผู้ใช้นี้มีอยู่แล้ว' });
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);

        const id = await insert('users', {
            username: data.username,
            password: hashedPassword,
            full_name: data.full_name,
            email: data.email || null,
            phone: data.phone || null,
            role: data.role || 'user'
        });

        return NextResponse.json({ success: true, message: 'เพิ่มผู้ใช้สำเร็จ', id });
    } catch (err) {
        console.error('Users POST error:', err);
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const session = await requireAdmin();
        if (!session) {
            return NextResponse.json({ success: false, message: 'ไม่มีสิทธิ์ดำเนินการ' }, { status: 403 });
        }

        const data = await request.json();

        if (!data.id) {
            return NextResponse.json({ success: false, message: 'Missing user ID' });
        }

        const updateData = {
            full_name: data.full_name,
            email: data.email || null,
            phone: data.phone || null,
            role: data.role
        };

        // Update password if provided
        if (data.password) {
            updateData.password = await bcrypt.hash(data.password, 10);
        }

        await update('users', updateData, 'id = ?', [data.id]);

        return NextResponse.json({ success: true, message: 'แก้ไขข้อมูลผู้ใช้สำเร็จ' });
    } catch (err) {
        console.error('Users PUT error:', err);
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const session = await requireAdmin();
        if (!session) {
            return NextResponse.json({ success: false, message: 'ไม่มีสิทธิ์ดำเนินการ' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, message: 'Missing user ID' });
        }

        // Prevent self-deletion
        if (parseInt(id) === session.userId) {
            return NextResponse.json({ success: false, message: 'ไม่สามารถลบบัญชีตัวเองได้' });
        }

        await remove('users', 'id = ?', [id]);

        return NextResponse.json({ success: true, message: 'ลบผู้ใช้สำเร็จ' });
    } catch (err) {
        console.error('Users DELETE error:', err);
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
