<?php
/**
 * Export API
 * CSV and basic data export functionality
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

$type = $_GET['type'] ?? 'licenses';
$format = $_GET['format'] ?? 'json';

switch ($type) {
    case 'licenses':
        exportLicenses($format);
        break;
    case 'shops':
        exportShops($format);
        break;
    case 'users':
        exportUsers($format);
        break;
    default:
        ApiResponse::error('Invalid export type');
}

function exportLicenses($format)
{
    $where = [];
    $params = [];

    if (!empty($_GET['status'])) {
        $where[] = "l.status = ?";
        $params[] = $_GET['status'];
    }

    if (!empty($_GET['license_type'])) {
        $where[] = "l.license_type_id = ?";
        $params[] = $_GET['license_type'];
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

    $data = db()->fetchAll(
        "SELECT l.id, l.license_number, s.shop_code, s.shop_name, s.owner_name,
                lt.type_name as license_type, l.issue_date, l.expiry_date, l.status,
                l.notes, l.created_at
         FROM licenses l 
         JOIN shops s ON l.shop_id = s.id
         JOIN license_types lt ON l.license_type_id = lt.id
         {$whereClause}
         ORDER BY l.id DESC",
        $params
    );

    if ($format === 'csv') {
        outputCSV($data, 'licenses', [
            'id' => 'ID',
            'license_number' => 'เลขที่ใบอนุญาต',
            'shop_code' => 'รหัสร้าน',
            'shop_name' => 'ชื่อร้าน',
            'owner_name' => 'เจ้าของ',
            'license_type' => 'ประเภท',
            'issue_date' => 'วันที่ออก',
            'expiry_date' => 'วันหมดอายุ',
            'status' => 'สถานะ',
            'notes' => 'หมายเหตุ',
            'created_at' => 'วันที่สร้าง'
        ]);
    } else {
        response(true, 'Success', ['data' => $data]);
    }
}

function exportShops($format)
{
    $data = db()->fetchAll(
        "SELECT s.id, s.shop_code, s.shop_name, s.owner_name, s.address,
                s.phone, s.email, s.notes, s.created_at,
                (SELECT COUNT(*) FROM licenses l WHERE l.shop_id = s.id) as license_count
         FROM shops s
         ORDER BY s.id DESC"
    );

    if ($format === 'csv') {
        outputCSV($data, 'shops', [
            'id' => 'ID',
            'shop_code' => 'รหัสร้าน',
            'shop_name' => 'ชื่อร้าน',
            'owner_name' => 'เจ้าของ',
            'address' => 'ที่อยู่',
            'phone' => 'โทรศัพท์',
            'email' => 'อีเมล',
            'license_count' => 'จำนวนใบอนุญาต',
            'notes' => 'หมายเหตุ',
            'created_at' => 'วันที่สร้าง'
        ]);
    } else {
        response(true, 'Success', ['data' => $data]);
    }
}

function exportUsers($format)
{
    // Only admin can export users
    if ($_SESSION['role'] !== 'admin') {
        response(false, 'Access denied', [], 403);
        return;
    }

    $data = db()->fetchAll(
        "SELECT id, username, full_name, role, created_at FROM users ORDER BY id DESC"
    );

    if ($format === 'csv') {
        outputCSV($data, 'users', [
            'id' => 'ID',
            'username' => 'ชื่อผู้ใช้',
            'full_name' => 'ชื่อเต็ม',
            'role' => 'ระดับ',
            'created_at' => 'วันที่สร้าง'
        ]);
    } else {
        response(true, 'Success', ['data' => $data]);
    }
}

function outputCSV($data, $filename, $headers)
{
    // Set headers for CSV download
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '_' . date('Y-m-d') . '.csv"');

    // Add BOM for Excel to recognize UTF-8
    echo "\xEF\xBB\xBF";

    $output = fopen('php://output', 'w');

    // Write header row
    fputcsv($output, array_values($headers));

    // Write data rows
    foreach ($data as $row) {
        $csvRow = [];
        foreach ($headers as $key => $label) {
            $csvRow[] = $row[$key] ?? '';
        }
        fputcsv($output, $csvRow);
    }

    fclose($output);
    exit;
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
