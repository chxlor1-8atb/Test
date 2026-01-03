'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import dynamic from 'next/dynamic';
import Loading, { CardSkeleton } from '@/components/Loading';

// Lazy load Chart.js components to reduce initial bundle
const ChartComponents = dynamic(
    () => import('@/components/DashboardCharts'),
    {
        ssr: false,
        loading: () => (
            <div className="chart-placeholder" style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="loading-spinner" style={{ width: '40px', height: '40px' }}>
                    <div className="spinner-ring"></div>
                </div>
            </div>
        )
    }
);

export default function DashboardPage() {
    const [stats, setStats] = useState(null);
    const [breakdown, setBreakdown] = useState([]);
    const [loading, setLoading] = useState(true);
    const [recentActivity, setRecentActivity] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const validJsonOrNull = async (res) => {
            try { return await res.json(); } catch (e) { return null; }
        };
        try {
            const [statsRes, breakdownRes, recentRes] = await Promise.all([
                fetch('/api/dashboard?action=stats'),
                fetch('/api/dashboard?action=license_breakdown'),
                fetch('/api/dashboard?action=recent_activity')
            ]);

            const statsData = await statsRes.json();
            const breakdownData = await breakdownRes.json();
            // Handle activity response safely as it might fail
            const activityData = await validJsonOrNull(recentRes);

            if (statsData.success) {
                setStats(statsData.stats);
            }
            if (breakdownData.success || breakdownData.breakdown) {
                setBreakdown(breakdownData.breakdown || []);
            }
            if (activityData && activityData.success) {
                setRecentActivity(activityData.activities || []);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Skeleton loading state - maintains layout
    if (loading) {
        return (
            <div>
                {/* Stats Grid Skeleton */}
                <div className="stats-grid" style={{ minHeight: '120px' }}>
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="stat-card" style={{ opacity: 0.7 }}>
                            <div className="skeleton-cell skeleton-animate" style={{ width: '56px', height: '56px', borderRadius: '12px' }}></div>
                            <div className="stat-content" style={{ gap: '0.5rem' }}>
                                <div className="skeleton-cell skeleton-animate" style={{ width: '60%', height: '28px' }}></div>
                                <div className="skeleton-cell skeleton-animate" style={{ width: '80%', height: '16px' }}></div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Chart Skeleton */}
                <div className="card chart-card" style={{ marginTop: '1.5rem', minHeight: '350px' }}>
                    <div className="card-header">
                        <div className="skeleton-cell skeleton-animate" style={{ width: '200px', height: '24px' }}></div>
                    </div>
                    <div className="card-body" style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div className="loading-spinner">
                            <div className="spinner-ring"></div>
                            <div className="spinner-ring"></div>
                            <div className="spinner-ring"></div>
                            <div className="spinner-dot"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) return <div className="error-message">{error}</div>;
    if (!stats) return null;

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

            {/* Lazy loaded charts */}
            <ChartComponents breakdown={breakdown} />

            {/* Recent Activity Widget */}
            <div className="card chart-card" style={{ marginTop: '1.5rem' }}>
                <div className="card-header">
                    <h3 className="card-title"><i className="fas fa-history"></i> ประวัติการใช้งานล่าสุด</h3>
                </div>
                <div className="card-body">
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>เวลา</th>
                                    <th>ผู้ใช้งาน</th>
                                    <th>กิจกรรม</th>
                                    <th>รายละเอียด</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentActivity.length > 0 ? recentActivity.map((log) => (
                                    <tr key={log.id}>
                                        <td>{new Date(log.created_at).toLocaleString('th-TH')}</td>
                                        <td>
                                            <div className="user-info-cell" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <div className="user-avatar-small" style={{ width: 24, height: 24, borderRadius: '50%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>
                                                    {(log.user_name || 'S').charAt(0)}
                                                </div>
                                                {log.user_name}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge ${log.action === 'LOGIN' ? 'badge-success' : log.action === 'DELETE' ? 'badge-danger' : 'badge-info'}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {log.entity_type} {log.entity_id ? `#${log.entity_id}` : ''}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="4" className="text-center">ไม่มีข้อมูลกิจกรรมล่าสุด</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
