<?php
/**
 * Shops API
 * CRUD operations for shop management
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
        getShops();
        break;
    case 'POST':
        createShop();
        break;
    case 'PUT':
        updateShop();
        break;
    case 'DELETE':
        deleteShop();
        break;
    default:
        ApiResponse::methodNotAllowed();
}

function getShops()
{
    $id = $_GET['id'] ?? null;

    if ($id) {
        $shop = db()->fetchOne(
            "SELECT s.*, u.full_name as created_by_name 
             FROM shops s 
             LEFT JOIN users u ON s.created_by = u.id 
             WHERE s.id = ?",
            [$id]
        );
        ApiResponse::success('Success', ['shop' => $shop]);
    } else {
        // Build query with filters
        $where = [];
        $params = [];

        if (!empty($_GET['search'])) {
            $search = '%' . $_GET['search'] . '%';
            $where[] = "(s.shop_name LIKE ? OR s.owner_name LIKE ?)";
            $params = array_merge($params, [$search, $search]);
        }

        $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';

        // Pagination support
        $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
        $limit = isset($_GET['limit']) ? min(100, max(10, intval($_GET['limit']))) : 20;
        $offset = ($page - 1) * $limit;

        // Get total count
        $countSql = "SELECT COUNT(*) as total FROM shops s {$whereClause}";
        $countResult = db()->fetchOne($countSql, $params);
        $total = $countResult['total'] ?? 0;
        $totalPages = ceil($total / $limit);

        $sql = "SELECT s.*, u.full_name as created_by_name,
                (SELECT COUNT(*) FROM licenses l WHERE l.shop_id = s.id) as license_count
                FROM shops s 
                LEFT JOIN users u ON s.created_by = u.id 
                {$whereClause}
                ORDER BY s.id DESC
                LIMIT {$limit} OFFSET {$offset}";

        $shops = db()->fetchAll($sql, $params);
        ApiResponse::success('Success', [
            'shops' => $shops,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'totalPages' => $totalPages
            ]
        ]);
    }
}

function createShop()
{
    $data = RequestHelper::getJsonInput();

    // Validate required fields
    if (empty($data['shop_name'])) {
        ApiResponse::error('กรุณากรอกชื่อร้านค้า');
    }

    $id = db()->insert('shops', [
        'shop_name' => $data['shop_name'],
        'owner_name' => $data['owner_name'] ?? null,
        'address' => $data['address'] ?? null,
        'phone' => $data['phone'] ?? null,
        'email' => $data['email'] ?? null,
        'notes' => $data['notes'] ?? null,
        'created_by' => $_SESSION['user_id']
    ]);

    ApiResponse::success('เพิ่มร้านค้าสำเร็จ', ['id' => $id]);
}

function updateShop()
{
    $data = RequestHelper::getJsonInput();

    if (empty($data['id'])) {
        ApiResponse::error('Missing shop ID');
    }

    $updateData = [
        'shop_name' => $data['shop_name'],
        'owner_name' => $data['owner_name'] ?? null,
        'address' => $data['address'] ?? null,
        'phone' => $data['phone'] ?? null,
        'email' => $data['email'] ?? null,
        'notes' => $data['notes'] ?? null
    ];

    db()->update('shops', $updateData, 'id = :id', ['id' => $data['id']]);

    ApiResponse::success('แก้ไขข้อมูลร้านค้าสำเร็จ');
}

function deleteShop()
{
    $id = $_GET['id'] ?? null;

    if (!$id) {
        ApiResponse::error('Missing shop ID');
    }

    db()->delete('shops', 'id = ?', [$id]);

    ApiResponse::success('ลบร้านค้าสำเร็จ');
}
