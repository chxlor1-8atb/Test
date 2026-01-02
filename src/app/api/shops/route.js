
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
        const countResult = await fetchOne(countQuery, params);
        const total = parseInt(countResult?.total || 0, 10);
        const totalPages = Math.ceil(total / limit);

        const query = `
            SELECT s.*, 
            (SELECT COUNT(*) FROM licenses l WHERE l.shop_id = s.id AND l.status = 'active') as license_count
            FROM shops s
            ${whereClause}
            ORDER BY s.id DESC
            LIMIT ${limit} OFFSET ${offset}
        `;

        // Adjust params for the second query if search is present
        // If search is present, params has 1 element.
        // LIMIT and OFFSET should be injected directly or appended to params?
        // fetchAll uses pg query, supports numbered params.
        // If using variables for limit/offset, they need indices.
        // Simpler to inject integers for limit/offset since they are parsed securely above.

        const shops = await fetchAll(query, params);

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
