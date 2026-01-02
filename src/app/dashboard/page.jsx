'use client';

import { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

export default function DashboardPage() {
    const [stats, setStats] = useState(null);
    const [breakdown, setBreakdown] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [statsRes, breakdownRes] = await Promise.all([
                fetch('/api/dashboard?action=stats'),
                fetch('/api/dashboard?action=license_breakdown')
            ]);

            const statsData = await statsRes.json();
            const breakdownData = await breakdownRes.json();

            if (statsData.success) {
                setStats(statsData.stats);
            }
            if (breakdownData.success || breakdownData.breakdown) {
                setBreakdown(breakdownData.breakdown || []);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>กำลังโหลดข้อมูล...</div>;
    if (error) return <div className="error-message">{error}</div>;
    if (!stats) return null;

    // Prepare Chart Data
    const pieData = {
        labels: breakdown.map(b => b.type_name),
        datasets: [{
            data: breakdown.map(b => parseInt(b.total_count)),
            backgroundColor: [
                'rgba(59, 130, 246, 0.8)', 'rgba(16, 185, 129, 0.8)', 'rgba(245, 158, 11, 0.8)',
                'rgba(239, 68, 68, 0.8)', 'rgba(139, 92, 246, 0.8)', 'rgba(236, 72, 153, 0.8)'
            ],
            borderWidth: 1,
        }]
    };

    const barData = {
        labels: breakdown.map(b => b.type_name),
        datasets: [
            {
                label: 'ใช้งาน',
                data: breakdown.map(b => parseInt(b.active_count)),
                backgroundColor: 'rgba(16, 185, 129, 0.8)',
            },
            {
                label: 'ใกล้หมดอายุ',
                data: breakdown.map(b => parseInt(b.expiring_count)),
                backgroundColor: 'rgba(245, 158, 11, 0.8)',
            },
            {
                label: 'หมดอายุ',
                data: breakdown.map(b => parseInt(b.expired_count)),
                backgroundColor: 'rgba(239, 68, 68, 0.8)',
            }
        ]
    };

    return (
        <div>
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon primary"><i className="fas fa-store"></i></div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.total_shops}</div>
                        <div className="stat-label">ร้านค้าทั้งหมด</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon info"><i className="fas fa-file-alt"></i></div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.total_licenses}</div>
                        <div className="stat-label">ใบอนุญาตทั้งหมด</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon success"><i className="fas fa-check-circle"></i></div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.active_licenses}</div>
                        <div className="stat-label">ใบอนุญาตที่ใช้งาน</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon warning"><i className="fas fa-exclamation-triangle"></i></div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.expiring_soon}</div>
                        <div className="stat-label">ใกล้หมดอายุ ({stats.expiry_warning_days} วัน)</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon danger"><i className="fas fa-times-circle"></i></div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.expired_licenses}</div>
                        <div className="stat-label">หมดอายุแล้ว</div>
                    </div>
                </div>
            </div>

            <div className="dashboard-charts">
                <div className="card chart-card">
                    <div className="card-header"><h3 className="card-title"><i className="fas fa-chart-pie"></i> สัดส่วนใบอนุญาตแต่ละประเภท</h3></div>
                    <div className="card-body" style={{ height: '300px', display: 'flex', justifyContent: 'center' }}>
                        <Pie data={pieData} options={{ responsive: true, maintainAspectRatio: false }} />
                    </div>
                </div>
                <div className="card chart-card">
                    <div className="card-header"><h3 className="card-title"><i className="fas fa-chart-bar"></i> สถานะใบอนุญาตตามประเภท</h3></div>
                    <div className="card-body" style={{ height: '300px' }}>
                        <Bar data={barData} options={{ responsive: true, maintainAspectRatio: false, scales: { x: { stacked: false }, y: { stacked: false } } }} />
                    </div>
                </div>
            </div>
        </div>
    );
}
