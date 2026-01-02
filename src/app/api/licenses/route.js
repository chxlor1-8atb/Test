
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
        const license_type = searchParams.get('license_type') || '';
        const status = searchParams.get('status') || '';
        const page = parseInt(searchParams.get('page'), 10) || 1;
        const limit = parseInt(searchParams.get('limit'), 10) || 20;
        const offset = (page - 1) * limit;

        // Get Single License
        if (id) {
            const license = await fetchOne('SELECT * FROM licenses WHERE id = $1', [id]);
            return NextResponse.json({ success: true, license });
        }

        // List Licenses
        let whereClauses = [];
        let params = [];
        let paramIndex = 1;

        if (search) {
            whereClauses.push(`(s.shop_name ILIKE $${paramIndex} OR l.license_number ILIKE $${paramIndex})`);
            params.push(`%${search}%`);
            paramIndex++;
        }

        if (license_type) {
            whereClauses.push(`l.license_type_id = $${paramIndex}`);
            params.push(license_type);
            paramIndex++;
        }

        if (status) {
            whereClauses.push(`l.status = $${paramIndex}`);
            params.push(status);
            paramIndex++;
        }

        let whereSQL = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

        const countQuery = `
            SELECT COUNT(*) as total 
            FROM licenses l
            LEFT JOIN shops s ON l.shop_id = s.id
            ${whereSQL}
        `;

        // Parallelize Count and Data Fetch
        const query = `
            SELECT l.*, s.shop_name, lt.name as type_name
            FROM licenses l
            LEFT JOIN shops s ON l.shop_id = s.id
            LEFT JOIN license_types lt ON l.license_type_id = lt.id
            ${whereSQL}
            ORDER BY l.id DESC
            LIMIT ${limit} OFFSET ${offset}
        `;

        const [countResult, licenses] = await Promise.all([
            fetchOne(countQuery, params),
            fetchAll(query, params)
        ]);

        const total = parseInt(countResult?.total || 0, 10);
        const totalPages = Math.ceil(total / limit);

        return NextResponse.json({
            success: true,
            licenses,
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
        const { shop_id, license_type_id, license_number, issue_date, expiry_date, status, notes } = body;

        if (!shop_id || !license_type_id || !license_number) {
            return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
        }

        await executeQuery(
            `INSERT INTO licenses (shop_id, license_type_id, license_number, issue_date, expiry_date, status, notes) 
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [shop_id, license_type_id, license_number, issue_date, expiry_date, status || 'active', notes]
        );

        return NextResponse.json({ success: true, message: 'เพิ่มใบอนุญาตเรียบร้อยแล้ว' });
    } catch (err) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const body = await request.json();
        const { id, shop_id, license_type_id, license_number, issue_date, expiry_date, status, notes } = body;

        if (!id || !shop_id || !license_type_id) {
            return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
        }

        await executeQuery(
            `UPDATE licenses 
             SET shop_id = $1, license_type_id = $2, license_number = $3, issue_date = $4, expiry_date = $5, status = $6, notes = $7
             WHERE id = $8`,
            [shop_id, license_type_id, license_number, issue_date, expiry_date, status, notes, id]
        );

        return NextResponse.json({ success: true, message: 'บันทึกใบอนุญาตเรียบร้อยแล้ว' });
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

        await executeQuery('DELETE FROM licenses WHERE id = $1', [id]);

        return NextResponse.json({ success: true, message: 'ลบใบอนุญาตเรียบร้อยแล้ว' });
    } catch (err) {
        return NextResponse.json({ success: false, message: 'ไม่สามารถลบได้' }, { status: 500 });
    }
}
