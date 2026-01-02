/**
 * Dashboard Page Script - SPA Module
 * Handles dashboard stats and charts
 */

// Register as SPA module
window.PageModules = window.PageModules || {};
window.PageModules['dashboard'] = {
    init: renderDashboard
};

/**
 * Render Dashboard
 */
async function renderDashboard() {
    const content = document.getElementById('contentBody');
    content.innerHTML = getLoadingHTML();

    try {
        // Fetch all dashboard data
        const [statsRes, breakdownRes] = await Promise.all([
            fetch('/api/dashboard?action=stats'),
            fetch('/api/dashboard?action=license_breakdown')
        ]);

        const statsData = await statsRes.json();
        const breakdownData = await breakdownRes.json();

        if (!statsData.success) throw new Error(statsData.message);

        const stats = statsData.stats;
        const breakdown = breakdownData.breakdown || [];

        // Render HTML
        content.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card"><div class="stat-icon primary"><i class="fas fa-store"></i></div>
                    <div class="stat-content"><div class="stat-value">${stats.total_shops}</div><div class="stat-label">ร้านค้าทั้งหมด</div></div></div>
                <div class="stat-card"><div class="stat-icon info"><i class="fas fa-file-alt"></i></div>
                    <div class="stat-content"><div class="stat-value">${stats.total_licenses}</div><div class="stat-label">ใบอนุญาติทั้งหมด</div></div></div>
                <div class="stat-card"><div class="stat-icon success"><i class="fas fa-check-circle"></i></div>
                    <div class="stat-content"><div class="stat-value">${stats.active_licenses}</div><div class="stat-label">ใบอนุญาตที่ใช้งาน</div></div></div>
                <div class="stat-card"><div class="stat-icon warning"><i class="fas fa-exclamation-triangle"></i></div>
                    <div class="stat-content"><div class="stat-value">${stats.expiring_soon}</div><div class="stat-label">ใกล้หมดอายุ (${stats.expiry_warning_days} วัน)</div></div></div>
                <div class="stat-card"><div class="stat-icon danger"><i class="fas fa-times-circle"></i></div>
                    <div class="stat-content"><div class="stat-value">${stats.expired_licenses}</div><div class="stat-label">หมดอายุแล้ว</div></div></div>
            </div>

            <div class="dashboard-charts">
                <div class="card chart-card">
                    <div class="card-header"><h3 class="card-title"><i class="fas fa-chart-pie"></i> สัดส่วนใบอนุญาติแต่ละประเภท</h3></div>
                    <div class="card-body"><canvas id="licenseTypeChart"></canvas></div>
                </div>
                <div class="card chart-card">
                    <div class="card-header"><h3 class="card-title"><i class="fas fa-chart-bar"></i> สถานะใบอนุญาติตามประเภท</h3></div>
                    <div class="card-body"><canvas id="licenseStatusChart"></canvas></div>
                </div>
            </div>

`;  // End of dashboard HTML template

        // Update badge in menu
        if (stats.expiring_soon > 0) {
            const badge = document.getElementById('expiringBadgeMenu');
            if (badge) {
                badge.textContent = stats.expiring_soon;
                badge.style.display = 'inline';
            }
        }

        // Render charts
        renderLicenseTypeChart(breakdown);
        renderLicenseStatusChart(breakdown);

    } catch (err) {
        content.innerHTML = getErrorHTML(err.message);
    }
}

/**
 * Render Pie Chart - License Types
 */
function renderLicenseTypeChart(breakdown) {
    const ctx = document.getElementById('licenseTypeChart');
    if (!ctx) return;

    const labels = breakdown.map(b => b.type_name);
    const data = breakdown.map(b => parseInt(b.total_count));

    const colors = [
        'rgba(59, 130, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(239, 68, 68, 0.8)',
        'rgba(139, 92, 246, 0.8)',
        'rgba(236, 72, 153, 0.8)',
        'rgba(20, 184, 166, 0.8)',
        'rgba(251, 146, 60, 0.8)',
        'rgba(34, 197, 94, 0.8)',
        'rgba(168, 85, 247, 0.8)',
    ];

    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { padding: 15, font: { size: 12 } }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Render Bar Chart - License Status by Type
 */
function renderLicenseStatusChart(breakdown) {
    const ctx = document.getElementById('licenseStatusChart');
    if (!ctx) return;

    const labels = breakdown.map(b => b.type_name);
    const activeData = breakdown.map(b => parseInt(b.active_count));
    const expiringData = breakdown.map(b => parseInt(b.expiring_count));
    const expiredData = breakdown.map(b => parseInt(b.expired_count));

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'ใช้งาน',
                    data: activeData,
                    backgroundColor: 'rgba(16, 185, 129, 0.8)',
                    borderColor: 'rgba(16, 185, 129, 1)',
                    borderWidth: 1
                },
                {
                    label: 'ใกล้หมดอายุ',
                    data: expiringData,
                    backgroundColor: 'rgba(245, 158, 11, 0.8)',
                    borderColor: 'rgba(245, 158, 11, 1)',
                    borderWidth: 1
                },
                {
                    label: 'หมดอายุ',
                    data: expiredData,
                    backgroundColor: 'rgba(239, 68, 68, 0.8)',
                    borderColor: 'rgba(239, 68, 68, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                x: { stacked: false },
                y: {
                    stacked: false,
                    beginAtZero: true,
                    ticks: { precision: 0 }
                }
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { padding: 15, font: { size: 12 } }
                }
            }
        }
    });
}
