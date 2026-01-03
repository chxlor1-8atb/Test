'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { API_ENDPOINTS } from '@/constants';
import { formatThaiDate } from '@/utils/formatters';

// UI Components
import CustomSelect from '@/components/ui/CustomSelect';
import Pagination from '@/components/ui/Pagination';
import FilterRow, { SearchInput } from '@/components/ui/FilterRow';
import TableSkeleton from '@/components/ui/TableSkeleton';

// Constants - Expiry thresholds
const EXPIRY_THRESHOLDS = {
    EXPIRED: 0,
    CRITICAL: 7,
    WARNING: 14
};

const EXPIRY_STATUS_FILTERS = [
    { value: 'expired', label: 'หมดอายุแล้ว', icon: 'fas fa-times-circle', badgeClass: 'badge-expired' },
    { value: 'critical', label: '≤ 7 วัน', icon: 'fas fa-exclamation-triangle', badgeClass: 'badge-critical' },
    { value: 'warning', label: '8-14 วัน', icon: 'fas fa-exclamation-circle', badgeClass: 'badge-warning' },
    { value: 'info', label: '> 14 วัน', icon: 'fas fa-clock', badgeClass: 'badge-info' }
];

/**
 * ExpiringPage Component
 * Displays licenses that are expiring soon or already expired
 */
export default function ExpiringPage() {
    const [allLicenses, setAllLicenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/licenses/expiring');
            const data = await response.json();

            if (data.success) {
                setAllLicenses(data.licenses || []);
            }
        } catch (error) {
            console.error('Failed to fetch expiring licenses:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Extract unique types for filter dropdown
    const typesList = useMemo(() => {
        return [...new Set(allLicenses.map(l => l.type_name).filter(Boolean))];
    }, [allLicenses]);

    // Apply filters using useMemo for performance
    const filteredLicenses = useMemo(() => {
        let result = allLicenses;

        // Search filter
        if (search) {
            const lowerSearch = search.toLowerCase();
            result = result.filter(l =>
                (l.shop_name?.toLowerCase().includes(lowerSearch)) ||
                (l.shop_code?.toLowerCase().includes(lowerSearch)) ||
                (l.license_number?.toLowerCase().includes(lowerSearch))
            );
        }

        // Type filter
        if (filterType) {
            result = result.filter(l => l.type_name === filterType);
        }

        // Status filter
        if (statusFilter) {
            result = result.filter(l => {
                const days = parseInt(l.days_until_expiry);
                switch (statusFilter) {
                    case 'expired': return days < 0;
                    case 'critical': return days >= 0 && days <= EXPIRY_THRESHOLDS.CRITICAL;
                    case 'warning': return days > EXPIRY_THRESHOLDS.CRITICAL && days <= EXPIRY_THRESHOLDS.WARNING;
                    case 'info': return days > EXPIRY_THRESHOLDS.WARNING;
                    default: return true;
                }
            });
        }

        return result;
    }, [allLicenses, search, filterType, statusFilter]);

    // Pagination
    const totalPages = Math.ceil(filteredLicenses.length / limit);
    const currentData = useMemo(() => {
        return filteredLicenses.slice((page - 1) * limit, page * limit);
    }, [filteredLicenses, page, limit]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setPage(1);
    }, [search, filterType, statusFilter]);

    const handleStatusFilterToggle = (status) => {
        setStatusFilter(prev => prev === status ? '' : status);
    };

    const skeletonColumns = [
        { width: '10%' },
        { width: '20%' },
        { width: '15%' },
        { width: '15%' },
        { width: '15%', center: true },
        { width: '20%', center: true }
    ];

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">
                    <i className="fas fa-bell"></i> ใบอนุญาตใกล้หมดอายุ
                </h3>
                <StatusFilterBadges
                    currentFilter={statusFilter}
                    onToggle={handleStatusFilterToggle}
                    onClear={() => setStatusFilter('')}
                />
            </div>

            <div className="card-body">
                <FilterRow>
                    <SearchInput
                        value={search}
                        onChange={setSearch}
                        placeholder="ค้นหาร้านค้า..."
                    />
                    <CustomSelect
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        options={[
                            { value: '', label: 'ทุกประเภท' },
                            ...typesList.map(t => ({ value: t, label: t }))
                        ]}
                        placeholder="ทุกประเภท"
                        style={{ minWidth: '200px', width: 'auto' }}
                    />
                </FilterRow>

                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>รหัสร้าน</th>
                                <th>ชื่อร้าน</th>
                                <th>ประเภท</th>
                                <th>เลขที่</th>
                                <th className="text-center">หมดอายุ</th>
                                <th className="text-center">สถานะ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <TableSkeleton rows={5} columns={skeletonColumns} />
                            ) : currentData.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center">ไม่พบข้อมูล</td>
                                </tr>
                            ) : (
                                currentData.map(license => (
                                    <ExpiringLicenseRow key={license.id} license={license} />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    totalItems={filteredLicenses.length}
                    itemsPerPage={limit}
                    onPageChange={setPage}
                    onItemsPerPageChange={(l) => { setLimit(l); setPage(1); }}
                    showItemsPerPage
                    showPageJump
                    showTotalInfo
                />
            </div>

            <style jsx>{`
                .active-filter {
                    outline: 2px solid #fff;
                    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.5);
                }
            `}</style>
        </div>
    );
}

/**
 * StatusFilterBadges Component
 */
function StatusFilterBadges({ currentFilter, onToggle, onClear }) {
    return (
        <div className="filter-badges" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {EXPIRY_STATUS_FILTERS.map(filter => (
                <span
                    key={filter.value}
                    className={`badge ${filter.badgeClass} filter-badge ${currentFilter === filter.value ? 'active-filter' : ''}`}
                    style={{
                        cursor: 'pointer',
                        opacity: currentFilter && currentFilter !== filter.value ? 0.5 : 1
                    }}
                    onClick={() => onToggle(filter.value)}
                >
                    <i className={filter.icon}></i> {filter.label}
                </span>
            ))}
            {currentFilter && (
                <span
                    className="badge badge-secondary filter-badge"
                    style={{ cursor: 'pointer' }}
                    onClick={onClear}
                >
                    <i className="fas fa-times"></i> ล้างตัวกรอง
                </span>
            )}
        </div>
    );
}

/**
 * ExpiringLicenseRow Component
 */
function ExpiringLicenseRow({ license }) {
    const daysLeft = parseInt(license.days_until_expiry);
    const expiryStatus = getExpiryStatus(daysLeft);

    return (
        <tr>
            <td><strong>{license.shop_code || '-'}</strong></td>
            <td>{license.shop_name}</td>
            <td>{license.type_name}</td>
            <td>{license.license_number}</td>
            <td className="text-center">{formatThaiDate(license.expiry_date)}</td>
            <td className="text-center">
                <span className={`badge ${expiryStatus.badgeClass}`}>
                    <i className={expiryStatus.icon}></i> {expiryStatus.text}
                </span>
            </td>
        </tr>
    );
}

/**
 * Helper function to determine expiry status
 */
function getExpiryStatus(daysLeft) {
    if (daysLeft < 0) {
        return {
            badgeClass: 'badge-expired',
            icon: 'fas fa-times-circle',
            text: `หมดอายุแล้ว ${Math.abs(daysLeft)} วัน`
        };
    }
    if (daysLeft === 0) {
        return {
            badgeClass: 'badge-expired',
            icon: 'fas fa-exclamation-triangle',
            text: 'หมดอายุวันนี้'
        };
    }
    if (daysLeft <= EXPIRY_THRESHOLDS.CRITICAL) {
        return {
            badgeClass: 'badge-critical',
            icon: 'fas fa-exclamation-triangle',
            text: `เหลือ ${daysLeft} วัน`
        };
    }
    if (daysLeft <= EXPIRY_THRESHOLDS.WARNING) {
        return {
            badgeClass: 'badge-warning',
            icon: 'fas fa-exclamation-circle',
            text: `เหลือ ${daysLeft} วัน`
        };
    }
    return {
        badgeClass: 'badge-info',
        icon: 'fas fa-clock',
        text: `เหลือ ${daysLeft} วัน`
    };
}
