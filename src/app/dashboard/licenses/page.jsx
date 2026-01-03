'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import CustomSelect from '@/components/ui/CustomSelect';
import Loading from '@/components/Loading';
import DatePicker from '@/components/ui/DatePicker';
import Pagination from '@/components/ui/Pagination';
import EditableCell from '@/components/ui/EditableCell';

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

                // Auto-correct page if out of bounds (e.g. after deleting items)
                if (data.pagination.page > data.pagination.totalPages && data.pagination.totalPages > 0) {
                    setPagination(prev => ({ ...prev, page: data.pagination.totalPages }));
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Inline update function
    const handleInlineUpdate = async (licenseId, field, value) => {
        try {
            const license = licenses.find(l => l.id === licenseId);
            const updateData = {
                id: licenseId,
                shop_id: license.shop_id,
                license_type_id: license.license_type_id,
                license_number: license.license_number,
                issue_date: license.issue_date ? license.issue_date.split('T')[0] : '',
                expiry_date: license.expiry_date ? license.expiry_date.split('T')[0] : '',
                status: license.status,
                notes: license.notes || '',
                [field]: value
            };

            const res = await fetch('/api/licenses', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });
            const data = await res.json();

            if (data.success) {
                // Update local state
                setLicenses(prev => prev.map(l =>
                    l.id === licenseId ? { ...l, [field]: value } : l
                ));
                // Reload to get updated display names
                loadLicenses();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            Swal.fire('Error', error.message, 'error');
            throw error;
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

    const openModal = () => {
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
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/licenses', {
                method: 'POST',
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

    const statusOptions = [
        { value: 'active', label: 'ปกติ' },
        { value: 'pending', label: 'กำลังดำเนินการ' },
        { value: 'expired', label: 'หมดอายุ' },
        { value: 'suspended', label: 'ถูกพักใช้' },
        { value: 'revoked', label: 'ถูกเพิกถอน' }
    ];

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
                    <button className="btn btn-primary btn-sm" onClick={openModal}>
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
                        <CustomSelect
                            value={filterType}
                            onChange={(e) => { setFilterType(e.target.value); setPagination(prev => ({ ...prev, page: 1 })); }}
                            options={[
                                { value: '', label: 'ทุกประเภท' },
                                ...typesList.map(t => ({ value: t.id, label: t.name }))
                            ]}
                            placeholder="ประเภทใบอนุญาต"
                            style={{ minWidth: '200px', width: 'auto' }}
                        />
                        <CustomSelect
                            value={filterStatus}
                            onChange={(e) => { setFilterStatus(e.target.value); setPagination(prev => ({ ...prev, page: 1 })); }}
                            options={[
                                { value: '', label: 'ทุกสถานะ' },
                                { value: 'active', label: 'ปกติ' },
                                { value: 'pending', label: 'กำลังดำเนินการ' },
                                { value: 'expired', label: 'หมดอายุ' },
                                { value: 'suspended', label: 'ถูกพักใช้' },
                                { value: 'revoked', label: 'ถูกเพิกถอน' }
                            ]}
                            placeholder="สถานะ"
                            style={{ minWidth: '180px', width: 'auto' }}
                        />
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
                                    <th className="text-center" style={{ width: '80px' }}>ลบ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    [...Array(5)].map((_, i) => (
                                        <tr key={`skeleton-${i}`}>
                                            <td><div className="skeleton-cell skeleton-animate" style={{ height: '1rem', width: '80%' }}></div></td>
                                            <td><div className="skeleton-cell skeleton-animate" style={{ height: '1rem', width: '70%' }}></div></td>
                                            <td className="text-center"><div className="skeleton-cell skeleton-animate" style={{ height: '1rem', width: '60%', margin: '0 auto' }}></div></td>
                                            <td className="text-center"><div className="skeleton-cell skeleton-animate" style={{ height: '1rem', width: '60%', margin: '0 auto' }}></div></td>
                                            <td className="text-center"><div className="skeleton-cell skeleton-animate" style={{ height: '1.5rem', width: '4rem', margin: '0 auto', borderRadius: '9999px' }}></div></td>
                                            <td className="text-center"><div className="skeleton-cell skeleton-animate" style={{ height: '2rem', width: '2rem', margin: '0 auto', borderRadius: '0.5rem' }}></div></td>
                                        </tr>
                                    ))
                                ) : licenses.length === 0 ? (
                                    <tr><td colSpan="6" className="text-center">ไม่พบข้อมูล</td></tr>
                                ) : (
                                    licenses.map(l => (
                                        <tr key={l.id}>
                                            <td>
                                                <EditableCell
                                                    value={l.shop_id}
                                                    displayValue={l.shop_name}
                                                    type="select"
                                                    options={shopsList.map(s => ({ value: s.id, label: s.shop_name }))}
                                                    onSave={(value) => handleInlineUpdate(l.id, 'shop_id', value)}
                                                />
                                            </td>
                                            <td>
                                                <EditableCell
                                                    value={l.license_type_id}
                                                    displayValue={l.type_name}
                                                    type="select"
                                                    options={typesList.map(t => ({ value: t.id, label: t.name }))}
                                                    onSave={(value) => handleInlineUpdate(l.id, 'license_type_id', value)}
                                                />
                                            </td>
                                            <td className="text-center">
                                                <EditableCell
                                                    value={l.issue_date ? l.issue_date.split('T')[0] : ''}
                                                    displayValue={formatDate(l.issue_date)}
                                                    type="date"
                                                    onSave={(value) => handleInlineUpdate(l.id, 'issue_date', value)}
                                                />
                                            </td>
                                            <td className="text-center">
                                                <EditableCell
                                                    value={l.expiry_date ? l.expiry_date.split('T')[0] : ''}
                                                    displayValue={formatDate(l.expiry_date)}
                                                    type="date"
                                                    onSave={(value) => handleInlineUpdate(l.id, 'expiry_date', value)}
                                                />
                                            </td>
                                            <td className="text-center">
                                                <EditableCell
                                                    value={l.status}
                                                    displayValue={getStatusBadge(l.status)}
                                                    type="select"
                                                    options={statusOptions}
                                                    onSave={(value) => handleInlineUpdate(l.id, 'status', value)}
                                                />
                                            </td>
                                            <td className="text-center">
                                                <button className="btn btn-danger btn-icon" onClick={() => handleDelete(l.id)}>
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Modern Pagination */}
                    <Pagination
                        currentPage={pagination.page}
                        totalPages={pagination.totalPages}
                        totalItems={pagination.total}
                        itemsPerPage={pagination.limit}
                        onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
                        onItemsPerPageChange={(limit) => setPagination(prev => ({ ...prev, limit, page: 1 }))}
                        showItemsPerPage={true}
                        showPageJump={true}
                        showTotalInfo={true}
                    />
                </div>
            </div>

            {/* Modal - Only for Adding New */}
            {showModal && (
                <div className="modal-overlay show" style={{ display: 'flex' }} onClick={(e) => {
                    if (e.target === e.currentTarget) setShowModal(false);
                }}>
                    <div className="modal show" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">เพิ่มใบอนุญาตใหม่</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-body">
                            <form id="licenseForm" onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label>ร้านค้า *</label>
                                    <CustomSelect
                                        name="shop_id"
                                        value={formData.shop_id}
                                        onChange={handleChange}
                                        options={[
                                            { value: '', label: '-- เลือกร้านค้า --' },
                                            ...shopsList.map(s => ({ value: s.id, label: s.shop_name }))
                                        ]}
                                        placeholder="เลือกร้านค้า"
                                        searchable={true}
                                        searchPlaceholder="ค้นหาร้านค้า..."
                                    />
                                </div>
                                <div className="form-group">
                                    <label>ประเภทใบอนุญาต *</label>
                                    <CustomSelect
                                        name="license_type_id"
                                        value={formData.license_type_id}
                                        onChange={handleChange}
                                        options={[
                                            { value: '', label: '-- เลือกประเภท --' },
                                            ...typesList.map(t => ({ value: t.id, label: t.name }))
                                        ]}
                                        placeholder="เลือกประเภท"
                                        searchable={true}
                                        searchPlaceholder="ค้นหาประเภท..."
                                    />
                                </div>
                                <div className="form-group">
                                    <label>เลขที่ใบอนุญาต *</label>
                                    <input type="text" name="license_number" value={formData.license_number} onChange={handleChange} required />
                                </div>
                                <div className="form-group">
                                    <label>วันที่ออก *</label>
                                    <DatePicker
                                        name="issue_date"
                                        value={formData.issue_date}
                                        onChange={handleChange}
                                        placeholder="เลือกวันที่ออก"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>วันหมดอายุ *</label>
                                    <DatePicker
                                        name="expiry_date"
                                        value={formData.expiry_date}
                                        onChange={handleChange}
                                        placeholder="เลือกวันหมดอายุ"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>สถานะ</label>
                                    <CustomSelect
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        options={statusOptions}
                                        placeholder="เลือกสถานะ"
                                    />
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
