/**
 * Shops Management Page Script - SPA Module
 */

let shops = [];
let shopsPagination = { page: 1, limit: 20, total: 0, totalPages: 0 };

// Register as SPA module
window.PageModules = window.PageModules || {};
window.PageModules['shops'] = {
    init: renderShops
};

async function renderShops() {
    const content = document.getElementById('contentBody');
    content.innerHTML = `
        <div class="card"><div class="card-header"><h3 class="card-title"><i class="fas fa-store"></i> รายการร้านค้า</h3>
            <button class="btn btn-primary btn-sm" onclick="showShopModal()"><i class="fas fa-plus"></i> เพิ่มร้านค้า</button></div>
            <div class="card-body">
                <div class="filter-row" style="display:flex;gap:0.75rem;flex-wrap:wrap;margin-bottom:1rem;align-items:center">
                    <input type="text" id="shopSearch" placeholder="ค้นหาร้านค้า...">
                </div>
                <div class="table-container"><table class="data-table"><thead><tr><th>ชื่อร้าน</th><th>เจ้าของ</th><th>โทรศัพท์</th><th class="text-center">ใบอนุญาต</th><th class="text-center" style="width: 150px;">จัดการ</th></tr></thead>
                <tbody id="shopsTable"></tbody></table></div>
                <div id="shopsPagination"></div>
            </div></div>`;
    await loadShops();

    const searchInput = document.getElementById('shopSearch');
    const debouncedSearch = debounce(() => { shopsPagination.page = 1; loadShops(searchInput.value); }, 300);
    searchInput.addEventListener('input', debouncedSearch);
}

async function loadShops(search = '') {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    params.append('page', shopsPagination.page);
    params.append('limit', shopsPagination.limit);

    const res = await fetch(`api/shops.php?${params}`);
    const data = await res.json();
    shops = data.shops || [];

    if (data.pagination) {
        shopsPagination = { ...shopsPagination, ...data.pagination };
    }

    document.getElementById('shopsTable').innerHTML = shops.length ? shops.map(s => `<tr>
        <td>${s.shop_name}</td><td>${s.owner_name || '-'}</td><td>${s.phone || '-'}</td>
        <td class="text-center"><span class="badge badge-active">${s.license_count}</span></td>
        <td class="text-center">
            <div class="action-buttons">
                <button class="btn btn-secondary btn-icon" onclick="showShopModal(${s.id})"><i class="fas fa-edit"></i></button>
                <button class="btn btn-danger btn-icon" onclick="deleteShop(${s.id})"><i class="fas fa-trash"></i></button>
            </div>
        </td></tr>`).join('') : getEmptyHTML('ไม่พบข้อมูล');

    renderPagination(
        'shopsPagination',
        shopsPagination,
        (newPage) => {
            shopsPagination.page = newPage;
            const searchInput = document.getElementById('shopSearch');
            loadShops(searchInput?.value || '');
        },
        (newLimit) => {
            shopsPagination.limit = parseInt(newLimit);
            shopsPagination.page = 1;
            const searchInput = document.getElementById('shopSearch');
            loadShops(searchInput?.value || '');
        }
    );
}

// Make functions global for onclick handlers
window.showShopModal = async function (id = null) {
    const isEdit = id !== null;
    let shop = {};
    if (isEdit) {
        const res = await fetch(`api/shops.php?id=${id}`);
        const data = await res.json();
        shop = data.shop;
    }

    setModalContent(
        isEdit ? 'แก้ไขร้านค้า' : 'เพิ่มร้านค้าใหม่',
        `<form id="shopForm">
            <input type="hidden" name="id" value="${shop.id || ''}">
            <div class="form-group"><label>ชื่อร้านค้า *</label><input type="text" name="shop_name" value="${shop.shop_name || ''}" required></div>
            <div class="form-group"><label>ชื่อเจ้าของ</label><input type="text" name="owner_name" value="${shop.owner_name || ''}"></div>
            <div class="form-group"><label>ที่อยู่</label><textarea name="address" rows="2">${shop.address || ''}</textarea></div>
            <div class="form-group"><label>โทรศัพท์</label><input type="text" name="phone" value="${shop.phone || ''}"></div>
            <div class="form-group"><label>อีเมล</label><input type="email" name="email" value="${shop.email || ''}"></div>
            <div class="form-group"><label>หมายเหตุ</label><textarea name="notes" rows="2">${shop.notes || ''}</textarea></div>
        </form>`,
        `<button class="btn btn-secondary" onclick="closeModal()">ยกเลิก</button>
        <button class="btn btn-primary" onclick="saveShop()">บันทึก</button>`
    );
    openModal();
}

window.saveShop = async function () {
    const form = document.getElementById('shopForm');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    const method = data.id ? 'PUT' : 'POST';
    const res = await fetch('api/shops.php', {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
    });
    const result = await res.json();

    if (result.success) {
        showToast(result.message, 'success');
        closeModal();
        loadShops();
    } else {
        showToast(result.message, 'error');
    }
}

window.deleteShop = async function (id) {
    const confirmed = await showDeleteConfirm('ร้านค้านี้');
    if (!confirmed) return;

    const res = await fetch(`api/shops.php?id=${id}`, { method: 'DELETE' });
    const data = await res.json();
    showToast(data.message, data.success ? 'success' : 'error');
    if (data.success) loadShops();
}

