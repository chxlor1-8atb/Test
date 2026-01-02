'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

export default function ExportPage() {
    const [type, setType] = useState('licenses');
    const [typesList, setTypesList] = useState([]);

    // License filters
    const [licenseType, setLicenseType] = useState('');
    const [status, setStatus] = useState('');
    const [expiryFrom, setExpiryFrom] = useState('');
    const [expiryTo, setExpiryTo] = useState('');

    useEffect(() => {
        loadDropdowns();
    }, []);

    const loadDropdowns = async () => {
        try {
            const res = await fetch('/api/license-types');
            const data = await res.json();
            if (data.success) {
                setTypesList(data.types || []);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleExport = () => {
        const params = new URLSearchParams();
        params.append('type', type);

        if (type === 'licenses') {
            if (licenseType) params.append('license_type', licenseType);
            if (status) params.append('status', status);
            if (expiryFrom) params.append('expiry_from', expiryFrom);
            if (expiryTo) params.append('expiry_to', expiryTo);
        }

        const url = `/api/export?${params.toString()}`;

        // Trigger download
        window.open(url, '_blank');

        Swal.fire({
            title: 'กำลังดาวน์โหลด...',
            text: 'ไฟล์ CSV กำลังถูกสร้างและดาวน์โหลด',
            icon: 'info',
            timer: 2000,
            showConfirmButton: false
        });
    };

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title"><i className="fas fa-file-export"></i> ส่งออกข้อมูล</h3>
            </div>
            <div className="card-body">
                <form onSubmit={(e) => { e.preventDefault(); handleExport(); }}>
                    <div className="form-group">
                        <label>เลือกประเภทข้อมูล *</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            required
                        >
                            <option value="licenses">ใบอนุญาต</option>
                            <option value="shops">ร้านค้า</option>
                            <option value="users">ผู้ใช้งาน</option>
                        </select>
                    </div>

                    {type === 'licenses' && (
                        <div className="form-group" style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '0.5rem' }}>
                            <label style={{ marginBottom: '1rem', display: 'block', fontWeight: 600 }}>ตัวกรองข้อมูล (ใบอนุญาต)</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block' }}>ประเภทใบอนุญาต</label>
                                    <select value={licenseType} onChange={(e) => setLicenseType(e.target.value)}>
                                        <option value="">ทั้งหมด</option>
                                        {typesList.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block' }}>สถานะ</label>
                                    <select value={status} onChange={(e) => setStatus(e.target.value)}>
                                        <option value="">ทั้งหมด</option>
                                        <option value="active">ปกติ</option>
                                        <option value="expired">หมดอายุ</option>
                                        <option value="pending">กำลังดำเนินการ</option>
                                        <option value="suspended">ถูกพักใช้</option>
                                        <option value="revoked">ถูกเพิกถอน</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block' }}>หมดอายุจาก</label>
                                    <input type="date" value={expiryFrom} onChange={(e) => setExpiryFrom(e.target.value)} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block' }}>หมดอายุถึง</label>
                                    <input type="date" value={expiryTo} onChange={(e) => setExpiryTo(e.target.value)} />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="form-actions" style={{ marginTop: '2rem' }}>
                        <button type="submit" className="btn btn-primary">
                            <i className="fas fa-file-csv"></i> ส่งออกเป็น CSV
                        </button>
                    </div>
                </form>
            </div>

            <div className="card" style={{ marginTop: '1.5rem', border: '1px solid var(--border-color)', boxShadow: 'none' }}>
                <div className="card-header">
                    <h3 className="card-title" style={{ fontSize: '1rem' }}><i className="fas fa-info-circle"></i> คำแนะนำ</h3>
                </div>
                <div className="card-body">
                    <ul style={{ margin: 0, paddingLeft: '1.5rem', color: 'var(--text-secondary)' }}>
                        <li>ไฟล์ CSV สามารถเปิดด้วย Microsoft Excel หรือ Google Sheets</li>
                        <li>ข้อมูลจะถูกส่งออกตามตัวกรองที่เลือก</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
