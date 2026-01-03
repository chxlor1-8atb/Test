'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePagination } from '@/hooks';
import { API_ENDPOINTS } from '@/constants';
import { showSuccess, showError, confirmDelete } from '@/utils/alerts';

// UI Components
import Pagination from '@/components/ui/Pagination';
import EditableCell from '@/components/ui/EditableCell';
import Modal from '@/components/ui/Modal';
import FilterRow, { SearchInput } from '@/components/ui/FilterRow';
import TableSkeleton from '@/components/ui/TableSkeleton';

// Initial form state
const INITIAL_FORM_DATA = {
    id: '',
    shop_name: '',
    owner_name: '',
    address: '',
    phone: '',
    email: '',
    notes: ''
};

/**
 * ShopsPage Component
 * Manages shop listing with CRUD operations
 */
export default function ShopsPage() {
    const pagination = usePagination(20);

    // Local state
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState(INITIAL_FORM_DATA);

    // Fetch shops when dependencies change
    useEffect(() => {
        fetchShops();
    }, [pagination.page, pagination.limit, search]);

    /**
     * Fetches shops from API
     */
    const fetchShops = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: pagination.page,
                limit: pagination.limit,
                search
            });

            const response = await fetch(`${API_ENDPOINTS.SHOPS}?${params}`);
            const data = await response.json();

            if (data.success) {
                setShops(data.shops);
                pagination.updateFromResponse(data.pagination);
            }
        } catch (error) {
            console.error('Failed to fetch shops:', error);
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit, search]);

    /**
     * Handles inline field updates
     */
    const handleInlineUpdate = async (shopId, field, value) => {
        const shop = shops.find(s => s.id === shopId);
        if (!shop) return;

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

        try {
            const response = await fetch(API_ENDPOINTS.SHOPS, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });
            const data = await response.json();

            if (data.success) {
                setShops(prev => prev.map(s =>
                    s.id === shopId ? { ...s, [field]: value } : s
                ));
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            showError(error.message);
            throw error;
        }
    };

    /**
     * Handles shop deletion
     */
    const handleDelete = async (id) => {
        const confirmed = await confirmDelete('ข้อมูลร้านค้า');
        if (!confirmed) return;

        try {
            const response = await fetch(`${API_ENDPOINTS.SHOPS}?id=${id}`, {
                method: 'DELETE'
            });
            const data = await response.json();

            if (data.success) {
                showSuccess(data.message);
                fetchShops();
            } else {
                showError(data.message);
            }
        } catch (error) {
            showError(error.message);
        }
    };

    /**
     * Opens modal for adding new shop
     */
    const openModal = () => {
        setFormData(INITIAL_FORM_DATA);
        setShowModal(true);
    };

    /**
     * Handles form submission
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(API_ENDPOINTS.SHOPS, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await response.json();

            if (data.success) {
                setShowModal(false);
                showSuccess(data.message);
                fetchShops();
            } else {
                showError(data.message);
            }
        } catch (error) {
            showError(error.message);
        }
    };

    /**
     * Handles search with page reset
     */
    const handleSearch = (value) => {
        setSearch(value);
        pagination.resetPage();
    };

    // Skeleton columns definition
    const skeletonColumns = [
        { width: '30%' },
        { width: '25%' },
        { width: '20%' },
        { width: '15%', center: true },
        { width: '10%', center: true }
    ];

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
                    <FilterRow>
                        <SearchInput
                            value={search}
                            onChange={handleSearch}
                            placeholder="ค้นหาร้านค้า..."
                        />
                    </FilterRow>

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
                                    <TableSkeleton rows={5} columns={skeletonColumns} />
                                ) : shops.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="text-center">ไม่พบข้อมูล</td>
                                    </tr>
                                ) : (
                                    shops.map(shop => (
                                        <ShopRow
                                            key={shop.id}
                                            shop={shop}
                                            onUpdate={handleInlineUpdate}
                                            onDelete={handleDelete}
                                        />
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pagination
                        currentPage={pagination.page}
                        totalPages={pagination.totalPages}
                        totalItems={pagination.total}
                        itemsPerPage={pagination.limit}
                        onPageChange={pagination.setPage}
                        onItemsPerPageChange={pagination.setLimit}
                        showItemsPerPage
                        showPageJump
                        showTotalInfo
                    />
                </div>
            </div>

            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="เพิ่มร้านค้าใหม่"
            >
                <ShopForm
                    formData={formData}
                    onChange={setFormData}
                    onSubmit={handleSubmit}
                    onCancel={() => setShowModal(false)}
                />
            </Modal>
        </>
    );
}

/**
 * ShopRow Component - Single table row
 */
function ShopRow({ shop, onUpdate, onDelete }) {
    return (
        <tr>
            <td>
                <EditableCell
                    value={shop.shop_name}
                    type="text"
                    onSave={(value) => onUpdate(shop.id, 'shop_name', value)}
                />
            </td>
            <td>
                <EditableCell
                    value={shop.owner_name || ''}
                    displayValue={shop.owner_name || '-'}
                    type="text"
                    placeholder="ชื่อเจ้าของ"
                    onSave={(value) => onUpdate(shop.id, 'owner_name', value)}
                />
            </td>
            <td>
                <EditableCell
                    value={shop.phone || ''}
                    displayValue={shop.phone || '-'}
                    type="text"
                    placeholder="เบอร์โทร"
                    onSave={(value) => onUpdate(shop.id, 'phone', value)}
                />
            </td>
            <td className="text-center">
                <span className="badge badge-active">{shop.license_count}</span>
            </td>
            <td className="text-center">
                <button
                    className="btn btn-danger btn-icon"
                    onClick={() => onDelete(shop.id)}
                >
                    <i className="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    );
}

/**
 * ShopForm Component - Form for creating shops
 */
function ShopForm({ formData, onChange, onSubmit, onCancel }) {
    const handleChange = (e) => {
        onChange({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <form onSubmit={onSubmit}>
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
                />
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
                />
            </div>
            <div className="modal-footer" style={{
                marginTop: '1.5rem',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.5rem'
            }}>
                <button type="button" className="btn btn-secondary" onClick={onCancel}>
                    ยกเลิก
                </button>
                <button type="submit" className="btn btn-primary">
                    บันทึก
                </button>
            </div>
        </form>
    );
}
