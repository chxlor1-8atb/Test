/**
 * Licenses Management Page Script - SPA Module
 */

let licensesData = [];
let licensesTypesList = [];
let licensesShopsList = [];
let licensesPagination = { page: 1, limit: 20, total: 0, totalPages: 0 };

// Register as SPA module
window.PageModules = window.PageModules || {};
window.PageModules['licenses'] = {
    init: renderLicenses
};

async function renderLicenses() {
    await loadLicenseTypes();
    await loadShopsList();

    const content = document.getElementById('contentBody');
    content.innerHTML = `
        <div class="card"><div class="card-header"><h3 class="card-title"><i class="fas fa-file-alt"></i> รายการใบอนุญาต</h3>
            <button class="btn btn-primary btn-sm" onclick="showLicenseModal()"><i class="fas fa-plus"></i> เพิ่มใบอนุญาต</button></div>
            <div class="card-body">
                <div class="filter-row" style="display:flex;gap:0.75rem;flex-wrap:wrap;margin-bottom:1rem;align-items:center">
                    <input type="text" id="licenseSearch" placeholder="ค้นหา...">
                    <select id="filterType"><option value="">ทุกประเภท</option>${licensesTypesList.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}</select>
                    <select id="filterStatus"><option value="">ทุกสถานะ</option><option value="active">ปกติ</option><option value="pending">กำลังดำเนินการ</option><option value="expired">หมดอายุ</option><option value="suspended">ถูกพักใช้</option><option value="revoked">ถูกเพิกถอน</option></select>
                </div>
                <div class="table-container"><table class="data-table"><thead><tr><th>ร้านค้า</th><th>ประเภท</th><th class="text-center">วันออก</th><th class="text-center">หมดอายุ</th><th class="text-center">สถานะ</th><th class="text-center" style="width: 150px;">จัดการ</th></tr></thead>
                <tbody id="licensesTable"></tbody></table></div>
                <div id="licensesPagination"></div>
            </div></div>`;
    await loadLicenses();

    // Initialize custom select dropdowns for better styling
    if (typeof initCustomSelects === 'function') {
        initCustomSelects('.filter-row select');
    }

    const searchInput = document.getElementById('licenseSearch');
    const filterType = document.getElementById('filterType');
    const filterStatus = document.getElementById('filterStatus');

    const debouncedFilter = debounce(() => { licensesPagination.page = 1; loadLicenses(); }, 300);

    searchInput.addEventListener('input', debouncedFilter);
    filterType.addEventListener('change', () => { licensesPagination.page = 1; loadLicenses(); });
    filterStatus.addEventListener('change', () => { licensesPagination.page = 1; loadLicenses(); });
}

async function loadLicenseTypes() {
    const res = await fetch('/api/license-types');
    const data = await res.json();
    licensesTypesList = data.types || [];
}

async function loadShopsList() {
    const res = await fetch('/api/shops');
    const data = await res.json();
    licensesShopsList = data.shops || [];
}

async function loadLicenses() {
    const params = new URLSearchParams();
    const search = document.getElementById('licenseSearch')?.value;
    const type = document.getElementById('filterType')?.value;
    const status = document.getElementById('filterStatus')?.value;

    if (search) params.append('search', search);
    if (type) params.append('license_type', type);
    if (status) params.append('status', status);
    params.append('page', licensesPagination.page);
    params.append('limit', licensesPagination.limit);

    const res = await fetch(`/api/licenses?${params}`);
    const data = await res.json();
    licensesData = data.licenses || [];

    if (data.pagination) {
        licensesPagination = { ...licensesPagination, ...data.pagination };
    }

    const statusBadge = { active: 'badge-active', pending: 'badge-pending', expired: 'badge-expired', suspended: 'badge-suspended', revoked: 'badge-revoked' };
    const statusText = { active: 'ปกติ', pending: 'กำลังดำเนินการ', expired: 'หมดอายุ', suspended: 'ถูกพักใช้', revoked: 'ถูกเพิกถอน' };

    document.getElementById('licensesTable').innerHTML = licensesData.length ? licensesData.map(l => `<tr>
        <td>${l.shop_name}</td><td>${l.type_name}</td>
        <td class="text-center">${formatDate(l.issue_date)}</td><td class="text-center">${formatDate(l.expiry_date)}</td>
        <td class="text-center"><span class="badge ${statusBadge[l.status]}">${statusText[l.status]}</span></td>
        <td class="text-center">
            <div class="action-buttons">
                <button class="btn btn-secondary btn-icon" onclick="showLicenseModal(${l.id})"><i class="fas fa-edit"></i></button>
                <button class="btn btn-danger btn-icon" onclick="deleteLicense(${l.id})"><i class="fas fa-trash"></i></button>
            </div>
        </td></tr>`).join('') : getEmptyHTML('ไม่พบข้อมูล');

    renderPagination(
        'licensesPagination',
        licensesPagination,
        (newPage) => {
            licensesPagination.page = newPage;
            loadLicenses();
        },
        (newLimit) => {
            licensesPagination.limit = parseInt(newLimit);
            licensesPagination.page = 1;
            loadLicenses();
        }
    );
}

// Make functions global for onclick handlers
window.showLicenseModal = async function (id = null) {
    const isEdit = id !== null;
    let license = {};
    if (isEdit) {
        const res = await fetch(`/api/licenses?id=${id}`);
        const data = await res.json();
        license = data.license;
    }

    setModalContent(
        isEdit ? 'แก้ไขใบอนุญาต' : 'เพิ่มใบอนุญาตใหม่',
        `<form id="licenseForm">
            <input type="hidden" name="id" value="${license.id || ''}">
            <div class="form-group"><label>ร้านค้า *</label><select name="shop_id" required>
                <option value="">-- เลือกร้านค้า --</option>
                ${licensesShopsList.map(s => `<option value="${s.id}" ${license.shop_id == s.id ? 'selected' : ''}>${s.shop_code} - ${s.name}</option>`).join('')}
            </select></div>
            <div class="form-group"><label>ประเภทใบอนุญาต *</label><select name="license_type_id" required>
                <option value="">-- เลือกประเภท --</option>
                ${licensesTypesList.map(t => `<option value="${t.id}" ${license.license_type_id == t.id ? 'selected' : ''}>${t.name}</option>`).join('')}
            </select></div>
            <div class="form-group"><label>เลขที่ใบอนุญาต *</label><input type="text" name="license_number" value="${license.license_number || ''}" required></div>
            <div class="form-group"><label>วันที่ออก *</label><input type="date" name="issue_date" value="${license.issue_date || ''}" required></div>
            <div class="form-group"><label>วันหมดอายุ *</label><input type="date" name="expiry_date" value="${license.expiry_date || ''}" required></div>
            <div class="form-group"><label>สถานะ</label><select name="status">
                <option value="active" ${license.status === 'active' ? 'selected' : ''}>ปกติ</option>
                <option value="pending" ${license.status === 'pending' ? 'selected' : ''}>กำลังดำเนินการ</option>
                <option value="expired" ${license.status === 'expired' ? 'selected' : ''}>หมดอายุ</option>
                <option value="suspended" ${license.status === 'suspended' ? 'selected' : ''}>ถูกพักใช้</option>
                <option value="revoked" ${license.status === 'revoked' ? 'selected' : ''}>ถูกเพิกถอน</option>
            </select></div>
            <div class="form-group"><label>หมายเหตุ</label><textarea name="notes" rows="2">${license.notes || ''}</textarea></div>
        </form>`,
        `<button class="btn btn-secondary" onclick="closeModal()">ยกเลิก</button>
        <button class="btn btn-primary" onclick="saveLicense()">บันทึก</button>`
    );
    openModal();

    // Apply custom select styling to modal dropdowns
    if (typeof initCustomSelects === 'function') {
        initCustomSelects('.modal-body select');
    }
}

window.saveLicense = async function () {
    const form = document.getElementById('licenseForm');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    const method = data.id ? 'PUT' : 'POST';
    const res = await fetch('/api/licenses', {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
    });
    const result = await res.json();

    if (result.success) {
        showToast(result.message, 'success');
        closeModal();
        loadLicenses();
    } else {
        showToast(result.message, 'error');
    }
}

window.deleteLicense = async function (id) {
    const confirmed = await showDeleteConfirm('ใบอนุญาตนี้');
    if (!confirmed) return;

    const res = await fetch(`/api/licenses?id=${id}`, { method: 'DELETE' });
    const data = await res.json();
    showToast(data.message, data.success ? 'success' : 'error');
    if (data.success) loadLicenses();
}

