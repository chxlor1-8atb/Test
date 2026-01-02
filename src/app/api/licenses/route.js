import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { fetchAll, fetchOne, insert, update, remove, query } from '@/lib/db';
import { sessionOptions } from '@/lib/session';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

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
            const license = await fetchOne(
                `SELECT l.*, s.name as shop_name, lt.name as type_name,
                        u.full_name as created_by_name
                 FROM licenses l 
                 JOIN shops s ON l.shop_id = s.id
                 JOIN license_types lt ON l.license_type_id = lt.id
                 LEFT JOIN users u ON l.created_by = u.id 
                 WHERE l.id = $1`,
                [id]
            );
            return NextResponse.json({ success: true, message: 'Success', license });
        } else {
            const search = searchParams.get('search') || '';
            const status = searchParams.get('status') || '';
            const licenseType = searchParams.get('license_type') || '';
            const shopId = searchParams.get('shop_id') || '';
            const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
            const limit = Math.min(100, Math.max(10, parseInt(searchParams.get('limit') || '20')));
            const offset = (page - 1) * limit;

            let conditions = [];
            let params = [];
            let paramIndex = 1;

            if (search) {
                conditions.push(`s.name ILIKE $${paramIndex++}`);
                params.push(`%${search}%`);
            }
            if (status) {
                conditions.push(`l.status = $${paramIndex++}`);
                params.push(status);
            }
            if (licenseType) {
                conditions.push(`l.license_type_id = $${paramIndex++}`);
                params.push(licenseType);
            }
            if (shopId) {
                conditions.push(`l.shop_id = $${paramIndex++}`);
                params.push(shopId);
            }

            const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

            const countResult = await fetchOne(
                `SELECT COUNT(*) as total
                 FROM licenses l 
                 JOIN shops s ON l.shop_id = s.id
                 JOIN license_types lt ON l.license_type_id = lt.id
                 ${whereClause}`,
                params
            );
            const total = parseInt(countResult?.total || 0);
            const totalPages = Math.ceil(total / limit);

            const licenses = await fetchAll(
                `SELECT l.*, s.name as shop_name, lt.name as type_name,
                        u.full_name as created_by_name,
                        (l.expiry_date - CURRENT_DATE) as days_until_expiry
                 FROM licenses l 
                 JOIN shops s ON l.shop_id = s.id
                 JOIN license_types lt ON l.license_type_id = lt.id
                 LEFT JOIN users u ON l.created_by = u.id 
                 ${whereClause}
                 ORDER BY l.expiry_date ASC
                 LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
                [...params, limit, offset]
            );

            return NextResponse.json({
                success: true,
                message: 'Success',
                licenses,
                pagination: { page, limit, total, totalPages }
            });
        }
    } catch (err) {
        console.error('Licenses GET error:', err);
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const session = await requireAuth();
        if (!session) {
            return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
        }

        const data = await request.json();

        if (!data.shop_id || !data.license_type_id || !data.issue_date || !data.expiry_date) {
            return NextResponse.json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
        }

        const id = await insert('licenses', {
            shop_id: data.shop_id,
            license_type_id: data.license_type_id,
            license_number: data.license_number || null,
            issue_date: data.issue_date,
            expiry_date: data.expiry_date,
            status: data.status || 'active',
            notes: data.notes || null,
            created_by: session.userId
        });

        return NextResponse.json({ success: true, message: 'เพิ่มใบอนุญาตสำเร็จ', id });
    } catch (err) {
        console.error('Licenses POST error:', err);
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const session = await requireAuth();
        if (!session) {
            return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
        }

        const data = await request.json();

        if (!data.id) {
            return NextResponse.json({ success: false, message: 'Missing license ID' });
        }

        await update('licenses', {
            shop_id: data.shop_id,
            license_type_id: data.license_type_id,
            license_number: data.license_number || null,
            issue_date: data.issue_date,
            expiry_date: data.expiry_date,
            status: data.status,
            notes: data.notes || null
        }, 'id = ?', [data.id]);

        return NextResponse.json({ success: true, message: 'แก้ไขข้อมูลใบอนุญาตสำเร็จ' });
    } catch (err) {
        console.error('Licenses PUT error:', err);
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const session = await requireAuth();
        if (!session) {
            return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, message: 'Missing license ID' });
        }

        await remove('licenses', 'id = ?', [id]);

        return NextResponse.json({ success: true, message: 'ลบใบอนุญาตสำเร็จ' });
    } catch (err) {
        console.error('Licenses DELETE error:', err);
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
