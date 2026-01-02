/**
 * Expiring Licenses Page Script - SPA Module
 */

// Use var and check to prevent redeclaration errors on SPA navigation
if (typeof allExpiringLicensesPage === 'undefined') {
    var allExpiringLicensesPage = [];
}
if (typeof filteredExpiringLicenses === 'undefined') {
    var filteredExpiringLicenses = [];
}
if (typeof expiringPagination === 'undefined') {
    var expiringPagination = { page: 1, limit: 20 };
}
if (typeof expiringStatusFilter === 'undefined') {
    var expiringStatusFilter = '';
}

// Register as SPA module
window.PageModules = window.PageModules || {};
window.PageModules['expiring'] = {
    init: renderExpiring
};

async function renderExpiring() {
    const content = document.getElementById('contentBody');
    content.innerHTML = getLoadingHTML();

    try {
        const [statsRes, breakdownRes] = await Promise.all([
            fetch('/api/dashboard?action=stats'),
            fetch('/api/dashboard?action=license_breakdown')
        ]);

        const statsData = await statsRes.json();
        const breakdownData = await breakdownRes.json();

        if (!statsData.success || !breakdownData.success) {
            throw new Error('Failed to load data');
        }

        const breakdown = breakdownData.breakdown || [];
        allExpiringLicensesPage = statsData.expiring || [];

        content.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title"><i class="fas fa-bell"></i> ใบอนุญาตใกล้หมดอายุ</h3>
                    <div class="filter-badges" style="display:flex;gap:0.5rem;flex-wrap:wrap">
                        <span class="badge badge-expired filter-badge" data-filter="expired" style="cursor:pointer" onclick="filterByBadge('expired')"><i class="fas fa-times-circle"></i> หมดอายุแล้ว</span>
                        <span class="badge badge-critical filter-badge" data-filter="critical" style="cursor:pointer" onclick="filterByBadge('critical')"><i class="fas fa-exclamation-triangle"></i> ≤ 7 วัน</span>
                        <span class="badge badge-warning filter-badge" data-filter="warning" style="cursor:pointer" onclick="filterByBadge('warning')"><i class="fas fa-exclamation-circle"></i> 8-14 วัน</span>
                        <span class="badge badge-info filter-badge" data-filter="info" style="cursor:pointer" onclick="filterByBadge('info')"><i class="fas fa-clock"></i> > 14 วัน</span>
                        <span class="badge badge-secondary filter-badge" data-filter="" style="cursor:pointer;display:none" id="clearFilterBadge" onclick="filterByBadge('')"><i class="fas fa-times"></i> ล้างตัวกรอง</span>
                    </div>
                </div>
                <div class="card-body">
                    <div class="filter-row" style="display:flex;gap:0.75rem;flex-wrap:wrap;margin-bottom:1rem;align-items:center">
                        <input type="text" id="expiringSearchPage" placeholder="ค้นหาร้านค้า...">
                        <select id="expiringTypeFilterPage">
                            <option value="">ทุกประเภท</option>
                        </select>
                    </div>
                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>รหัสร้าน</th><th>ชื่อร้าน</th><th>ประเภท</th><th>เลขที่</th><th class="text-center">หมดอายุ</th><th class="text-center">เหลือ</th>
                                </tr>
                            </thead>
                            <tbody id="expiringTablePage"></tbody>
                        </table>
                    </div>
                    <div id="expiringPagination"></div>
                </div>
            </div>`;

        const typeFilter = document.getElementById('expiringTypeFilterPage');
        if (typeFilter && breakdown && breakdown.length > 0) {
            const typeOptions = breakdown.map(b => `<option value="${b.type_name}">${b.type_name}</option>`).join('');
            typeFilter.innerHTML = '<option value="">ทุกประเภท</option>' + typeOptions;
        }

        // Initialize custom select dropdowns for better styling
        if (typeof initCustomSelects === 'function') {
            initCustomSelects('.filter-row select');
        }

        filterExpiringPage();

        const searchInput = document.getElementById('expiringSearchPage');
        const typeFilterEl = document.getElementById('expiringTypeFilterPage');

        const debouncedFilter = debounce(() => { expiringPagination.page = 1; filterExpiringPage(); }, 300);

        if (searchInput) searchInput.addEventListener('input', debouncedFilter);
        if (typeFilterEl) typeFilterEl.addEventListener('change', () => { expiringPagination.page = 1; filterExpiringPage(); });

    } catch (err) {
        content.innerHTML = getErrorHTML(err.message);
    }
}

function filterExpiringPage() {
    const searchText = document.getElementById('expiringSearchPage')?.value.toLowerCase() || '';
    const typeFilter = document.getElementById('expiringTypeFilterPage')?.value || '';
    const statusFilter = expiringStatusFilter; // Use badge filter variable

    filteredExpiringLicenses = allExpiringLicensesPage.filter(l => {
        const matchesSearch = !searchText ||
            l.shop_name.toLowerCase().includes(searchText) ||
            l.shop_code.toLowerCase().includes(searchText);

        const matchesType = !typeFilter || l.type_name === typeFilter;

        let matchesStatus = true;
        if (statusFilter) {
            const daysLeft = parseInt(l.days_until_expiry);
            if (statusFilter === 'expired') {
                matchesStatus = daysLeft < 0;
            } else if (statusFilter === 'critical') {
                matchesStatus = daysLeft >= 0 && daysLeft <= 7;
            } else if (statusFilter === 'warning') {
                matchesStatus = daysLeft > 7 && daysLeft <= 14;
            } else if (statusFilter === 'info') {
                matchesStatus = daysLeft > 14;
            }
        }

        return matchesSearch && matchesType && matchesStatus;
    });

    renderExpiringPageTable();
}

function renderExpiringPageTable() {
    const table = document.getElementById('expiringTablePage');
    if (!table) return;

    const { page, limit } = expiringPagination;
    const total = filteredExpiringLicenses.length;
    const totalPages = Math.ceil(total / limit);
    const startIdx = (page - 1) * limit;
    const endIdx = Math.min(startIdx + limit, total);
    const pageData = filteredExpiringLicenses.slice(startIdx, endIdx);

    if (pageData && pageData.length > 0) {
        table.innerHTML = pageData.map(l => {
            const daysLeft = parseInt(l.days_until_expiry);
            let badgeClass, badgeIcon, daysText;

            if (daysLeft < 0) {
                badgeClass = 'badge-expired';
                badgeIcon = '<i class="fas fa-times-circle"></i>';
                daysText = `หมดอายุแล้ว ${Math.abs(daysLeft)} วัน`;
            } else if (daysLeft === 0) {
                badgeClass = 'badge-expired';
                badgeIcon = '<i class="fas fa-exclamation-triangle"></i>';
                daysText = 'หมดอายุวันนี้';
            } else if (daysLeft <= 7) {
                badgeClass = 'badge-critical';
                badgeIcon = '<i class="fas fa-exclamation-triangle"></i>';
                daysText = `เหลือ ${daysLeft} วัน`;
            } else if (daysLeft <= 14) {
                badgeClass = 'badge-warning';
                badgeIcon = '<i class="fas fa-exclamation-circle"></i>';
                daysText = `เหลือ ${daysLeft} วัน`;
            } else {
                badgeClass = 'badge-info';
                badgeIcon = '<i class="fas fa-clock"></i>';
                daysText = `เหลือ ${daysLeft} วัน`;
            }

            return `<tr>
                <td><strong>${l.shop_code}</strong></td>
                <td>${l.shop_name}</td>
                <td>${l.type_name}</td>
                <td>${l.license_number}</td>
                <td class="text-center">${formatDate(l.expiry_date)}</td>
                <td class="text-center"><span class="badge ${badgeClass}">${badgeIcon} ${daysText}</span></td>
            </tr>`;
        }).join('');
    } else {
        table.innerHTML = getEmptyHTML('ไม่พบข้อมูล');
    }

    // Update pagination state for the renderer
    expiringPagination.total = total;
    expiringPagination.totalPages = totalPages;

    renderPagination(
        'expiringPagination',
        expiringPagination,
        (newPage) => {
            expiringPagination.page = newPage;
            renderExpiringPageTable();
        },
        (newLimit) => {
            expiringPagination.limit = parseInt(newLimit);
            expiringPagination.page = 1;
            renderExpiringPageTable();
        }
    );
}

window.filterByBadge = function (filterValue) {
    // Set the status filter variable
    expiringStatusFilter = filterValue;

    // Update visual feedback on badges
    document.querySelectorAll('.filter-badge').forEach(badge => {
        if (badge.dataset.filter === filterValue) {
            badge.style.outline = '2px solid #fff';
            badge.style.boxShadow = '0 0 0 4px rgba(99, 102, 241, 0.5)';
        } else {
            badge.style.outline = 'none';
            badge.style.boxShadow = 'none';
        }
    });

    // Show/hide clear filter badge
    const clearBadge = document.getElementById('clearFilterBadge');
    if (clearBadge) {
        clearBadge.style.display = filterValue ? 'inline-flex' : 'none';
    }

    // Reset to page 1 and filter
    expiringPagination.page = 1;
    filterExpiringPage();
};
