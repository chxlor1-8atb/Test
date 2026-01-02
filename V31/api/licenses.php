<?php
/**
 * Licenses API
 * CRUD operations for license management
 */

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/ApiResponse.php';
require_once __DIR__ . '/../includes/AuthMiddleware.php';
require_once __DIR__ . '/../includes/RequestHelper.php';
require_once __DIR__ . '/../includes/SecurityHeaders.php';
require_once __DIR__ . '/../includes/CsrfProtection.php';
require_once __DIR__ . '/../includes/InputValidator.php';

// Apply security headers
SecurityHeaders::apply();
RequestHelper::setJsonHeader();
AuthMiddleware::requireAuth();

// Validate CSRF for state-changing operations
if (in_array($_SERVER['REQUEST_METHOD'], ['POST', 'PUT', 'DELETE'])) {
    CsrfProtection::validateRequest();
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        getLicenses();
        break;
    case 'POST':
        createLicense();
        break;
    case 'PUT':
        updateLicense();
        break;
    case 'DELETE':
        deleteLicense();
        break;
    default:
        ApiResponse::methodNotAllowed();
}

function getLicenses()
{
    $id = $_GET['id'] ?? null;

    if ($id) {
        $license = db()->fetchOne(
            "SELECT l.*, s.shop_name, lt.type_name,
                    u.full_name as created_by_name
             FROM licenses l 
             JOIN shops s ON l.shop_id = s.id
             JOIN license_types lt ON l.license_type_id = lt.id
             LEFT JOIN users u ON l.created_by = u.id 
             WHERE l.id = ?",
            [$id]
        );
        ApiResponse::success('Success', ['license' => $license]);
    } else {
        // Build query with filters
        $where = [];
        $params = [];

        if (!empty($_GET['search'])) {
            $search = '%' . $_GET['search'] . '%';
            $where[] = "(s.shop_name LIKE ?)";
            $params = array_merge($params, [$search]);
        }

        if (!empty($_GET['status'])) {
            $where[] = "l.status = ?";
            $params[] = $_GET['status'];
        }

        if (!empty($_GET['license_type'])) {
            $where[] = "l.license_type_id = ?";
            $params[] = $_GET['license_type'];
        }

        if (!empty($_GET['shop_id'])) {
            $where[] = "l.shop_id = ?";
            $params[] = $_GET['shop_id'];
        }

        if (!empty($_GET['expiry_from'])) {
            $where[] = "l.expiry_date >= ?";
            $params[] = $_GET['expiry_from'];
        }

        if (!empty($_GET['expiry_to'])) {
            $where[] = "l.expiry_date <= ?";
            $params[] = $_GET['expiry_to'];
        }

        $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';

        // Pagination support
        $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
        $limit = isset($_GET['limit']) ? min(100, max(10, intval($_GET['limit']))) : 20;
        $offset = ($page - 1) * $limit;

        // Get total count
        $countSql = "SELECT COUNT(*) as total
                     FROM licenses l 
                     JOIN shops s ON l.shop_id = s.id
                     JOIN license_types lt ON l.license_type_id = lt.id
                     {$whereClause}";
        $countResult = db()->fetchOne($countSql, $params);
        $total = $countResult['total'] ?? 0;
        $totalPages = ceil($total / $limit);

        $sql = "SELECT l.*, s.shop_name, lt.type_name,
                       u.full_name as created_by_name,
                       DATEDIFF(l.expiry_date, CURDATE()) as days_until_expiry
                FROM licenses l 
                JOIN shops s ON l.shop_id = s.id
                JOIN license_types lt ON l.license_type_id = lt.id
                LEFT JOIN users u ON l.created_by = u.id 
                {$whereClause}
                ORDER BY l.expiry_date ASC
                LIMIT {$limit} OFFSET {$offset}";

        $licenses = db()->fetchAll($sql, $params);

        // Auto-update expired licenses status
        db()->query(
            "UPDATE licenses SET status = 'expired' 
             WHERE expiry_date < CURDATE() AND status = 'active'"
        );

        ApiResponse::success('Success', [
            'licenses' => $licenses,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'totalPages' => $totalPages
            ]
        ]);
    }
}

function createLicense()
{
    $data = RequestHelper::getJsonInput();

    // Validate required fields
    $required = ['shop_id', 'license_type_id', 'issue_date', 'expiry_date'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            ApiResponse::error('กรุณากรอกข้อมูลให้ครบถ้วน');
        }
    }

    $id = db()->insert('licenses', [
        'shop_id' => $data['shop_id'],
        'license_type_id' => $data['license_type_id'],
        'issue_date' => $data['issue_date'],
        'expiry_date' => $data['expiry_date'],
        'status' => $data['status'] ?? 'active',
        'notes' => $data['notes'] ?? null,
        'created_by' => $_SESSION['user_id']
    ]);

    ApiResponse::success('เพิ่มใบอนุญาตสำเร็จ', ['id' => $id]);
}

function updateLicense()
{
    $data = RequestHelper::getJsonInput();

    if (empty($data['id'])) {
        ApiResponse::error('Missing license ID');
    }

    $updateData = [
        'shop_id' => $data['shop_id'],
        'license_type_id' => $data['license_type_id'],
        'issue_date' => $data['issue_date'],
        'expiry_date' => $data['expiry_date'],
        'status' => $data['status'],
        'notes' => $data['notes'] ?? null
    ];

    db()->update('licenses', $updateData, 'id = :id', ['id' => $data['id']]);

    ApiResponse::success('แก้ไขข้อมูลใบอนุญาตสำเร็จ');
}

function deleteLicense()
{
    $id = $_GET['id'] ?? null;

    if (!$id) {
        ApiResponse::error('Missing license ID');
    }

    db()->delete('licenses', 'id = ?', [$id]);

    ApiResponse::success('ลบใบอนุญาตสำเร็จ');
}
