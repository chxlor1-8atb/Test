
import { fetchAll } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');
        const format = searchParams.get('format') || 'csv';

        if (format !== 'csv') {
            return NextResponse.json({ success: false, message: 'Only CSV format is supported' }, { status: 400 });
        }

        let data = [];
        let filename = `export_${type}_${new Date().toISOString().split('T')[0]}.csv`;
        let columns = [];

        if (type === 'licenses') {
            const license_type = searchParams.get('license_type');
            const status = searchParams.get('status');
            const expiry_from = searchParams.get('expiry_from');
            const expiry_to = searchParams.get('expiry_to');

            let whereClauses = [];
            let params = [];
            let paramIndex = 1;

            if (license_type) {
                whereClauses.push(`l.license_type_id = $${paramIndex++}`);
                params.push(license_type);
            }
            if (status) {
                whereClauses.push(`l.status = $${paramIndex++}`);
                params.push(status);
            }
            if (expiry_from) {
                whereClauses.push(`l.expiry_date >= $${paramIndex++}`);
                params.push(expiry_from);
            }
            if (expiry_to) {
                whereClauses.push(`l.expiry_date <= $${paramIndex++}`);
                params.push(expiry_to);
            }

            const whereSQL = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

            const query = `
                SELECT 
                    l.license_number, 
                    s.shop_name, 
                    lt.name as type_name, 
                    l.issue_date, 
                    l.expiry_date, 
                    l.status,
                    l.notes
                FROM licenses l
                LEFT JOIN shops s ON l.shop_id = s.id
                LEFT JOIN license_types lt ON l.license_type_id = lt.id
                ${whereSQL}
                ORDER BY l.id DESC
            `;
            data = await fetchAll(query, params);
            columns = ['License Number', 'Shop Name', 'Type', 'Issue Date', 'Expiry Date', 'Status', 'Notes'];

        } else if (type === 'shops') {
            // Check admin logic if needed, but for now allow
            data = await fetchAll(`
                SELECT shop_name, owner_name, phone, email, address, notes, created_at
                FROM shops
                ORDER BY id DESC
            `);
            columns = ['Shop Name', 'Owner', 'Phone', 'Email', 'Address', 'Notes', 'Created At'];

        } else if (type === 'users') {
            // RESTRICT TO ADMIN logic needed? Assuming dashboard access implies admin for this system
            data = await fetchAll(`
                SELECT username, created_at
                FROM users
                ORDER BY id ASC
            `);
            columns = ['Username', 'Created At'];
        } else {
            return NextResponse.json({ success: false, message: 'Invalid export type' }, { status: 400 });
        }

        // Convert to CSV
        const csvRows = [];
        csvRows.push(columns.join(',')); // Header

        for (const row of data) {
            const values = Object.values(row).map(val => {
                if (val === null || val === undefined) return '';
                // Escape quotes and wrap in quotes if contains comma or quote
                const stringVal = String(val);
                if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
                    return `"${stringVal.replace(/"/g, '""')}"`;
                }
                return stringVal;
            });
            csvRows.push(values.join(','));
        }

        const csvContent = '\uFEFF' + csvRows.join('\n'); // Add BOM for Excel UTF-8 support

        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="${filename}"`
            }
        });

    } catch (err) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
