'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import Loading from '@/components/Loading';

export default function LicenseTypesPage() {
    const [types, setTypes] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal
    const [showModal, setShowModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        description: '',
        validity_days: 365
    });

    useEffect(() => {
        loadTypes();
    }, []);

    const loadTypes = async () => {
        try {
            const res = await fetch('/api/license-types');
            const data = await res.json();
            if (data.success) {
                setTypes(data.types || []);
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
            text: "ข้อมูลนี้จะถูกลบถาวร",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'ลบข้อมูล',
            cancelButtonText: 'ยกเลิก'
        });

        if (result.isConfirmed) {
            try {
                const res = await fetch(`/api/license-types?id=${id}`, { method: 'DELETE' });
                const data = await res.json();
                if (data.success) {
                    Swal.fire('ลบสำเร็จ', data.message, 'success');
                    loadTypes();
                } else {
                    Swal.fire('ลบไม่ได้', data.message, 'error');
                }
            } catch (error) {
                Swal.fire('Error', error.message, 'error');
            }
        }
    };

    const openModal = (type = null) => {
        if (type) {
            setIsEdit(true);
            setFormData({
                id: type.id,
                name: type.name || type.type_name, // Handle both just in case
                description: type.description || '',
                validity_days: type.validity_days || 365
            });
        } else {
            setIsEdit(false);
            setFormData({
                id: '',
                name: '',
                description: '',
                validity_days: 365
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const method = isEdit ? 'PUT' : 'POST';
            const res = await fetch('/api/license-types', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();

            if (data.success) {
                setShowModal(false);
                Swal.fire('บันทึกสำเร็จ', data.message, 'success');
                loadTypes();
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

    const totalTypes = types.length;
    const totalLicenses = types.reduce((acc, curr) => acc + parseInt(curr.license_count || 0), 0);
    const activeTypes = types.filter(t => parseInt(t.license_count) > 0).length;

    return (
        <>
            <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                <div className="stat-card">
                    <div className="stat-icon primary"><i className="fas fa-tags"></i></div>
                    <div className="stat-content">
                        <div className="stat-value">{totalTypes}</div>
                        <div className="stat-label">ประเภททั้งหมด</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon success"><i className="fas fa-check-circle"></i></div>
                    <div className="stat-content">
                        <div className="stat-value">{activeTypes}</div>
                        <div className="stat-label">ประเภทที่ใช้งาน</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon info"><i className="fas fa-file-alt"></i></div>
                    <div className="stat-content">
                        <div className="stat-value">{totalLicenses}</div>
                        <div className="stat-label">ใบอนุญาตที่ผูก</div>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3 className="card-title"><i className="fas fa-tags"></i> ประเภทใบอนุญาต</h3>
                    <button className="btn btn-primary btn-sm" onClick={() => openModal()}>
                        <i className="fas fa-plus"></i> เพิ่มประเภท
                    </button>
                </div>
                <div className="card-body">
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>ชื่อประเภท</th>
                                    <th>คำอธิบาย</th>
                                    <th>อายุ (วัน)</th>
                                    <th>ใบอนุญาต</th>
                                    <th className="text-center" style={{ width: '150px' }}>จัดการ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="5" className="text-center">กำลังโหลด...</td></tr>
                                ) : types.length === 0 ? (
                                    <tr><td colSpan="5" className="text-center">ไม่พบข้อมูล</td></tr>
                                ) : (
                                    types.map(t => (
                                        <tr key={t.id}>
                                            <td><strong>{t.name || t.type_name}</strong></td>
                                            <td>{t.description || '-'}</td>
                                            <td>{t.validity_days} วัน</td>
                                            <td>
                                                <span className="badge badge-active">{t.license_count}</span>
                                            </td>
                                            <td className="text-center">
                                                <div className="action-buttons">
                                                    <button className="btn btn-secondary btn-icon" onClick={() => openModal(t)}>
                                                        <i className="fas fa-edit"></i>
                                                    </button>
                                                    {parseInt(t.license_count) === 0 && (
                                                        <button className="btn btn-danger btn-icon" onClick={() => handleDelete(t.id)}>
                                                            <i className="fas fa-trash"></i>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay show" style={{ display: 'flex' }} onClick={(e) => {
                    if (e.target === e.currentTarget) setShowModal(false);
                }}>
                    <div className="modal show" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">{isEdit ? 'แก้ไขประเภท' : 'เพิ่มประเภทใหม่'}</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="modal-body">
                            <form id="typeForm" onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label>ชื่อประเภท *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>คำอธิบาย</label>
                                    <textarea
                                        name="description"
                                        rows="2"
                                        value={formData.description}
                                        onChange={handleChange}
                                    ></textarea>
                                </div>
                                <div className="form-group">
                                    <label>อายุใบอนุญาต (วัน)</label>
                                    <input
                                        type="number"
                                        name="validity_days"
                                        value={formData.validity_days}
                                        onChange={handleChange}
                                        min="1"
                                        required
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
