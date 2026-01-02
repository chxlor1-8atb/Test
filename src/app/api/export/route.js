import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';
import { fetchAll } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    const session = await getSession();
    if (!session.userId) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'licenses';
    const format = searchParams.get('format') || 'json';

    try {
        if (type === 'licenses') {
            return await exportLicenses(searchParams, format);
        } else if (type === 'shops') {
            return await exportShops(format);
        } else if (type === 'users') {
            if (session.role !== 'admin') {
                return NextResponse.json({ success: false, message: 'Admin access required' }, { status: 403 });
            }
            return await exportUsers(format);
        }

        return NextResponse.json({ success: false, message: 'Invalid export type' });
    } catch (error) {
        console.error('Export API Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

async function getSession() {
    const cookieStore = await cookies();
    return await getIronSession(cookieStore, sessionOptions);
}

// --- Export Functions ---

async function exportLicenses(searchParams, format) {
    let query = `
        SELECT l.id, l.license_number, s.shop_code, s.shop_name, s.owner_name,
                lt.type_name as license_type, l.issue_date, l.expiry_date, l.status,
                l.notes, l.created_at
        FROM licenses l 
        JOIN shops s ON l.shop_id = s.id
        JOIN license_types lt ON l.license_type_id = lt.id
    `;

    const where = [];
    const params = [];

    if (searchParams.get('status')) {
        where.push(`l.status = $${params.length + 1}`);
        params.push(searchParams.get('status'));
    }

    if (searchParams.get('license_type')) {
        where.push(`l.license_type_id = $${params.length + 1}`);
        params.push(searchParams.get('license_type'));
    }

    if (searchParams.get('expiry_from')) {
        where.push(`l.expiry_date >= $${params.length + 1}`);
        params.push(searchParams.get('expiry_from'));
    }

    if (searchParams.get('expiry_to')) {
        where.push(`l.expiry_date <= $${params.length + 1}`);
        params.push(searchParams.get('expiry_to'));
    }

    if (where.length > 0) {
        query += ' WHERE ' + where.join(' AND ');
    }

    query += ' ORDER BY l.id DESC';

    const data = await fetchAll(query, params);

    if (format === 'csv') {
        const headers = {
            id: 'ID',
            license_number: 'เลขที่ใบอนุญาต',
            shop_code: 'รหัสร้าน',
            shop_name: 'ชื่อร้าน',
            owner_name: 'เจ้าของ',
            license_type: 'ประเภท',
            issue_date: 'วันที่ออก',
            expiry_date: 'วันหมดอายุ',
            status: 'สถานะ',
            notes: 'หมายเหตุ',
            created_at: 'วันที่สร้าง'
        };
        return outputCSV(data, 'licenses', headers);
    }

    return NextResponse.json({ success: true, data });
}

async function exportShops(format) {
    const data = await fetchAll(`
        SELECT s.id, s.shop_code, s.shop_name, s.owner_name, s.address,
                s.phone, s.email, s.notes, s.created_at,
                (SELECT COUNT(*) FROM licenses l WHERE l.shop_id = s.id) as license_count
        FROM shops s
        ORDER BY s.id DESC
    `);

    if (format === 'csv') {
        const headers = {
            id: 'ID',
            shop_code: 'รหัสร้าน',
            shop_name: 'ชื่อร้าน',
            owner_name: 'เจ้าของ',
            address: 'ที่อยู่',
            phone: 'โทรศัพท์',
            email: 'อีเมล',
            license_count: 'จำนวนใบอนุญาต',
            notes: 'หมายเหตุ',
            created_at: 'วันที่สร้าง'
        };
        return outputCSV(data, 'shops', headers);
    }

    return NextResponse.json({ success: true, data });
}

async function exportUsers(format) {
    const data = await fetchAll("SELECT id, username, full_name, role, created_at FROM users ORDER BY id DESC");

    if (format === 'csv') {
        const headers = {
            id: 'ID',
            username: 'ชื่อผู้ใช้',
            full_name: 'ชื่อเต็ม',
            role: 'ระดับ',
            created_at: 'วันที่สร้าง'
        };
        return outputCSV(data, 'users', headers);
    }

    return NextResponse.json({ success: true, data });
}

function outputCSV(data, filename, headers) {
    const csvRows = [];

    // Header row
    csvRows.push(Object.values(headers).join(','));

    // Data rows
    for (const row of data) {
        const values = Object.keys(headers).map(key => {
            const val = row[key];
            const escaped = (val === null || val === undefined) ? '' : String(val).replace(/"/g, '""');
            return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
    }

    const csvContent = "\uFEFF" + csvRows.join('\n'); // Add BOM

    return new NextResponse(csvContent, {
        status: 200,
        headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="${filename}_${new Date().toISOString().split('T')[0]}.csv"`,
        },
    });
}
