/**
 * Notifications Settings Page Script - SPA Module
 */

let notificationSettings = {};

// Register as SPA module
window.PageModules = window.PageModules || {};
window.PageModules['notifications'] = {
    init: renderNotifications
};

async function renderNotifications() {
    const content = document.getElementById('contentBody');
    content.innerHTML = getLoadingHTML();

    try {
        const res = await fetch('/api/notifications?action=settings');
        const data = await res.json();
        notificationSettings = data.settings || {};

        content.innerHTML = `
            <div class="card">
                <div class="card-header"><h3 class="card-title"><i class="fas fa-bell"></i> ตั้งค่าการแจ้งเตือน Telegram</h3></div>
                <div class="card-body">
                    <form id="notificationForm">
                        <div class="form-group">
                            <label>Telegram Bot Token *</label>
                            <input type="text" name="telegram_bot_token" value="${notificationSettings.telegram_bot_token_masked || ''}" placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11">
                            <small>กรอกเฉพาะเมื่อต้องการเปลี่ยนแปลง Token</small>
                        </div>
                        <div class="form-group">
                            <label>Chat ID *</label>
                            <input type="text" name="telegram_chat_id" value="${notificationSettings.telegram_chat_id || ''}" placeholder="-1001234567890">
                        </div>
                        <div class="form-group">
                            <label>แจ้งเตือนก่อนหมดอายุ (วัน)</label>
                            <input type="number" name="days_before_expiry" value="${notificationSettings.days_before_expiry || 30}" min="1" max="365">
                        </div>
                        <div class="form-group">
                            <label style="display:flex;align-items:center;gap:0.5rem">
                                <input type="checkbox" name="is_active" ${notificationSettings.is_active ? 'checked' : ''}>
                                <span>เปิดใช้งานการแจ้งเตือน</span>
                            </label>
                        </div>
                        <div class="form-actions" style="display:flex;gap:1rem">
                            <button type="button" class="btn btn-primary" onclick="saveNotificationSettings()"><i class="fas fa-save"></i> บันทึก</button>
                            <button type="button" class="btn btn-secondary" onclick="testNotification()"><i class="fas fa-paper-plane"></i> ทดสอบ</button>
                            <button type="button" class="btn btn-success" onclick="sendExpiryNotifications()"><i class="fas fa-bell"></i> ส่งแจ้งเตือนทันที</button>
                        </div>
                    </form>
                </div>
            </div>

            <div class="card" style="margin-top:1.5rem">
                <div class="card-header"><h3 class="card-title"><i class="fas fa-history"></i> ประวัติการแจ้งเตือน</h3></div>
                <div class="card-body">
                    <div class="table-container"><table class="data-table">
                        <thead><tr><th>วันเวลา</th><th>ร้านค้า</th><th>สถานะ</th><th>ข้อความ</th></tr></thead>
                        <tbody id="logsTable"></tbody>
                    </table></div>
                </div>
            </div>`;

        await loadNotificationLogs();
    } catch (err) {
        content.innerHTML = getErrorHTML(err.message);
    }
}

// Make functions global for onclick handlers
window.saveNotificationSettings = async function () {
    const form = document.getElementById('notificationForm');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    data.is_active = form.querySelector('[name="is_active"]').checked ? 1 : 0;

    const res = await fetch('/api/notifications?action=save_settings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
    });
    const result = await res.json();
    showToast(result.message, result.success ? 'success' : 'error');
    if (result.success) renderNotifications();
};

window.testNotification = async function () {
    const res = await fetch('/api/notifications?action=test', { method: 'POST' });
    const data = await res.json();
    showToast(data.message, data.success ? 'success' : 'error');
};

window.sendExpiryNotifications = async function () {
    if (!confirm('ต้องการส่งการแจ้งเตือนใบอนุญาตใกล้หมดอายุหรือไม่?')) return;
    const res = await fetch('/api/notifications?action=check-expiring', { method: 'POST' });
    const data = await res.json();
    showToast(data.message, data.success ? 'success' : 'error');
    if (data.success) loadNotificationLogs();
};

async function loadNotificationLogs() {
    const res = await fetch('/api/notifications?action=logs');
    const data = await res.json();
    const logs = data.logs || [];

    const table = document.getElementById('logsTable');
    if (!table) return;

    table.innerHTML = logs.length ? logs.slice(0, 20).map(log => `<tr>
        <td>${formatDate(log.sent_at)}</td>
        <td>${log.shop_name || '-'}</td>
        <td><span class="badge ${log.status === 'success' ? 'badge-success' : 'badge-danger'}">${log.status}</span></td>
        <td style="max-width:300px;overflow:hidden;text-overflow:ellipsis">${log.message}</td>
    </tr>`).join('') : getEmptyHTML('ไม่มีประวัติ');
}

