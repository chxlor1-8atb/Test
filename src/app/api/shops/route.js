import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { fetchAll, fetchOne, insert, update, remove } from '@/lib/db';
import { sessionOptions } from '@/lib/session';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Helper to check auth
async function requireAuth() {
    const cookieStore = await cookies();
    const session = await getIronSession(cookieStore, sessionOptions);
    if (!session.userId) {
        return null;
    }
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
            // Get single shop
            const shop = await fetchOne(
                `SELECT s.*, u.full_name as created_by_name 
                 FROM shops s 
                 LEFT JOIN users u ON s.created_by = u.id 
                 WHERE s.id = $1`,
                [id]
            );
            return NextResponse.json({ success: true, message: 'Success', shop });
        } else {
            // Get all shops with pagination
            const search = searchParams.get('search') || '';
            const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
            const limit = Math.min(100, Math.max(10, parseInt(searchParams.get('limit') || '20')));
            const offset = (page - 1) * limit;

            let whereClause = '';
            let params = [];

            if (search) {
                whereClause = `WHERE s.shop_name ILIKE $1 OR s.owner_name ILIKE $1`;
                params = [`%${search}%`];
            }

            // Get total count
            const countResult = await fetchOne(
                `SELECT COUNT(*) as total FROM shops s ${whereClause}`,
                params
            );
            const total = parseInt(countResult?.total || 0);
            const totalPages = Math.ceil(total / limit);

            // Get shops
            const shops = await fetchAll(
                `SELECT s.*, u.full_name as created_by_name,
                        (SELECT COUNT(*) FROM licenses l WHERE l.shop_id = s.id) as license_count
                 FROM shops s 
                 LEFT JOIN users u ON s.created_by = u.id 
                 ${whereClause}
                 ORDER BY s.id DESC
                 LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
                [...params, limit, offset]
            );

            return NextResponse.json({
                success: true,
                message: 'Success',
                shops,
                pagination: { page, limit, total, totalPages }
            });
        }
    } catch (err) {
        console.error('Shops GET error:', err);
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

        if (!data.shop_name) {
            return NextResponse.json({ success: false, message: 'กรุณากรอกชื่อร้านค้า' });
        }

        const id = await insert('shops', {
            shop_code: data.shop_code || `SHOP-${Date.now()}`,
            shop_name: data.shop_name,
            owner_name: data.owner_name || null,
            address: data.address || null,
            phone: data.phone || null,
            email: data.email || null,
            notes: data.notes || null,
            created_by: session.userId
        });

        return NextResponse.json({ success: true, message: 'เพิ่มร้านค้าสำเร็จ', id });
    } catch (err) {
        console.error('Shops POST error:', err);
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
            return NextResponse.json({ success: false, message: 'Missing shop ID' });
        }

        await update('shops', {
            shop_name: data.shop_name,
            owner_name: data.owner_name || null,
            address: data.address || null,
            phone: data.phone || null,
            email: data.email || null,
            notes: data.notes || null
        }, 'id = $1', [data.id]);

        return NextResponse.json({ success: true, message: 'แก้ไขข้อมูลร้านค้าสำเร็จ' });
    } catch (err) {
        console.error('Shops PUT error:', err);
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
            return NextResponse.json({ success: false, message: 'Missing shop ID' });
        }

        await remove('shops', 'id = ?', [id]);

        return NextResponse.json({ success: true, message: 'ลบร้านค้าสำเร็จ' });
    } catch (err) {
        console.error('Shops DELETE error:', err);
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
