
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { fetchAll, fetchOne, executeQuery } from '@/lib/db';
import { sessionOptions } from '@/lib/session';
import { NextResponse } from 'next/server';
import { logActivity, ACTIVITY_ACTIONS, ENTITY_TYPES } from '@/lib/activityLogger';

// Helper function to get current user from session
async function getCurrentUser() {
    const cookieStore = await cookies();
    const session = await getIronSession(cookieStore, sessionOptions);
    return session.userId ? { id: session.userId, username: session.username } : null;
}

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (id) {
            const type = await fetchOne('SELECT * FROM license_types WHERE id = $1', [id]);
            return NextResponse.json({ success: true, type });
        }

        const query = `
            SELECT lt.*, 
            (SELECT COUNT(*) FROM licenses l WHERE l.license_type_id = lt.id) as license_count
            FROM license_types lt
            ORDER BY lt.id ASC
        `;
        const types = await fetchAll(query);
        return NextResponse.json({ success: true, types });
    } catch (err) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { name, description, validity_days } = body;

        // Note: Legacy JS used 'type_name' but schema uses 'name'. Mapped in JS or here.
        // Let's stick to DB schema 'name'. The UI should send 'name'.

        if (!name) {
            return NextResponse.json({ success: false, message: 'Missing type name' }, { status: 400 });
        }

        const result = await executeQuery(
            `INSERT INTO license_types (name, description, validity_days) VALUES ($1, $2, $3) RETURNING id`,
            [name, description || '', parseInt(validity_days) || 365]
        );

        // Log activity
        const currentUser = await getCurrentUser();
        await logActivity({
            userId: currentUser?.id || null,
            action: ACTIVITY_ACTIONS.CREATE,
            entityType: ENTITY_TYPES.LICENSE_TYPE,
            entityId: result?.rows?.[0]?.id || null,
            details: `เพิ่มประเภทใบอนุญาต: ${name}`
        });

        return NextResponse.json({ success: true, message: 'เพิ่มประเภทใบอนุญาตเรียบร้อยแล้ว' });
    } catch (err) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const body = await request.json();
        const { id, name, description, validity_days } = body;

        if (!id || !name) {
            return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
        }

        await executeQuery(
            `UPDATE license_types SET name = $1, description = $2, validity_days = $3 WHERE id = $4`,
            [name, description, parseInt(validity_days), id]
        );

        // Log activity
        const currentUser = await getCurrentUser();
        await logActivity({
            userId: currentUser?.id || null,
            action: ACTIVITY_ACTIONS.UPDATE,
            entityType: ENTITY_TYPES.LICENSE_TYPE,
            entityId: parseInt(id),
            details: `แก้ไขประเภทใบอนุญาต: ${name}`
        });

        return NextResponse.json({ success: true, message: 'บันทึกเรียบร้อยแล้ว' });
    } catch (err) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, message: 'ID is required' }, { status: 400 });
        }

        // Get type info for logging
        const licenseType = await fetchOne('SELECT name FROM license_types WHERE id = $1', [id]);

        // Check if used
        const count = await fetchOne('SELECT COUNT(*) as count FROM licenses WHERE license_type_id = $1', [id]);
        if (parseInt(count.count) > 0) {
            return NextResponse.json({ success: false, message: 'ไม่สามารถลบได้ เนื่องจากมีการใช้งานอยู่' }, { status: 400 });
        }

        await executeQuery('DELETE FROM license_types WHERE id = $1', [id]);

        // Log activity
        const currentUser = await getCurrentUser();
        await logActivity({
            userId: currentUser?.id || null,
            action: ACTIVITY_ACTIONS.DELETE,
            entityType: ENTITY_TYPES.LICENSE_TYPE,
            entityId: parseInt(id),
            details: `ลบประเภทใบอนุญาต: ${licenseType?.name || id}`
        });

        return NextResponse.json({ success: true, message: 'ลบเรียบร้อยแล้ว' });
    } catch (err) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
