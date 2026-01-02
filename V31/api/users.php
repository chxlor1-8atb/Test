<?php
/**
 * Users API
 * CRUD operations for user management
 */

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/ApiResponse.php';
require_once __DIR__ . '/../includes/AuthMiddleware.php';
require_once __DIR__ . '/../includes/RequestHelper.php';
require_once __DIR__ . '/../includes/SecurityHeaders.php';
require_once __DIR__ . '/../includes/CsrfProtection.php';
require_once __DIR__ . '/../includes/InputValidator.php';

// Apply strict security headers (sensitive endpoint)
SecurityHeaders::applyStrict();
RequestHelper::setJsonHeader();
AuthMiddleware::requireAdmin(); // Only admin can manage users

// Validate CSRF for state-changing operations
if (in_array($_SERVER['REQUEST_METHOD'], ['POST', 'PUT', 'DELETE'])) {
    CsrfProtection::validateRequest();
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        getUsers();
        break;
    case 'POST':
        createUser();
        break;
    case 'PUT':
        updateUser();
        break;
    case 'DELETE':
        deleteUser();
        break;
    default:
        ApiResponse::methodNotAllowed();
}

function getUsers()
{
    $id = $_GET['id'] ?? null;

    if ($id) {
        $user = db()->fetchOne(
            "SELECT id, username, full_name, role, created_at FROM users WHERE id = ?",
            [$id]
        );
        ApiResponse::success('Success', ['user' => $user]);
    } else {
        $users = db()->fetchAll(
            "SELECT id, username, full_name, role, created_at FROM users ORDER BY id DESC"
        );
        ApiResponse::success('Success', ['users' => $users]);
    }
}

function createUser()
{
    $data = RequestHelper::getJsonInput();

    // Validate required fields
    if (empty($data['username']) || empty($data['password']) || empty($data['full_name'])) {
        ApiResponse::error('กรุณากรอกข้อมูลให้ครบถ้วน');
    }

    // Check if username exists
    $exists = db()->fetchOne(
        "SELECT id FROM users WHERE username = ?",
        [$data['username']]
    );

    if ($exists) {
        ApiResponse::error('ชื่อผู้ใช้นี้มีอยู่แล้ว');
    }

    $id = db()->insert('users', [
        'username' => $data['username'],
        'password' => password_hash($data['password'], PASSWORD_DEFAULT),
        'full_name' => $data['full_name'],
        'role' => $data['role'] ?? 'staff'
    ]);

    ApiResponse::success('เพิ่มผู้ใช้สำเร็จ', ['id' => $id]);
}

function updateUser()
{
    $data = RequestHelper::getJsonInput();

    if (empty($data['id'])) {
        ApiResponse::error('Missing user ID');
    }

    $updateData = [
        'full_name' => $data['full_name'],
        'role' => $data['role']
    ];

    // Update password if provided
    if (!empty($data['password'])) {
        $updateData['password'] = password_hash($data['password'], PASSWORD_DEFAULT);
    }

    db()->update('users', $updateData, 'id = :id', ['id' => $data['id']]);

    ApiResponse::success('แก้ไขข้อมูลผู้ใช้สำเร็จ');
}

function deleteUser()
{
    $id = $_GET['id'] ?? null;

    if (!$id) {
        ApiResponse::error('Missing user ID');
    }

    // Prevent self-deletion
    if ($id == $_SESSION['user_id']) {
        ApiResponse::error('ไม่สามารถลบบัญชีตัวเองได้');
    }

    db()->delete('users', 'id = ?', [$id]);

    ApiResponse::success('ลบผู้ใช้สำเร็จ');
}
