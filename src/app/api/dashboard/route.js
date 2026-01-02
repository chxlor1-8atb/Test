import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { fetchAll, fetchOne } from '@/lib/db';
import { sessionOptions } from '@/lib/session';
import { NextResponse } from 'next/server';

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
            case 'license_breakdown':
                return await getLicenseBreakdown();
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
    // Total shops
    const shopsResult = await fetchOne('SELECT COUNT(*) as count FROM shops');
    const totalShops = parseInt(shopsResult?.count || 0);

    // Total licenses
    const licensesResult = await fetchOne('SELECT COUNT(*) as count FROM licenses');
    const totalLicenses = parseInt(licensesResult?.count || 0);

    // Active licenses
    const activeResult = await fetchOne(
        "SELECT COUNT(*) as count FROM licenses WHERE status = 'active' AND expiry_date >= CURRENT_DATE"
    );
    const activeLicenses = parseInt(activeResult?.count || 0);

    // Expired licenses  
    const expiredResult = await fetchOne(
        "SELECT COUNT(*) as count FROM licenses WHERE status = 'expired' OR expiry_date < CURRENT_DATE"
    );
    const expiredLicenses = parseInt(expiredResult?.count || 0);

    // Expiring soon (within 30 days)
    const expiringSoonResult = await fetchOne(
        "SELECT COUNT(*) as count FROM licenses WHERE status = 'active' AND expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'"
    );
    const expiringSoon = parseInt(expiringSoonResult?.count || 0);

    // Total users
    const usersResult = await fetchOne('SELECT COUNT(*) as count FROM users');
    const totalUsers = parseInt(usersResult?.count || 0);

    return NextResponse.json({
        success: true,
        message: 'Success',
        stats: {
            total_shops: totalShops,
            total_licenses: totalLicenses,
            active_licenses: activeLicenses,
            expired_licenses: expiredLicenses,
            expiring_soon: expiringSoon,
            total_users: totalUsers,
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
