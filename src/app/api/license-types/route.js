import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { fetchAll, fetchOne, insert, update, remove } from '@/lib/db';
import { sessionOptions } from '@/lib/session';
import { NextResponse } from 'next/server';

async function requireAuth() {
    const cookieStore = await cookies();
    const session = await getIronSession(cookieStore, sessionOptions);
    if (!session.userId) return null;
    return session;
}

export async function GET(request) {
    try {
        const session = await requireAuth();
        if (!session) {
            return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (id) {
            const type = await fetchOne('SELECT * FROM license_types WHERE id = $1', [id]);
            return NextResponse.json({ success: true, message: 'Success', type });
        } else {
            const types = await fetchAll(
                `SELECT lt.*, 
                        (SELECT COUNT(*) FROM licenses l WHERE l.license_type_id = lt.id) as license_count
                 FROM license_types lt 
                 ORDER BY lt.id ASC`
            );
            return NextResponse.json({ success: true, message: 'Success', types });
        }
    } catch (err) {
        console.error('License types GET error:', err);
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const session = await requireAuth();
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ success: false, message: 'ไม่มีสิทธิ์ดำเนินการ' }, { status: 403 });
        }

        const data = await request.json();

        if (!data.name) {
            return NextResponse.json({ success: false, message: 'กรุณากรอกชื่อประเภทใบอนุญาต' });
        }

        const id = await insert('license_types', {
            name: data.name,
            description: data.description || null,
            validity_days: data.validity_days || 365
        });

        return NextResponse.json({ success: true, message: 'เพิ่มประเภทใบอนุญาตสำเร็จ', id });
    } catch (err) {
        console.error('License types POST error:', err);
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const session = await requireAuth();
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ success: false, message: 'ไม่มีสิทธิ์ดำเนินการ' }, { status: 403 });
        }

        const data = await request.json();

        if (!data.id) {
            return NextResponse.json({ success: false, message: 'Missing license type ID' });
        }

        await update('license_types', {
            name: data.name,
            description: data.description || null,
            validity_days: data.validity_days || 365
        }, 'id = ?', [data.id]);

        return NextResponse.json({ success: true, message: 'แก้ไขประเภทใบอนุญาตสำเร็จ' });
    } catch (err) {
        console.error('License types PUT error:', err);
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const session = await requireAuth();
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ success: false, message: 'ไม่มีสิทธิ์ดำเนินการ' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, message: 'Missing license type ID' });
        }

        // Check if type is in use
        const inUse = await fetchOne(
            'SELECT COUNT(*) as count FROM licenses WHERE license_type_id = $1',
            [id]
        );

        if (parseInt(inUse?.count) > 0) {
            return NextResponse.json({ success: false, message: 'ไม่สามารถลบได้ เนื่องจากมีใบอนุญาตใช้ประเภทนี้อยู่' });
        }

        await remove('license_types', 'id = ?', [id]);

        return NextResponse.json({ success: true, message: 'ลบประเภทใบอนุญาตสำเร็จ' });
    } catch (err) {
        console.error('License types DELETE error:', err);
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
