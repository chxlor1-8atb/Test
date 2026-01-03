'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePagination, useDropdownData } from '@/hooks';
import { STATUS_OPTIONS, STATUS_FILTER_OPTIONS, API_ENDPOINTS } from '@/constants';
import { formatThaiDate, toInputDateFormat, getTodayDateString } from '@/utils/formatters';
import { showSuccess, showError, confirmDelete } from '@/utils/alerts';

// UI Components
import CustomSelect from '@/components/ui/CustomSelect';
import DatePicker from '@/components/ui/DatePicker';
import Pagination from '@/components/ui/Pagination';
import EditableCell from '@/components/ui/EditableCell';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import FilterRow, { SearchInput } from '@/components/ui/FilterRow';
import TableSkeleton from '@/components/ui/TableSkeleton';

// Initial form state - extracted constant
const INITIAL_FORM_DATA = {
    id: '',
    shop_id: '',
    license_type_id: '',
    license_number: '',
    issue_date: '',
    expiry_date: '',
    status: 'active',
    notes: ''
};

/**
 * LicensesPage Component
 * Manages license listing with CRUD operations
 */
export default function LicensesPage() {
    // State management using custom hooks
    const pagination = usePagination(20);
    const { shopOptions, typeOptions, loading: dropdownsLoading } = useDropdownData();

    // Local state
    const [licenses, setLicenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState(INITIAL_FORM_DATA);

    // Fetch licenses when dependencies change
    useEffect(() => {
        fetchLicenses();
    }, [pagination.page, pagination.limit, search, filterType, filterStatus]);

    /**
     * Fetches licenses from API
     */
    const fetchLicenses = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: pagination.page,
                limit: pagination.limit,
                search,
                license_type: filterType,
                status: filterStatus
            });

            const response = await fetch(`${API_ENDPOINTS.LICENSES}?${params}`);
            const data = await response.json();

            if (data.success) {
                setLicenses(data.licenses);
                pagination.updateFromResponse(data.pagination);
            }
        } catch (error) {
            console.error('Failed to fetch licenses:', error);
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit, search, filterType, filterStatus]);

    /**
     * Handles inline field updates
     */
    const handleInlineUpdate = async (licenseId, field, value) => {
        const license = licenses.find(l => l.id === licenseId);
        if (!license) return;

        const updateData = {
            id: licenseId,
            shop_id: license.shop_id,
            license_type_id: license.license_type_id,
            license_number: license.license_number,
            issue_date: toInputDateFormat(license.issue_date),
            expiry_date: toInputDateFormat(license.expiry_date),
            status: license.status,
            notes: license.notes || '',
            [field]: value
        };

        try {
            const response = await fetch(API_ENDPOINTS.LICENSES, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });
            const data = await response.json();

            if (data.success) {
                fetchLicenses(); // Reload to get updated display names
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            showError(error.message);
            throw error;
        }
    };

    /**
     * Handles license deletion
     */
    const handleDelete = async (id) => {
        const confirmed = await confirmDelete('ข้อมูลใบอนุญาต');
        if (!confirmed) return;

        try {
            const response = await fetch(`${API_ENDPOINTS.LICENSES}?id=${id}`, {
                method: 'DELETE'
            });
            const data = await response.json();

            if (data.success) {
                showSuccess(data.message);
                fetchLicenses();
            } else {
                showError(data.message);
            }
        } catch (error) {
            showError(error.message);
        }
    };

    /**
     * Opens modal for adding new license
     */
    const openModal = () => {
        setFormData({
            ...INITIAL_FORM_DATA,
            issue_date: getTodayDateString()
        });
        setShowModal(true);
    };

    /**
     * Handles form submission
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(API_ENDPOINTS.LICENSES, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await response.json();

            if (data.success) {
                setShowModal(false);
                showSuccess(data.message);
                fetchLicenses();
            } else {
                showError(data.message);
            }
        } catch (error) {
            showError(error.message);
        }
    };

    /**
     * Handles filter changes with page reset
     */
    const handleFilterChange = (setter) => (value) => {
        setter(value);
        pagination.resetPage();
    };

    return (
        <>
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">
                        <i className="fas fa-file-alt"></i> รายการใบอนุญาต
                    </h3>
                    <button className="btn btn-primary btn-sm" onClick={openModal}>
                        <i className="fas fa-plus"></i> เพิ่มใบอนุญาต
                    </button>
                </div>

                <div className="card-body">
                    {/* Filters */}
                    <FilterRow>
                        <SearchInput
                            value={search}
                            onChange={handleFilterChange(setSearch)}
                        />
                        <CustomSelect
                            value={filterType}
                            onChange={(e) => handleFilterChange(setFilterType)(e.target.value)}
                            options={[
                                { value: '', label: 'ทุกประเภท' },
                                ...typeOptions
                            ]}
                            placeholder="ประเภทใบอนุญาต"
                            style={{ minWidth: '200px', width: 'auto' }}
                        />
                        <CustomSelect
                            value={filterStatus}
                            onChange={(e) => handleFilterChange(setFilterStatus)(e.target.value)}
                            options={STATUS_FILTER_OPTIONS}
                            placeholder="สถานะ"
                            style={{ minWidth: '180px', width: 'auto' }}
                        />
                    </FilterRow>

                    {/* Table */}
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
                                    <TableSkeleton rows={5} />
                                ) : licenses.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="text-center">ไม่พบข้อมูล</td>
                                    </tr>
                                ) : (
                                    licenses.map(license => (
                                        <LicenseRow
                                            key={license.id}
                                            license={license}
                                            shopOptions={shopOptions}
                                            typeOptions={typeOptions}
                                            onUpdate={handleInlineUpdate}
                                            onDelete={handleDelete}
                                        />
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
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

            {/* Add License Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="เพิ่มใบอนุญาตใหม่"
            >
                <LicenseForm
                    formData={formData}
                    onChange={setFormData}
                    onSubmit={handleSubmit}
                    onCancel={() => setShowModal(false)}
                    shopOptions={shopOptions}
                    typeOptions={typeOptions}
                />
            </Modal>
        </>
    );
}

/**
 * LicenseRow Component
 * Single table row with inline editing
 */
function LicenseRow({ license, shopOptions, typeOptions, onUpdate, onDelete }) {
    return (
        <tr>
            <td>
                <EditableCell
                    value={license.shop_id}
                    displayValue={license.shop_name}
                    type="select"
                    options={shopOptions}
                    onSave={(value) => onUpdate(license.id, 'shop_id', value)}
                />
            </td>
            <td>
                <EditableCell
                    value={license.license_type_id}
                    displayValue={license.type_name}
                    type="select"
                    options={typeOptions}
                    onSave={(value) => onUpdate(license.id, 'license_type_id', value)}
                />
            </td>
            <td className="text-center">
                <EditableCell
                    value={toInputDateFormat(license.issue_date)}
                    displayValue={formatThaiDate(license.issue_date)}
                    type="date"
                    onSave={(value) => onUpdate(license.id, 'issue_date', value)}
                />
            </td>
            <td className="text-center">
                <EditableCell
                    value={toInputDateFormat(license.expiry_date)}
                    displayValue={formatThaiDate(license.expiry_date)}
                    type="date"
                    onSave={(value) => onUpdate(license.id, 'expiry_date', value)}
                />
            </td>
            <td className="text-center">
                <EditableCell
                    value={license.status}
                    displayValue={<StatusBadge status={license.status} />}
                    type="select"
                    options={STATUS_OPTIONS}
                    onSave={(value) => onUpdate(license.id, 'status', value)}
                />
            </td>
            <td className="text-center">
                <button
                    className="btn btn-danger btn-icon"
                    onClick={() => onDelete(license.id)}
                >
                    <i className="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    );
}

/**
 * LicenseForm Component
 * Form for creating new licenses
 */
function LicenseForm({ formData, onChange, onSubmit, onCancel, shopOptions, typeOptions }) {
    const handleChange = (e) => {
        onChange({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <form onSubmit={onSubmit}>
            <div className="form-group">
                <label>ร้านค้า *</label>
                <CustomSelect
                    name="shop_id"
                    value={formData.shop_id}
                    onChange={handleChange}
                    options={[
                        { value: '', label: '-- เลือกร้านค้า --' },
                        ...shopOptions
                    ]}
                    placeholder="เลือกร้านค้า"
                    searchable
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
                        ...typeOptions
                    ]}
                    placeholder="เลือกประเภท"
                    searchable
                    searchPlaceholder="ค้นหาประเภท..."
                />
            </div>

            <div className="form-group">
                <label>เลขที่ใบอนุญาต *</label>
                <input
                    type="text"
                    name="license_number"
                    value={formData.license_number}
                    onChange={handleChange}
                    required
                />
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
                    options={STATUS_OPTIONS}
                    placeholder="เลือกสถานะ"
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
