'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import Loading from '@/components/Loading';
import Pagination from '@/components/ui/Pagination';
import EditableCell from '@/components/ui/EditableCell';

export default function ShopsPage() {
    const [shops, setShops] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Modal State (only for adding new)
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        id: '',
        shop_name: '',
        owner_name: '',
        address: '',
        phone: '',
        email: '',
        notes: ''
    });

    useEffect(() => {
        loadShops();
    }, [pagination.page, search]);

    const loadShops = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: pagination.page,
                limit: pagination.limit,
                search: search
            });
            const res = await fetch(`/api/shops?${params}`);
            const data = await res.json();

            if (data.success) {
                setShops(data.shops);
                setPagination(prev => ({ ...prev, ...data.pagination }));

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
    const handleInlineUpdate = async (shopId, field, value) => {
        try {
            const shop = shops.find(s => s.id === shopId);
            const updateData = {
                id: shopId,
                shop_name: shop.shop_name,
                owner_name: shop.owner_name || '',
                address: shop.address || '',
                phone: shop.phone || '',
                email: shop.email || '',
                notes: shop.notes || '',
                [field]: value
            };

            const res = await fetch('/api/shops', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });
            const data = await res.json();

            if (data.success) {
                setShops(prev => prev.map(s =>
                    s.id === shopId ? { ...s, [field]: value } : s
                ));
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            Swal.fire('Error', error.message, 'error');
            throw error;
        }
    };

    const handleSearch = (e) => {
        setSearch(e.target.value);
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'ยืนยันการลบ?',
            text: "ข้อมูลร้านค้าจะถูกลบถาวร",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'ลบข้อมูล',
            cancelButtonText: 'ยกเลิก'
        });

        if (result.isConfirmed) {
            try {
                const res = await fetch(`/api/shops?id=${id}`, { method: 'DELETE' });
                const data = await res.json();
                if (data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'ลบสำเร็จ',
                        text: data.message,
                        timer: 1500,
                        showConfirmButton: false
                    });
                    loadShops();
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
            shop_name: '',
            owner_name: '',
            address: '',
            phone: '',
            email: '',
            notes: ''
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/shops', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();

            if (data.success) {
                setShowModal(false);
                Swal.fire({
                    icon: 'success',
                    title: 'บันทึกสำเร็จ',
                    text: data.message,
                    timer: 1500,
                    showConfirmButton: false
                });
                loadShops();
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

    return (
        <>
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">
                        <i className="fas fa-store"></i> รายการร้านค้า
                    </h3>
                    <button className="btn btn-primary btn-sm" onClick={openModal}>
                        <i className="fas fa-plus"></i> เพิ่มร้านค้า
                    </button>
                </div>
                <div className="card-body">
                    <div className="filter-row" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem', alignItems: 'center' }}>
                        <input
                            type="text"
                            placeholder="ค้นหาร้านค้า..."
                            value={search}
                            onChange={handleSearch}
                        />
                    </div>

                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>ชื่อร้าน</th>
                                    <th>เจ้าของ</th>
                                    <th>โทรศัพท์</th>
                                    <th className="text-center">ใบอนุญาต</th>
                                    <th className="text-center" style={{ width: '80px' }}>ลบ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    [...Array(5)].map((_, i) => (
                                        <tr key={`skeleton-${i}`}>
                                            <td><div className="skeleton-cell skeleton-animate" style={{ height: '1rem', width: '80%' }}></div></td>
                                            <td><div className="skeleton-cell skeleton-animate" style={{ height: '1rem', width: '70%' }}></div></td>
                                            <td><div className="skeleton-cell skeleton-animate" style={{ height: '1rem', width: '60%' }}></div></td>
                                            <td className="text-center"><div className="skeleton-cell skeleton-animate" style={{ height: '1.5rem', width: '2rem', margin: '0 auto', borderRadius: '0.25rem' }}></div></td>
                                            <td className="text-center"><div className="skeleton-cell skeleton-animate" style={{ height: '2rem', width: '2rem', margin: '0 auto', borderRadius: '0.5rem' }}></div></td>
                                        </tr>
                                    ))
                                ) : shops.length === 0 ? (
                                    <tr><td colSpan="5" className="text-center">ไม่พบข้อมูล</td></tr>
                                ) : (
                                    shops.map(shop => (
                                        <tr key={shop.id}>
                                            <td>
                                                <EditableCell
                                                    value={shop.shop_name}
                                                    type="text"
                                                    onSave={(value) => handleInlineUpdate(shop.id, 'shop_name', value)}
                                                />
                                            </td>
                                            <td>
                                                <EditableCell
                                                    value={shop.owner_name || ''}
                                                    displayValue={shop.owner_name || '-'}
                                                    type="text"
                                                    placeholder="ชื่อเจ้าของ"
                                                    onSave={(value) => handleInlineUpdate(shop.id, 'owner_name', value)}
                                                />
                                            </td>
                                            <td>
                                                <EditableCell
                                                    value={shop.phone || ''}
                                                    displayValue={shop.phone || '-'}
                                                    type="text"
                                                    placeholder="เบอร์โทร"
                                                    onSave={(value) => handleInlineUpdate(shop.id, 'phone', value)}
                                                />
                                            </td>
                                            <td className="text-center">
                                                <span className="badge badge-active">{shop.license_count}</span>
                                            </td>
                                            <td className="text-center">
                                                <button className="btn btn-danger btn-icon" onClick={() => handleDelete(shop.id)}>
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
                            <h3 className="modal-title">เพิ่มร้านค้าใหม่</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-body">
                            <form id="shopForm" onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label>ชื่อร้านค้า *</label>
                                    <input
                                        type="text"
                                        name="shop_name"
                                        value={formData.shop_name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>ชื่อเจ้าของ</label>
                                    <input
                                        type="text"
                                        name="owner_name"
                                        value={formData.owner_name}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>ที่อยู่</label>
                                    <textarea
                                        name="address"
                                        rows="2"
                                        value={formData.address}
                                        onChange={handleChange}
                                    ></textarea>
                                </div>
                                <div className="form-group">
                                    <label>โทรศัพท์</label>
                                    <input
                                        type="text"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>อีเมล</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>หมายเหตุ</label>
                                    <textarea
                                        name="notes"
                                        rows="2"
                                        value={formData.notes}
                                        onChange={handleChange}
                                    ></textarea>
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
