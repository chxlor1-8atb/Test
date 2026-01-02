/**
 * Users Management Page Script (Admin Only) - SPA Module
 */

// Register as SPA module
window.PageModules = window.PageModules || {};
window.PageModules['users'] = {
    init: renderUsers
};

async function renderUsers() {
    if (currentUser && currentUser.role !== 'admin') {
        document.getElementById('contentBody').innerHTML = '<div class="error-message">ไม่มีสิทธิ์เข้าถึง</div>';
        return;
    }

    const content = document.getElementById('contentBody');
    content.innerHTML = `
        <div class="card"><div class="card-header"><h3 class="card-title"><i class="fas fa-users"></i> รายการผู้ใช้งาน</h3>
            <button class="btn btn-primary btn-sm" onclick="showUserModal()"><i class="fas fa-plus"></i> เพิ่มผู้ใช้</button></div>
            <div class="card-body"><div class="table-container"><table class="data-table"><thead><tr><th>ชื่อผู้ใช้</th><th>ชื่อ-นามสกุล</th><th>บทบาท</th><th>วันที่สร้าง</th><th class="text-center" style="width: 150px;">จัดการ</th></tr></thead>
                <tbody id="usersTable"></tbody></table></div></div></div>`;
    await loadUsers();
}

async function loadUsers() {
    const res = await fetch('api/users.php');
    const data = await res.json();
    const users = data.users || [];

    document.getElementById('usersTable').innerHTML = users.map(u => `<tr>
        <td>${u.username}</td><td>${u.full_name}</td>
        <td><span class="badge ${u.role === 'admin' ? 'badge-admin' : 'badge-staff'}">${u.role === 'admin' ? 'ผู้ดูแล' : 'เจ้าหน้าที่'}</span></td>
        <td>${formatDate(u.created_at)}</td>
        <td class="text-center">
            <div class="action-buttons">
                <button class="btn btn-secondary btn-icon" onclick="showUserModal(${u.id})"><i class="fas fa-edit"></i></button>
                ${u.id !== currentUser.id ? `<button class="btn btn-danger btn-icon" onclick="deleteUser(${u.id})"><i class="fas fa-trash"></i></button>` : ''}
            </div>
        </td></tr>`).join('');
}

// Make functions global for onclick handlers
window.showUserModal = async function (id = null) {
    const isEdit = id !== null;
    let user = {};
    if (isEdit) {
        const res = await fetch(`api/users.php?id=${id}`);
        const data = await res.json();
        user = data.user;
    }

    setModalContent(
        isEdit ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้ใหม่',
        `<form id="userForm">
            <input type="hidden" name="id" value="${user.id || ''}">
            <div class="form-group"><label>ชื่อผู้ใช้ *</label><input type="text" name="username" value="${user.username || ''}" required ${isEdit ? 'readonly' : ''}></div>
            <div class="form-group"><label>ชื่อ-นามสกุล *</label><input type="text" name="full_name" value="${user.full_name || ''}" required></div>
            <div class="form-group"><label>รหัสผ่าน ${isEdit ? '(เว้นว่างถ้าไม่ต้องการเปลี่ยน)' : '*'}</label><input type="password" name="password" ${isEdit ? '' : 'required'}></div>
            <div class="form-group"><label>บทบาท *</label><select name="role" required>
                <option value="staff" ${user.role === 'staff' ? 'selected' : ''}>เจ้าหน้าที่</option>
                <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>ผู้ดูแลระบบ</option>
            </select></div>
        </form>`,
        `<button class="btn btn-secondary" onclick="closeModal()">ยกเลิก</button>
        <button class="btn btn-primary" onclick="saveUser()">บันทึก</button>`
    );
    openModal();

    // Apply custom select styling to modal dropdowns
    if (typeof initCustomSelects === 'function') {
        initCustomSelects('.modal-body select');
    }
}

window.saveUser = async function () {
    const form = document.getElementById('userForm');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    const method = data.id ? 'PUT' : 'POST';
    const res = await fetch('api/users.php', {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
    });
    const result = await res.json();

    if (result.success) {
        showToast(result.message, 'success');
        closeModal();
        loadUsers();
    } else {
        showToast(result.message, 'error');
    }
}

window.deleteUser = async function (id) {
    const confirmed = await showDeleteConfirm('ผู้ใช้นี้');
    if (!confirmed) return;

    const res = await fetch(`api/users.php?id=${id}`, { method: 'DELETE' });
    const data = await res.json();
    showToast(data.message, data.success ? 'success' : 'error');
    if (data.success) loadUsers();
}

