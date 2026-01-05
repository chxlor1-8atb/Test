'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { API_ENDPOINTS } from '@/constants';
import { formatThaiDateTime, getInitial } from '@/utils/formatters';

// Lazy load Chart.js components to reduce initial bundle
const ChartComponents = dynamic(
    () => import('@/components/DashboardCharts'),
    {
        ssr: false,
        loading: () => <ChartLoadingPlaceholder />
    }
);

// Constants
const STAT_CARDS = [
    { key: 'total_shops', label: 'ร้านค้าทั้งหมด', icon: 'fas fa-store', variant: 'primary' },
    { key: 'total_licenses', label: 'ใบอนุญาตทั้งหมด', icon: 'fas fa-file-alt', variant: 'info' },
    { key: 'active_licenses', label: 'ใบอนุญาตที่ใช้งาน', icon: 'fas fa-check-circle', variant: 'success' },
    { key: 'expiring_soon', label: 'ใกล้หมดอายุ', icon: 'fas fa-exclamation-triangle', variant: 'warning', suffix: 'expiry_warning_days' },
    { key: 'expired_licenses', label: 'หมดอายุแล้ว', icon: 'fas fa-times-circle', variant: 'danger' }
];

const ACTION_BADGE_MAP = {
    'LOGIN': 'badge-success',
    'DELETE': 'badge-danger',
    'CREATE': 'badge-info',
    'UPDATE': 'badge-warning'
};

/**
 * DashboardPage Component
 */
export default function DashboardPage() {
    const [stats, setStats] = useState(null);
    const [breakdown, setBreakdown] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [user, setUser] = useState(null);

    useEffect(() => {
        checkAuth();
        fetchDashboardData();
    }, []);

    const checkAuth = async () => {
        try {
            const res = await fetch(API_ENDPOINTS.AUTH + '?action=check');
            const data = await res.json();
            if (data.success) {
                setUser(data.user);
            }
        } catch (err) {
            console.error('Auth check failed', err);
        }
    };

    const fetchDashboardData = useCallback(async () => {
        try {
            const [statsRes, breakdownRes, recentRes] = await Promise.all([
                fetch(API_ENDPOINTS.DASHBOARD_STATS),
                fetch(API_ENDPOINTS.DASHBOARD_BREAKDOWN),
                fetch(API_ENDPOINTS.DASHBOARD_ACTIVITY)
            ]);

            const statsData = await statsRes.json();
            const breakdownData = await breakdownRes.json();
            const activityData = await safeParseJson(recentRes);

            if (statsData.success) setStats(statsData.stats);
            if (breakdownData.success || breakdownData.breakdown) {
                setBreakdown(breakdownData.breakdown || []);
            }
            if (activityData?.success) {
                setRecentActivity(activityData.activities || []);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    if (loading) return <DashboardSkeleton />;
    if (error) return <div className="error-message">{error}</div>;
    if (!stats) return null;

    return (
        <div>
            <StatsGrid stats={stats} />
            <ChartComponents breakdown={breakdown} />
            {user?.role === 'admin' && <RecentActivityCard activities={recentActivity} />}
        </div>
    );
}

/**
 * StatsGrid Component
 */
function StatsGrid({ stats }) {
    return (
        <div className="stats-grid">
            {STAT_CARDS.map(card => (
                <StatCard
                    key={card.key}
                    value={stats[card.key]}
                    label={card.suffix ? `${card.label} (${stats[card.suffix]} วัน)` : card.label}
                    icon={card.icon}
                    variant={card.variant}
                />
            ))}
        </div>
    );
}

/**
 * StatCard Component
 */
function StatCard({ value, label, icon, variant }) {
    return (
        <div className="stat-card">
            <div className={`stat-icon ${variant}`}>
                <i className={icon}></i>
            </div>
            <div className="stat-content">
                <div className="stat-value">{value}</div>
                <div className="stat-label">{label}</div>
            </div>
        </div>
    );
}

/**
 * RecentActivityCard Component
 */
function RecentActivityCard({ activities }) {
    return (
        <div className="card" style={{ marginTop: '1.5rem' }}>
            <div className="card-header">
                <h3 className="card-title">
                    <i className="fas fa-history"></i> ประวัติการใช้งานล่าสุด
                </h3>
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
                            {activities.length > 0 ? activities.map(log => (
                                <ActivityRow key={log.id} log={log} />
                            )) : (
                                <tr>
                                    <td colSpan="4" className="text-center">
                                        ไม่มีข้อมูลกิจกรรมล่าสุด
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

/**
 * ActivityRow Component
 */
function ActivityRow({ log }) {
    const badgeClass = ACTION_BADGE_MAP[log.action] || 'badge-info';

    return (
        <tr>
            <td>{formatThaiDateTime(log.created_at)}</td>
            <td>
                <div className="user-info-cell" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <UserAvatar name={log.user_name} />
                    {log.user_name}
                </div>
            </td>
            <td>
                <span className={`badge ${badgeClass}`}>{log.action}</span>
            </td>
            <td style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {log.entity_type} {log.entity_id ? `#${log.entity_id}` : ''}
            </td>
        </tr>
    );
}

/**
 * UserAvatar Component
 */
function UserAvatar({ name }) {
    return (
        <div className="user-avatar-small" style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: '#eee',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            fontWeight: 600
        }}>
            {getInitial(name)}
        </div>
    );
}

/**
 * DashboardSkeleton Component
 */
function DashboardSkeleton() {
    return (
        <div>
            <div className="stats-grid" style={{ minHeight: '120px' }}>
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="stat-card" style={{ opacity: 0.7 }}>
                        <div className="skeleton-cell skeleton-animate" style={{ width: '56px', height: '56px', borderRadius: '12px' }} />
                        <div className="stat-content" style={{ gap: '0.5rem' }}>
                            <div className="skeleton-cell skeleton-animate" style={{ width: '60%', height: '28px' }} />
                            <div className="skeleton-cell skeleton-animate" style={{ width: '80%', height: '16px' }} />
                        </div>
                    </div>
                ))}
            </div>
            <div className="card chart-card" style={{ marginTop: '1.5rem', minHeight: '350px' }}>
                <div className="card-header">
                    <div className="skeleton-cell skeleton-animate" style={{ width: '200px', height: '24px' }} />
                </div>
                <div className="card-body" style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="loading-spinner">
                        <div className="spinner-ring" />
                        <div className="spinner-ring" />
                        <div className="spinner-ring" />
                        <div className="spinner-dot" />
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * ChartLoadingPlaceholder Component
 */
function ChartLoadingPlaceholder() {
    return (
        <div className="chart-placeholder" style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="loading-spinner" style={{ width: '40px', height: '40px' }}>
                <div className="spinner-ring" />
            </div>
        </div>
    );
}

/**
 * Safe JSON parser
 */
async function safeParseJson(response) {
    try {
        return await response.json();
    } catch {
        return null;
    }
}
