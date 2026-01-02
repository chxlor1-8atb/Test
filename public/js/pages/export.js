/**
 * Export Data Page Script - SPA Module
 */

let exportLicenseTypes = [];

// Register as SPA module
window.PageModules = window.PageModules || {};
window.PageModules['export'] = {
    init: renderExport
};

async function renderExport() {
    // Load license types for filter
    const res = await fetch('/api/license-types');
    const data = await res.json();
    exportLicenseTypes = data.types || [];

    const content = document.getElementById('contentBody');
    content.innerHTML = `
        <div class="card">
            <div class="card-header"><h3 class="card-title"><i class="fas fa-file-export"></i> ส่งออกข้อมูล</h3></div>
            <div class="card-body">
                <form id="exportForm">
                    <div class="form-group">
                        <label>เลือกประเภทข้อมูล *</label>
                        <select name="type" required>
                            <option value="licenses">ใบอนุญาต</option>
                            <option value="shops">ร้านค้า</option>
                            <option value="users">ผู้ใช้งาน (Admin เท่านั้น)</option>
                        </select>
                    </div>

                    <div class="form-group" id="licenseFilters">
                        <label>กรองข้อมูล (ใบอนุญาต)</label>
                        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;margin-top:0.5rem">
                            <div>
                                <label style="font-size:0.875rem">ประเภทใบอนุญาต</label>
                                <select name="license_type">
                                    <option value="">ทั้งหมด</option>
                                    ${exportLicenseTypes.map(t => `<option value="${t.id}">${t.type_name}</option>`).join('')}
                                </select>
                            </div>
                            <div>
                                <label style="font-size:0.875rem">สถานะ</label>
                                <select name="status">
                                    <option value="">ทั้งหมด</option>
                                    <option value="active">ใช้งาน</option>
                                    <option value="expired">หมดอายุ</option>
                                    <option value="pending">รอดำเนินการ</option>
                                </select>
                            </div>
                            <div>
                                <label style="font-size:0.875rem">หมดอายุจาก</label>
                                <input type="date" name="expiry_from">
                            </div>
                            <div>
                                <label style="font-size:0.875rem">หมดอายุถึง</label>
                                <input type="date" name="expiry_to">
                            </div>
                        </div>
                    </div>

                    <div class="form-actions" style="margin-top:2rem">
                        <button type="button" class="btn btn-primary" onclick="exportData('csv')">
                            <i class="fas fa-file-csv"></i> ส่งออกเป็น CSV
                        </button>
            </form>
            </div>
        </div>

        <div class="card" style="margin-top:1.5rem">
            <div class="card-header"><h3 class="card-title"><i class="fas fa-info-circle"></i> คำแนะนำ</h3></div>
            <div class="card-body">
                <ul style="margin:0;padding-left:1.5rem">
                    <li>ไฟล์ CSV สามารถเปิดด้วย Microsoft Excel หรือ Google Sheets</li>
                    <li>ข้อมูลจะถูกส่งออกตามตัวกรองที่เลือก</li>
                    <li>ข้อมูลผู้ใช้งานสามารถส่งออกได้เฉพาะผู้ดูแลระบบเท่านั้น</li>
                </ul>
            </div>
        </div>`;

    // Apply custom select styling to all form dropdowns
    if (typeof initCustomSelects === 'function') {
        initCustomSelects('#exportForm select');
    }

    // Toggle license filters
    const typeSelect = document.querySelector('[name="type"]');
    typeSelect.addEventListener('change', () => {
        const licenseFilters = document.getElementById('licenseFilters');
        licenseFilters.style.display = typeSelect.value === 'licenses' ? 'block' : 'none';
    });
}

// Make functions global for onclick handlers
window.exportData = function (format) {
    const form = document.getElementById('exportForm');
    const formData = new FormData(form);
    const params = new URLSearchParams();

    params.append('format', format);
    for (const [key, value] of formData) {
        if (value) params.append(key, value);
    }

    // Open CSV export in new window
    window.open(`/api/export?${params.toString()}`, '_blank');
    showToast('กำลังดาวน์โหลดไฟล์...', 'info');
}
