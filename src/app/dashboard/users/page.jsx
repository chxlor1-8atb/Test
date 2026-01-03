'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import CustomSelect from '@/components/ui/CustomSelect';
import Loading from '@/components/Loading';
import Pagination from '@/components/ui/Pagination';

export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null); // In real app, get from context/session

    // Modal
    const [showModal, setShowModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [formData, setFormData] = useState({
        id: '',
        username: '',
        full_name: '',
        password: '',
        role: 'staff'
    });

    useEffect(() => {
        // Fetch current user info for checking self-deletion prevention (optional but good UI)
        // For now, assume admin access verified by layout or middleware
        loadUsers();
    }, [pagination.page]);

    const loadUsers = async () => {
        try {
            const params = new URLSearchParams({
                page: pagination.page,
                limit: pagination.limit
            });
            const res = await fetch(`/api/users?${params}`);
            const data = await res.json();
            if (data.success) {
                setUsers(data.users || []);
                setPagination(prev => ({ ...prev, ...data.pagination }));

                // Auto-correct page if out of bounds
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

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'ยืนยันการลบ?',
            text: "ผู้ใช้งานจะถูกลบถาวร",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'ลบผู้ใช้',
            cancelButtonText: 'ยกเลิก'
        });

        if (result.isConfirmed) {
            try {
                const res = await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
                const data = await res.json();
                if (data.success) {
                    Swal.fire('ลบสำเร็จ', data.message, 'success');
                    loadUsers();
                } else {
                    Swal.fire('เกิดข้อผิดพลาด', data.message, 'error');
                }
            } catch (error) {
                Swal.fire('Error', error.message, 'error');
            }
        }
    };

    const openModal = (user = null) => {
        if (user) {
            setIsEdit(true);
            setFormData({
                id: user.id,
                username: user.username,
                full_name: user.full_name || '',
                password: '', // Don't show password
                role: user.role
            });
        } else {
            setIsEdit(false);
            setFormData({
                id: '',
                username: '',
                full_name: '',
                password: '',
                role: 'staff'
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const method = isEdit ? 'PUT' : 'POST';
            const res = await fetch('/api/users', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();

            if (data.success) {
                setShowModal(false);
                Swal.fire('บันทึกสำเร็จ', data.message, 'success');
                loadUsers();
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

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('th-TH', {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <>
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title"><i className="fas fa-users"></i> รายการผู้ใช้งาน</h3>
                    <button className="btn btn-primary btn-sm" onClick={() => openModal()}>
                        <i className="fas fa-plus"></i> เพิ่มผู้ใช้
                    </button>
                </div>
                <div className="card-body">
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>ชื่อผู้ใช้</th>
                                    <th>ชื่อ-นามสกุล</th>
                                    <th>บทบาท</th>
                                    <th>วันที่สร้าง</th>
                                    <th className="text-center" style={{ width: '150px' }}>จัดการ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    [...Array(5)].map((_, i) => (
                                        <tr key={`skeleton-${i}`}>
                                            <td><div className="skeleton-cell skeleton-animate" style={{ height: '1rem', width: '70%' }}></div></td>
                                            <td><div className="skeleton-cell skeleton-animate" style={{ height: '1rem', width: '80%' }}></div></td>
                                            <td><div className="skeleton-cell skeleton-animate" style={{ height: '1.5rem', width: '3rem', borderRadius: '9999px' }}></div></td>
                                            <td><div className="skeleton-cell skeleton-animate" style={{ height: '1rem', width: '60%' }}></div></td>
                                            <td className="text-center"><div className="skeleton-cell skeleton-animate" style={{ height: '2rem', width: '4rem', margin: '0 auto', borderRadius: '0.5rem' }}></div></td>
                                        </tr>
                                    ))
                                ) : users.length === 0 ? (
                                    <tr><td colSpan="5" className="text-center">ไม่พบข้อมูล</td></tr>
                                ) : (
                                    users.map(u => (
                                        <tr key={u.id}>
                                            <td>{u.username}</td>
                                            <td>{u.full_name}</td>
                                            <td>
                                                <span className={`badge ${u.role === 'admin' ? 'badge-admin' : 'badge-staff'}`}
                                                    style={{
                                                        backgroundColor: u.role === 'admin' ? 'rgba(124, 58, 237, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                                                        color: u.role === 'admin' ? '#7c3aed' : '#3b82f6',
                                                        border: `1px solid ${u.role === 'admin' ? 'rgba(124, 58, 237, 0.2)' : 'rgba(59, 130, 246, 0.2)'}`,
                                                        padding: '0.25rem 0.75rem',
                                                        borderRadius: '9999px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 600
                                                    }}>
                                                    {u.role === 'admin' ? 'ผู้ดูแลระบบ' : 'เจ้าหน้าที่'}
                                                </span>
                                            </td>
                                            <td>{formatDate(u.created_at)}</td>
                                            <td className="text-center">
                                                <div className="action-buttons">
                                                    <button className="btn btn-secondary btn-icon" onClick={() => openModal(u)}>
                                                        <i className="fas fa-edit"></i>
                                                    </button>
                                                    <button className="btn btn-danger btn-icon" onClick={() => handleDelete(u.id)}>
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

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay show" style={{ display: 'flex' }} onClick={(e) => {
                    if (e.target === e.currentTarget) setShowModal(false);
                }}>
                    <div className="modal show" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">{isEdit ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'}</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-body">
                            <form id="userForm" onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label>ชื่อผู้ใช้ *</label>
                                    <input
                                        type="text"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        required
                                        readOnly={isEdit}
                                        style={isEdit ? { backgroundColor: '#f3f4f6', cursor: 'not-allowed' } : {}}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>ชื่อ-นามสกุล *</label>
                                    <input
                                        type="text"
                                        name="full_name"
                                        value={formData.full_name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>รหัสผ่าน {isEdit ? '(เว้นว่างถ้าไม่ต้องการเปลี่ยน)' : '*'}</label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required={!isEdit}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>บทบาท *</label>
                                    <CustomSelect
                                        name="role"
                                        value={formData.role}
                                        onChange={handleChange}
                                        options={[
                                            { value: 'staff', label: 'เจ้าหน้าที่' },
                                            { value: 'admin', label: 'ผู้ดูแลระบบ' }
                                        ]}
                                        placeholder="เลือกบทบาท"
                                    />
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
