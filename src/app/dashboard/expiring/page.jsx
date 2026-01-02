'use client';

import { useState, useEffect } from 'react';
import CustomSelect from '@/components/ui/CustomSelect';

export default function ExpiringPage() {
    const [allLicenses, setAllLicenses] = useState([]);
    const [filteredLicenses, setFilteredLicenses] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('');
    const [statusFilter, setStatusFilter] = useState(''); // 'expired', 'critical', 'warning', 'info'
    const [typesList, setTypesList] = useState([]);

    // Pagination
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [allLicenses, search, filterType, statusFilter]);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/licenses/expiring');
            const data = await res.json();

            if (data.success) {
                setAllLicenses(data.licenses || []);
                // Extract unique types for filter
                const types = [...new Set(data.licenses.map(l => l.type_name).filter(Boolean))];
                setTypesList(types);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let result = allLicenses;

        // Search
        if (search) {
            const lowerSearch = search.toLowerCase();
            result = result.filter(l =>
                (l.shop_name && l.shop_name.toLowerCase().includes(lowerSearch)) ||
                (l.shop_code && l.shop_code.toLowerCase().includes(lowerSearch)) ||
                (l.license_number && l.license_number.toLowerCase().includes(lowerSearch))
            );
        }

        // Type Filter
        if (filterType) {
            result = result.filter(l => l.type_name === filterType);
        }

        // Status Badge Filter
        if (statusFilter) {
            result = result.filter(l => {
                const days = parseInt(l.days_until_expiry);
                if (statusFilter === 'expired') return days < 0;
                if (statusFilter === 'critical') return days >= 0 && days <= 7;
                if (statusFilter === 'warning') return days > 7 && days <= 14;
                if (statusFilter === 'info') return days > 14;
                return true;
            });
        }

        setFilteredLicenses(result);
        setPage(1); // Reset to page 1 on filter change
    };

    // Pagination Logic
    const totalPages = Math.ceil(filteredLicenses.length / limit);
    const currentData = filteredLicenses.slice((page - 1) * limit, page * limit);

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('th-TH', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title"><i className="fas fa-bell"></i> ใบอนุญาตใกล้หมดอายุ</h3>
                <div className="filter-badges" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span
                        className={`badge badge-expired filter-badge ${statusFilter === 'expired' ? 'active-filter' : ''}`}
                        style={{ cursor: 'pointer', opacity: statusFilter && statusFilter !== 'expired' ? 0.5 : 1 }}
                        onClick={() => setStatusFilter(statusFilter === 'expired' ? '' : 'expired')}
                    >
                        <i className="fas fa-times-circle"></i> หมดอายุแล้ว
                    </span>
                    <span
                        className={`badge badge-critical filter-badge ${statusFilter === 'critical' ? 'active-filter' : ''}`}
                        style={{ cursor: 'pointer', opacity: statusFilter && statusFilter !== 'critical' ? 0.5 : 1 }}
                        onClick={() => setStatusFilter(statusFilter === 'critical' ? '' : 'critical')}
                    >
                        <i className="fas fa-exclamation-triangle"></i> ≤ 7 วัน
                    </span>
                    <span
                        className={`badge badge-warning filter-badge ${statusFilter === 'warning' ? 'active-filter' : ''}`}
                        style={{ cursor: 'pointer', opacity: statusFilter && statusFilter !== 'warning' ? 0.5 : 1 }}
                        onClick={() => setStatusFilter(statusFilter === 'warning' ? '' : 'warning')}
                    >
                        <i className="fas fa-exclamation-circle"></i> 8-14 วัน
                    </span>
                    <span
                        className={`badge badge-info filter-badge ${statusFilter === 'info' ? 'active-filter' : ''}`}
                        style={{ cursor: 'pointer', opacity: statusFilter && statusFilter !== 'info' ? 0.5 : 1 }}
                        onClick={() => setStatusFilter(statusFilter === 'info' ? '' : 'info')}
                    >
                        <i className="fas fa-clock"></i> &gt; 14 วัน
                    </span>
                    {statusFilter && (
                        <span
                            className="badge badge-secondary filter-badge"
                            style={{ cursor: 'pointer' }}
                            onClick={() => setStatusFilter('')}
                        >
                            <i className="fas fa-times"></i> ล้างตัวกรอง
                        </span>
                    )}
                </div>
            </div>
            <div className="card-body">
                <div className="filter-row" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem', alignItems: 'center' }}>
                    <input
                        type="text"
                        placeholder="ค้นหาร้านค้า..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
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
                </div>

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
                                <tr><td colSpan="6" className="text-center">กำลังโหลด...</td></tr>
                            ) : currentData.length === 0 ? (
                                <tr><td colSpan="6" className="text-center">ไม่พบข้อมูล</td></tr>
                            ) : (
                                currentData.map(l => {
                                    const daysLeft = parseInt(l.days_until_expiry);
                                    let badgeClass, badgeIcon, daysText;

                                    if (daysLeft < 0) {
                                        badgeClass = 'badge-expired';
                                        badgeIcon = 'fas fa-times-circle';
                                        daysText = `หมดอายุแล้ว ${Math.abs(daysLeft)} วัน`;
                                    } else if (daysLeft === 0) {
                                        badgeClass = 'badge-expired';
                                        badgeIcon = 'fas fa-exclamation-triangle';
                                        daysText = 'หมดอายุวันนี้';
                                    } else if (daysLeft <= 7) {
                                        badgeClass = 'badge-critical';
                                        badgeIcon = 'fas fa-exclamation-triangle';
                                        daysText = `เหลือ ${daysLeft} วัน`;
                                    } else if (daysLeft <= 14) {
                                        badgeClass = 'badge-warning';
                                        badgeIcon = 'fas fa-exclamation-circle';
                                        daysText = `เหลือ ${daysLeft} วัน`;
                                    } else {
                                        badgeClass = 'badge-info';
                                        badgeIcon = 'fas fa-clock';
                                        daysText = `เหลือ ${daysLeft} วัน`;
                                    }

                                    return (
                                        <tr key={l.id}>
                                            <td><strong>{l.shop_code || '-'}</strong></td>
                                            <td>{l.shop_name}</td>
                                            <td>{l.type_name}</td>
                                            <td>{l.license_number}</td>
                                            <td className="text-center">{formatDate(l.expiry_date)}</td>
                                            <td className="text-center">
                                                <span className={`badge ${badgeClass}`}>
                                                    <i className={badgeIcon}></i> {daysText}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Simple Pagination */}
                {(totalPages > 1 || page > 1) && (
                    <div className="pagination">
                        <button
                            className="btn-page"
                            disabled={page === 1}
                            onClick={() => setPage(page - 1)}
                        >
                            ก่อนหน้า
                        </button>
                        <span className="page-info">
                            หน้า {page} / {totalPages || 1}
                        </span>
                        <button
                            className="btn-page"
                            disabled={page >= totalPages}
                            onClick={() => setPage(page + 1)}
                        >
                            ถัดไป
                        </button>
                    </div>
                )}
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
