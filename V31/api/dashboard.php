<?php
/**
 * Dashboard API
 * Statistics and reporting data
 */

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/ApiResponse.php';
require_once __DIR__ . '/../includes/AuthMiddleware.php';
require_once __DIR__ . '/../includes/RequestHelper.php';
require_once __DIR__ . '/../includes/SecurityHeaders.php';

// Apply security headers
SecurityHeaders::apply();
RequestHelper::setJsonHeader();

// Check authentication
AuthMiddleware::requireAuth();

$action = $_GET['action'] ?? 'stats';

switch ($action) {
    case 'stats':
        getStats();
        break;
    case 'expiring':
        getExpiringLicensesPaginated();
        break;
    case 'chart':
        getChartData();
        break;
    case 'license_breakdown':
        getLicenseBreakdown();
        break;
    case 'top_shops':
        getTopShops();
        break;
    default:
        getStats();
}

function getStats()
{
    // Auto-update expired licenses status
    db()->query(
        "UPDATE licenses SET status = 'expired' 
         WHERE expiry_date < CURDATE() AND status != 'expired'"
    );

    // Total shops
    $totalShops = db()->fetchOne("SELECT COUNT(*) as count FROM shops")['count'];

    // Total licenses
    $totalLicenses = db()->fetchOne("SELECT COUNT(*) as count FROM licenses")['count'];

    // Active licenses
    $activeLicenses = db()->fetchOne(
        "SELECT COUNT(*) as count FROM licenses WHERE status = 'active' AND expiry_date >= CURDATE()"
    )['count'];

    // Expired licenses
    $expiredLicenses = db()->fetchOne(
        "SELECT COUNT(*) as count FROM licenses WHERE status = 'expired' OR expiry_date < CURDATE()"
    )['count'];

    // Expiring soon (within 30 days)
    $settings = db()->fetchOne("SELECT days_before_expiry FROM notification_settings WHERE id = 1");
    $days = $settings['days_before_expiry'] ?? 30;

    $expiringSoon = db()->fetchOne(
        "SELECT COUNT(*) as count FROM licenses 
         WHERE status = 'active' 
         AND expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)",
        [$days]
    )['count'];

    // Total users
    $totalUsers = db()->fetchOne("SELECT COUNT(*) as count FROM users")['count'];

    // Get expiring/expired licenses list
    // Include expired (negative days) and expiring soon (within $days)
    // Sorted by days_until_expiry ASC (most urgent first)
    $expiring = db()->fetchAll(
        "SELECT l.*, s.shop_name, s.shop_code, lt.type_name,
                DATEDIFF(l.expiry_date, CURDATE()) as days_until_expiry,
                CASE 
                    WHEN DATEDIFF(l.expiry_date, CURDATE()) < 0 THEN 'expired'
                    WHEN DATEDIFF(l.expiry_date, CURDATE()) <= 7 THEN 'critical'
                    WHEN DATEDIFF(l.expiry_date, CURDATE()) <= 14 THEN 'warning'
                    ELSE 'info'
                END as urgency_level
         FROM licenses l 
         JOIN shops s ON l.shop_id = s.id
         JOIN license_types lt ON l.license_type_id = lt.id
         WHERE (l.status = 'active' AND l.expiry_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY))
            OR (l.status = 'expired' OR l.expiry_date < CURDATE())
         ORDER BY l.expiry_date ASC",
        [$days]
    );

    response(true, 'Success', [
        'stats' => [
            'total_shops' => (int) $totalShops,
            'total_licenses' => (int) $totalLicenses,
            'active_licenses' => (int) $activeLicenses,
            'expired_licenses' => (int) $expiredLicenses,
            'expiring_soon' => (int) $expiringSoon,
            'total_users' => (int) $totalUsers,
            'expiry_warning_days' => (int) $days
        ],
        'expiring' => $expiring
    ]);
}

function getExpiringLicensesPaginated()
{
    $settings = db()->fetchOne("SELECT days_before_expiry FROM notification_settings WHERE id = 1");
    $days = $settings['days_before_expiry'] ?? 30;

    // Pagination parameters
    $page = max(1, (int) ($_GET['page'] ?? 1));
    $limit = min(100, max(1, (int) ($_GET['limit'] ?? 10)));
    $offset = ($page - 1) * $limit;

    // Search and filter parameters
    $search = $_GET['search'] ?? '';
    $typeFilter = $_GET['type'] ?? '';

    // Base conditions: only active licenses that are NOT expired yet, but expiring soon
    $conditions = "l.status = 'active' AND l.expiry_date >= CURDATE() AND l.expiry_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY)";
    $params = [$days];

    // Add search filter
    if (!empty($search)) {
        $conditions .= " AND (s.shop_name LIKE ? OR s.shop_code LIKE ?)";
        $searchTerm = "%" . $search . "%";
        $params[] = $searchTerm;
        $params[] = $searchTerm;
    }

    // Add type filter
    if (!empty($typeFilter)) {
        $conditions .= " AND lt.type_name = ?";
        $params[] = $typeFilter;
    }

    // Get total count
    $countSql = "SELECT COUNT(*) as total FROM licenses l 
                 JOIN shops s ON l.shop_id = s.id
                 JOIN license_types lt ON l.license_type_id = lt.id
                 WHERE $conditions";
    $totalResult = db()->fetchOne($countSql, $params);
    $total = (int) $totalResult['total'];

    // Get paginated data - sorted by expiry date ASC (closest to expiry first)
    $params[] = $limit;
    $params[] = $offset;

    $licenses = db()->fetchAll(
        "SELECT l.*, s.shop_name, s.shop_code, lt.type_name,
                DATEDIFF(l.expiry_date, CURDATE()) as days_until_expiry,
                CASE 
                    WHEN DATEDIFF(l.expiry_date, CURDATE()) <= 7 THEN 'critical'
                    WHEN DATEDIFF(l.expiry_date, CURDATE()) <= 14 THEN 'warning'
                    ELSE 'info'
                END as urgency_level
         FROM licenses l 
         JOIN shops s ON l.shop_id = s.id
         JOIN license_types lt ON l.license_type_id = lt.id
         WHERE $conditions
         ORDER BY l.expiry_date ASC
         LIMIT ? OFFSET ?",
        $params
    );

    response(true, 'Success', [
        'licenses' => $licenses,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
            'total_pages' => ceil($total / $limit)
        ]
    ]);
}

function getExpiringLicenses()
{
    $settings = db()->fetchOne("SELECT days_before_expiry FROM notification_settings WHERE id = 1");
    $days = $settings['days_before_expiry'] ?? 30;

    $licenses = db()->fetchAll(
        "SELECT l.*, s.shop_name, s.shop_code, lt.type_name,
                DATEDIFF(l.expiry_date, CURDATE()) as days_until_expiry
         FROM licenses l 
         JOIN shops s ON l.shop_id = s.id
         JOIN license_types lt ON l.license_type_id = lt.id
         WHERE l.status = 'active' 
           AND l.expiry_date >= CURDATE()
           AND l.expiry_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
         ORDER BY l.expiry_date ASC",
        [$days]
    );

    response(true, 'Success', ['licenses' => $licenses]);
}

function getChartData()
{
    // Licenses by type
    $byType = db()->fetchAll(
        "SELECT lt.type_name, COUNT(l.id) as count
         FROM license_types lt
         LEFT JOIN licenses l ON lt.id = l.license_type_id
         GROUP BY lt.id, lt.type_name"
    );

    // Licenses by status
    $byStatus = db()->fetchAll(
        "SELECT status, COUNT(*) as count
         FROM licenses
         GROUP BY status"
    );

    // Licenses by month (current year)
    $byMonth = db()->fetchAll(
        "SELECT MONTH(issue_date) as month, COUNT(*) as count
         FROM licenses
         WHERE YEAR(issue_date) = YEAR(CURDATE())
         GROUP BY MONTH(issue_date)
         ORDER BY month"
    );

    // Shops created per month (current year)
    $shopsByMonth = db()->fetchAll(
        "SELECT MONTH(created_at) as month, COUNT(*) as count
         FROM shops
         WHERE YEAR(created_at) = YEAR(CURDATE())
         GROUP BY MONTH(created_at)
         ORDER BY month"
    );

    response(true, 'Success', [
        'chart_data' => [
            'by_type' => $byType,
            'by_status' => $byStatus,
            'by_month' => $byMonth,
            'shops_by_month' => $shopsByMonth
        ]
    ]);
}

function getLicenseBreakdown()
{
    // Get license counts by type with status breakdown
    $breakdown = db()->fetchAll(
        "SELECT 
            lt.id,
            lt.type_name,
            COUNT(l.id) as total_count,
            SUM(CASE WHEN l.status = 'active' AND l.expiry_date >= CURDATE() THEN 1 ELSE 0 END) as active_count,
            SUM(CASE WHEN l.status = 'expired' OR l.expiry_date < CURDATE() THEN 1 ELSE 0 END) as expired_count,
            SUM(CASE WHEN l.status = 'active' AND l.expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as expiring_count
         FROM license_types lt
         LEFT JOIN licenses l ON lt.id = l.license_type_id
         GROUP BY lt.id, lt.type_name
         ORDER BY total_count DESC"
    );

    response(true, 'Success', ['breakdown' => $breakdown]);
}

function getTopShops()
{
    // Get shops with most licenses
    $topShops = db()->fetchAll(
        "SELECT 
            s.id,
            s.shop_code,
            s.shop_name,
            COUNT(l.id) as total_licenses,
            SUM(CASE WHEN l.status = 'active' AND l.expiry_date >= CURDATE() THEN 1 ELSE 0 END) as active_licenses,
            GROUP_CONCAT(DISTINCT lt.type_name ORDER BY lt.type_name SEPARATOR ', ') as license_types
         FROM shops s
         LEFT JOIN licenses l ON s.id = l.shop_id
         LEFT JOIN license_types lt ON l.license_type_id = lt.id
         GROUP BY s.id, s.shop_code, s.shop_name
         HAVING total_licenses > 0
         ORDER BY total_licenses DESC, active_licenses DESC
         LIMIT 10"
    );

    response(true, 'Success', ['top_shops' => $topShops]);
}

function response($success, $message, $data = [], $code = 200)
{
    http_response_code($code);
    echo json_encode(array_merge([
        'success' => $success,
        'message' => $message
    ], $data));
    exit;
}
