/**
 * License Types Management Page Script (Admin Only) - SPA Module
 */

let licenseTypesData = [];

// Register as SPA module
window.PageModules = window.PageModules || {};
window.PageModules['license-types'] = {
    init: renderLicenseTypes
};

async function renderLicenseTypes() {
    if (currentUser && currentUser.role !== 'admin') {
        document.getElementById('contentBody').innerHTML = '<div class="error-message">ไม่มีสิทธิ์เข้าถึง</div>';
        return;
    }

    const content = document.getElementById('contentBody');
    content.innerHTML = `
        <div class="card"><div class="card-header"><h3 class="card-title"><i class="fas fa-tags"></i> ประเภทใบอนุญาต</h3>
            <button class="btn btn-primary btn-sm" onclick="showTypeModal()"><i class="fas fa-plus"></i> เพิ่มประเภท</button></div>
            <div class="card-body"><div class="table-container"><table class="data-table"><thead><tr><th>ชื่อประเภท</th><th>คำอธิบาย</th><th>อายุ (วัน)</th><th>ใบอนุญาต</th><th class="text-center" style="width: 150px;">จัดการ</th></tr></thead>
                <tbody id="typesTable"></tbody></table></div></div></div>`;
    await loadTypes();
}

async function loadTypes() {
    const res = await fetch('/api/license-types');
    const data = await res.json();
    licenseTypesData = data.types || [];

    document.getElementById('typesTable').innerHTML = licenseTypesData.map(t => `<tr>
        <td><strong>${t.type_name}</strong></td><td>${t.description || '-'}</td>
        <td>${t.validity_days} วัน</td>
        <td><span class="badge badge-active">${t.license_count}</span></td>
        <td class="text-center">
            <div class="action-buttons">
                <button class="btn btn-secondary btn-icon" onclick="showTypeModal(${t.id})"><i class="fas fa-edit"></i></button>
                ${t.license_count == 0 ? `<button class="btn btn-danger btn-icon" onclick="deleteType(${t.id})"><i class="fas fa-trash"></i></button>` : ''}
            </div>
        </td></tr>`).join('');
}

// Make functions global for onclick handlers
window.showTypeModal = async function (id = null) {
    const isEdit = id !== null;
    let type = {};
    if (isEdit) {
        const res = await fetch(`/api/license-types?id=${id}`);
        const data = await res.json();
        type = data.type;
    }

    setModalContent(
        isEdit ? 'แก้ไขประเภท' : 'เพิ่มประเภทใหม่',
        `<form id="typeForm">
            <input type="hidden" name="id" value="${type.id || ''}">
            <div class="form-group"><label>ชื่อประเภท *</label><input type="text" name="type_name" value="${type.type_name || ''}" required></div>
            <div class="form-group"><label>คำอธิบาย</label><textarea name="description" rows="2">${type.description || ''}</textarea></div>
            <div class="form-group"><label>อายุใบอนุญาต (วัน)</label><input type="number" name="validity_days" value="${type.validity_days || 365}" min="1" required></div>
        </form>`,
        `<button class="btn btn-secondary" onclick="closeModal()">ยกเลิก</button>
        <button class="btn btn-primary" onclick="saveType()">บันทึก</button>`
    );
    openModal();
}

window.saveType = async function () {
    const form = document.getElementById('typeForm');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    const method = data.id ? 'PUT' : 'POST';
    const res = await fetch('/api/license-types', {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
    });
    const result = await res.json();

    if (result.success) {
        showToast(result.message, 'success');
        closeModal();
        loadTypes();
    } else {
        showToast(result.message, 'error');
    }
}

window.deleteType = async function (id) {
    const confirmed = await showDeleteConfirm('ประเภทใบอนุญาตนี้');
    if (!confirmed) return;

    const res = await fetch(`/api/license-types?id=${id}`, { method: 'DELETE' });
    const data = await res.json();
    showToast(data.message, data.success ? 'success' : 'error');
    if (data.success) loadTypes();
}

