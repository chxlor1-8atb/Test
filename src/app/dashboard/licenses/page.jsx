'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

export default function LicensesPage() {
    const [licenses, setLicenses] = useState([]);
    const [shopsList, setShopsList] = useState([]);
    const [typesList, setTypesList] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
    const [loading, setLoading] = useState(true);

    // Filters
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    // Modal
    const [showModal, setShowModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [formData, setFormData] = useState({
        id: '',
        shop_id: '',
        license_type_id: '',
        license_number: '',
        issue_date: '',
        expiry_date: '',
        status: 'active',
        notes: ''
    });

    useEffect(() => {
        loadDropdowns();
    }, []);

    useEffect(() => {
        loadLicenses();
    }, [pagination.page, search, filterType, filterStatus]);

    const loadDropdowns = async () => {
        try {
            const [shopsRes, typesRes] = await Promise.all([
                fetch('/api/shops?limit=1000'), // Get all for dropdown
                fetch('/api/license-types')
            ]);

            const shopsData = await shopsRes.json();
            const typesData = await typesRes.json();

            if (shopsData.success) setShopsList(shopsData.shops || []);
            if (typesData.success) setTypesList(typesData.types || []);
        } catch (error) {
            console.error(error);
        }
    };

    const loadLicenses = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: pagination.page,
                limit: pagination.limit,
                search,
                license_type: filterType,
                status: filterStatus
            });
            const res = await fetch(`/api/licenses?${params}`);
            const data = await res.json();

            if (data.success) {
                setLicenses(data.licenses);
                setPagination(prev => ({ ...prev, ...data.pagination }));
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'ยืนยันการลบ?',
            text: "ข้อมูลใบอนุญาตจะถูกลบถาวร",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'ลบข้อมูล',
            cancelButtonText: 'ยกเลิก'
        });

        if (result.isConfirmed) {
            try {
                const res = await fetch(`/api/licenses?id=${id}`, { method: 'DELETE' });
                const data = await res.json();
                if (data.success) {
                    Swal.fire('ลบสำเร็จ', data.message, 'success');
                    loadLicenses();
                } else {
                    Swal.fire('เกิดข้อผิดพลาด', data.message, 'error');
                }
            } catch (error) {
                Swal.fire('Error', error.message, 'error');
            }
        }
    };

    const openModal = (license = null) => {
        if (license) {
            setIsEdit(true);
            setFormData({
                id: license.id,
                shop_id: license.shop_id,
                license_type_id: license.license_type_id,
                license_number: license.license_number,
                issue_date: license.issue_date ? license.issue_date.split('T')[0] : '',
                expiry_date: license.expiry_date ? license.expiry_date.split('T')[0] : '',
                status: license.status,
                notes: license.notes || ''
            });
        } else {
            setIsEdit(false);
            setFormData({
                id: '',
                shop_id: '',
                license_type_id: '',
                license_number: '',
                issue_date: new Date().toISOString().split('T')[0],
                expiry_date: '',
                status: 'active',
                notes: ''
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const method = isEdit ? 'PUT' : 'POST';
            const res = await fetch('/api/licenses', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();

            if (data.success) {
                setShowModal(false);
                Swal.fire('บันทึกสำเร็จ', data.message, 'success');
                loadLicenses();
            } else {
                Swal.fire('Error', data.message, 'error');
            }
        } catch (error) {
            Swal.fire('Error', error.message, 'error');
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const getStatusBadge = (status) => {
        const map = {
            active: 'badge-active',
            pending: 'badge-pending',
            expired: 'badge-expired',
            suspended: 'badge-suspended',
            revoked: 'badge-revoked'
        };
        const text = {
            active: 'ปกติ',
            pending: 'กำลังดำเนินการ',
            expired: 'หมดอายุ',
            suspended: 'ถูกพักใช้',
            revoked: 'ถูกเพิกถอน'
        };
        return <span className={`badge ${map[status] || ''}`}>{text[status] || status}</span>;
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('th-TH', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    return (
        <>
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title"><i className="fas fa-file-alt"></i> รายการใบอนุญาต</h3>
                    <button className="btn btn-primary btn-sm" onClick={() => openModal()}>
                        <i className="fas fa-plus"></i> เพิ่มใบอนุญาต
                    </button>
                </div>
                <div className="card-body">
                    <div className="filter-row" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem', alignItems: 'center' }}>
                        <input
                            type="text"
                            placeholder="ค้นหา..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPagination(prev => ({ ...prev, page: 1 })); }}
                        />
                        <select
                            value={filterType}
                            onChange={(e) => { setFilterType(e.target.value); setPagination(prev => ({ ...prev, page: 1 })); }}
                            style={{ minWidth: '150px' }}
                        >
                            <option value="">ทุกประเภท</option>
                            {typesList.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                        <select
                            value={filterStatus}
                            onChange={(e) => { setFilterStatus(e.target.value); setPagination(prev => ({ ...prev, page: 1 })); }}
                            style={{ minWidth: '150px' }}
                        >
                            <option value="">ทุกสถานะ</option>
                            <option value="active">ปกติ</option>
                            <option value="pending">กำลังดำเนินการ</option>
                            <option value="expired">หมดอายุ</option>
                            <option value="suspended">ถูกพักใช้</option>
                            <option value="revoked">ถูกเพิกถอน</option>
                        </select>
                    </div>

                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>ร้านค้า</th>
                                    <th>ประเภท</th>
                                    <th className="text-center">วันออก</th>
                                    <th className="text-center">หมดอายุ</th>
                                    <th className="text-center">สถานะ</th>
                                    <th className="text-center" style={{ width: '150px' }}>จัดการ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="6" className="text-center">กำลังโหลด...</td></tr>
                                ) : licenses.length === 0 ? (
                                    <tr><td colSpan="6" className="text-center">ไม่พบข้อมูล</td></tr>
                                ) : (
                                    licenses.map(l => (
                                        <tr key={l.id}>
                                            <td>{l.shop_name}</td>
                                            <td>{l.type_name}</td>
                                            <td className="text-center">{formatDate(l.issue_date)}</td>
                                            <td className="text-center">{formatDate(l.expiry_date)}</td>
                                            <td className="text-center">{getStatusBadge(l.status)}</td>
                                            <td className="text-center">
                                                <div className="action-buttons">
                                                    <button className="btn btn-secondary btn-icon" onClick={() => openModal(l)}>
                                                        <i className="fas fa-edit"></i>
                                                    </button>
                                                    <button className="btn btn-danger btn-icon" onClick={() => handleDelete(l.id)}>
                                                        <i className="fas fa-trash"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Simple Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="pagination" style={{ marginTop: '1rem', display: 'flex', justifyContent: 'end', gap: '0.5rem' }}>
                            <button
                                className="btn btn-secondary btn-sm"
                                disabled={pagination.page === 1}
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                            >
                                ก่อนหน้า
                            </button>
                            <span style={{ display: 'flex', alignItems: 'center' }}>
                                หน้า {pagination.page} / {pagination.totalPages}
                            </span>
                            <button
                                className="btn btn-secondary btn-sm"
                                disabled={pagination.page === pagination.totalPages}
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                            >
                                ถัดไป
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay show" style={{ display: 'flex' }} onClick={(e) => {
                    if (e.target === e.currentTarget) setShowModal(false);
                }}>
                    <div className="modal show" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">{isEdit ? 'แก้ไขใบอนุญาต' : 'เพิ่มใบอนุญาตใหม่'}</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-body">
                            <form id="licenseForm" onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label>ร้านค้า *</label>
                                    <select name="shop_id" value={formData.shop_id} onChange={handleChange} required>
                                        <option value="">-- เลือกร้านค้า --</option>
                                        {shopsList.map(s => (
                                            <option key={s.id} value={s.id}>{s.shop_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>ประเภทใบอนุญาต *</label>
                                    <select name="license_type_id" value={formData.license_type_id} onChange={handleChange} required>
                                        <option value="">-- เลือกประเภท --</option>
                                        {typesList.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>เลขที่ใบอนุญาต *</label>
                                    <input type="text" name="license_number" value={formData.license_number} onChange={handleChange} required />
                                </div>
                                <div className="form-group">
                                    <label>วันที่ออก *</label>
                                    <input type="date" name="issue_date" value={formData.issue_date} onChange={handleChange} required />
                                </div>
                                <div className="form-group">
                                    <label>วันหมดอายุ *</label>
                                    <input type="date" name="expiry_date" value={formData.expiry_date} onChange={handleChange} required />
                                </div>
                                <div className="form-group">
                                    <label>สถานะ</label>
                                    <select name="status" value={formData.status} onChange={handleChange}>
                                        <option value="active">ปกติ</option>
                                        <option value="pending">กำลังดำเนินการ</option>
                                        <option value="expired">หมดอายุ</option>
                                        <option value="suspended">ถูกพักใช้</option>
                                        <option value="revoked">ถูกเพิกถอน</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>หมายเหตุ</label>
                                    <textarea name="notes" rows="2" value={formData.notes} onChange={handleChange}></textarea>
                                </div>
                                <div className="modal-footer" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>ยกเลิก</button>
                                    <button type="submit" className="btn btn-primary">บันทึก</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
