<?php
/**
 * License Types API
 * CRUD operations for license type management
 */

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/ApiResponse.php';
require_once __DIR__ . '/../includes/AuthMiddleware.php';
require_once __DIR__ . '/../includes/RequestHelper.php';
require_once __DIR__ . '/../includes/SecurityHeaders.php';
require_once __DIR__ . '/../includes/CsrfProtection.php';

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
        getLicenseTypes();
        break;
    case 'POST':
        createLicenseType();
        break;
    case 'PUT':
        updateLicenseType();
        break;
    case 'DELETE':
        deleteLicenseType();
        break;
    default:
        ApiResponse::methodNotAllowed();
}

function getLicenseTypes()
{
    $id = $_GET['id'] ?? null;

    if ($id) {
        $type = db()->fetchOne(
            "SELECT * FROM license_types WHERE id = ?",
            [$id]
        );
        ApiResponse::success('Success', ['type' => $type]);
    } else {
        $types = db()->fetchAll(
            "SELECT lt.*, 
                    (SELECT COUNT(*) FROM licenses l WHERE l.license_type_id = lt.id) as license_count
             FROM license_types lt 
             ORDER BY lt.id ASC"
        );
        ApiResponse::success('Success', ['types' => $types]);
    }
}

function createLicenseType()
{
    AuthMiddleware::requireAdmin(); // Only admin can create license types

    $data = RequestHelper::getJsonInput();

    if (empty($data['type_name'])) {
        ApiResponse::error('กรุณากรอกชื่อประเภทใบอนุญาต');
    }

    $id = db()->insert('license_types', [
        'type_name' => $data['type_name'],
        'description' => $data['description'] ?? null,
        'validity_days' => $data['validity_days'] ?? 365
    ]);

    ApiResponse::success('เพิ่มประเภทใบอนุญาตสำเร็จ', ['id' => $id]);
}

function updateLicenseType()
{
    AuthMiddleware::requireAdmin(); // Only admin can update license types

    $data = RequestHelper::getJsonInput();

    if (empty($data['id'])) {
        ApiResponse::error('Missing license type ID');
    }

    db()->update('license_types', [
        'type_name' => $data['type_name'],
        'description' => $data['description'] ?? null,
        'validity_days' => $data['validity_days'] ?? 365
    ], 'id = :id', ['id' => $data['id']]);

    ApiResponse::success('แก้ไขประเภทใบอนุญาตสำเร็จ');
}

function deleteLicenseType()
{
    AuthMiddleware::requireAdmin(); // Only admin can delete license types

    $id = $_GET['id'] ?? null;

    if (!$id) {
        ApiResponse::error('Missing license type ID');
    }

    // Check if type is in use
    $inUse = db()->fetchOne(
        "SELECT COUNT(*) as count FROM licenses WHERE license_type_id = ?",
        [$id]
    );

    if ($inUse['count'] > 0) {
        ApiResponse::error('ไม่สามารถลบได้ เนื่องจากมีใบอนุญาตใช้ประเภทนี้อยู่');
    }

    db()->delete('license_types', 'id = ?', [$id]);

    ApiResponse::success('ลบประเภทใบอนุญาตสำเร็จ');
}
