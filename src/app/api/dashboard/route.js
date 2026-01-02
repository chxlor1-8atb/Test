import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { fetchAll, fetchOne } from '@/lib/db';
import { sessionOptions } from '@/lib/session';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        // Check authentication
        const cookieStore = await cookies();
        const session = await getIronSession(cookieStore, sessionOptions);

        if (!session.userId) {
            return NextResponse.json(
                { success: false, message: 'Not authenticated' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action') || 'stats';

        switch (action) {
            case 'stats':
                return await getStats();
            case 'expiring_count':
                return await getExpiringCount();
            case 'license_breakdown':
                return await getLicenseBreakdown();
            case 'recent_activity':
                return await getRecentActivity();
            default:
                return await getStats();
        }
    } catch (err) {
        console.error('Dashboard error:', err);
        return NextResponse.json(
            { success: false, message: 'เกิดข้อผิดพลาด: ' + err.message },
            { status: 500 }
        );
    }
}

async function getStats() {
    // Optimized: Fetch all stats in a single database round-trip
    const query = `
        SELECT 
            (SELECT COUNT(*) FROM shops) as total_shops,
            (SELECT COUNT(*) FROM licenses) as total_licenses,
            (SELECT COUNT(*) FROM licenses WHERE status = 'active' AND expiry_date >= CURRENT_DATE) as active_licenses,
            (SELECT COUNT(*) FROM licenses WHERE status = 'expired' OR expiry_date < CURRENT_DATE) as expired_licenses,
            (SELECT COUNT(*) FROM licenses WHERE status = 'active' AND expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days') as expiring_soon,
            (SELECT COUNT(*) FROM users) as total_users
    `;

    const result = await fetchOne(query);

    return NextResponse.json({
        success: true,
        message: 'Success',
        stats: {
            total_shops: parseInt(result?.total_shops || 0),
            total_licenses: parseInt(result?.total_licenses || 0),
            active_licenses: parseInt(result?.active_licenses || 0),
            expired_licenses: parseInt(result?.expired_licenses || 0),
            expiring_soon: parseInt(result?.expiring_soon || 0),
            total_users: parseInt(result?.total_users || 0),
            expiry_warning_days: 30
        },
        expiring: []
    });
}

async function getLicenseBreakdown() {
    const breakdown = await fetchAll(
        `SELECT 
            lt.id,
            lt.name as type_name,
            COUNT(l.id) as total_count,
            SUM(CASE WHEN l.status = 'active' AND l.expiry_date >= CURRENT_DATE THEN 1 ELSE 0 END) as active_count,
            SUM(CASE WHEN l.status = 'active' AND l.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days' THEN 1 ELSE 0 END) as expiring_count,
            SUM(CASE WHEN l.status = 'expired' OR l.expiry_date < CURRENT_DATE THEN 1 ELSE 0 END) as expired_count
         FROM license_types lt
         LEFT JOIN licenses l ON lt.id = l.license_type_id
         GROUP BY lt.id, lt.name
         ORDER BY total_count DESC`
    );

    return NextResponse.json({
        success: true,
        message: 'Success',
        breakdown
    });
}

async function getExpiringCount() {
    const result = await fetchOne(
        "SELECT COUNT(*) as count FROM licenses WHERE status = 'active' AND expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'"
    );
    return NextResponse.json({
        success: true,
        count: parseInt(result?.count || 0)
    });
}

async function getRecentActivity() {
    const activities = await fetchAll(`
        SELECT a.*, COALESCE(u.full_name, 'System') as user_name 
        FROM audit_logs a
        LEFT JOIN users u ON a.user_id = u.id
        ORDER BY a.created_at DESC 
        LIMIT 10
    `);
    return NextResponse.json({ success: true, activities });
}
