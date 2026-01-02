
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { fetchAll, fetchOne, executeQuery } from '@/lib/db';
import { sessionOptions } from '@/lib/session';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const search = searchParams.get('search') || '';
        const page = parseInt(searchParams.get('page'), 10) || 1;
        const limit = parseInt(searchParams.get('limit'), 10) || 20;
        const offset = (page - 1) * limit;

        // Get Single Shop
        if (id) {
            const shop = await fetchOne('SELECT * FROM shops WHERE id = $1', [id]);
            return NextResponse.json({ success: true, shop });
        }

        // List Shops
        let whereClause = '';
        let params = [];

        if (search) {
            whereClause = `WHERE shop_name ILIKE $1 OR owner_name ILIKE $1 OR phone ILIKE $1`;
            params.push(`%${search}%`);
        }

        const countQuery = `SELECT COUNT(*) as total FROM shops ${whereClause}`;
        const query = `
            SELECT s.*, 
            (SELECT COUNT(*) FROM licenses l WHERE l.shop_id = s.id AND l.status = 'active') as license_count
            FROM shops s
            ${whereClause}
            ORDER BY s.id DESC
            LIMIT ${limit} OFFSET ${offset}
        `;

        const [countResult, shops] = await Promise.all([
            fetchOne(countQuery, params),
            fetchAll(query, params)
        ]);

        const total = parseInt(countResult?.total || 0, 10);
        const totalPages = Math.ceil(total / limit);

        return NextResponse.json({
            success: true,
            shops,
            pagination: {
                page,
                limit,
                total,
                totalPages
            }
        });

    } catch (err) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { shop_name, owner_name, address, phone, email, notes } = body;

        if (!shop_name) {
            return NextResponse.json({ success: false, message: 'Shop name is required' }, { status: 400 });
        }

        await executeQuery(
            `INSERT INTO shops (shop_name, owner_name, address, phone, email, notes) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [shop_name, owner_name, address, phone, email, notes]
        );

        return NextResponse.json({ success: true, message: 'เพิ่มร้านค้าเรียบร้อยแล้ว' });
    } catch (err) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const body = await request.json();
        const { id, shop_name, owner_name, address, phone, email, notes } = body;

        if (!id || !shop_name) {
            return NextResponse.json({ success: false, message: 'ID and Shop name are required' }, { status: 400 });
        }

        await executeQuery(
            `UPDATE shops 
             SET shop_name = $1, owner_name = $2, address = $3, phone = $4, email = $5, notes = $6
             WHERE id = $7`,
            [shop_name, owner_name, address, phone, email, notes, id]
        );

        return NextResponse.json({ success: true, message: 'อัปเดตร้านค้าเรียบร้อยแล้ว' });
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

        // Check for licenses first? Usually constraints handle this, but let's just create generic logic.
        // Assuming cascade or check logic. For now just delete.
        await executeQuery('DELETE FROM shops WHERE id = $1', [id]);

        return NextResponse.json({ success: true, message: 'ลบร้านค้าเรียบร้อยแล้ว' });
    } catch (err) {
        return NextResponse.json({ success: false, message: 'ไม่สามารถลบได้ (อาจมีใบอนุญาตผูกอยู่)' }, { status: 500 });
    }
}
