'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import Loading from '@/components/Loading';

export default function NotificationsPage() {
    const [settings, setSettings] = useState({
        telegram_bot_token: '',
        telegram_chat_id: '',
        days_before_expiry: 30,
        is_active: false
    });
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [settingsRes, logsRes] = await Promise.all([
                fetch('/api/notifications?action=settings'),
                fetch('/api/notifications?action=logs')
            ]);

            const settingsData = await settingsRes.json();
            const logsData = await logsRes.json();

            if (settingsData.success) {
                setSettings(settingsData.settings);
            }
            if (logsData.success) {
                setLogs(logsData.logs);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            Swal.fire('Error', 'ไม่สามารถโหลดข้อมูลได้', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const saveSettings = async () => {
        try {
            const res = await fetch('/api/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'save_settings',
                    ...settings,
                    is_active: settings.is_active ? 1 : 0
                })
            });
            const data = await res.json();
            if (data.success) {
                Swal.fire('Success', data.message, 'success');
                fetchData();
            } else {
                Swal.fire('Error', data.message, 'error');
            }
        } catch (error) {
            Swal.fire('Error', 'บันทึกไม่สำเร็จ', 'error');
        }
    };

    const testNotification = async () => {
        try {
            Swal.showLoading();
            const res = await fetch('/api/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'test' })
            });
            const data = await res.json();
            Swal.close();
            if (data.success) {
                Swal.fire('Success', data.message, 'success');
            } else {
                Swal.fire('Error', data.message, 'error');
            }
        } catch (error) {
            Swal.close();
            Swal.fire('Error', 'การทดสอบล้มเหลว', 'error');
        }
    };

    const sendExpiryNotifications = async () => {
        const result = await Swal.fire({
            title: 'ยืนยันการส่ง?',
            text: "ต้องการส่งการแจ้งเตือนใบอนุญาตใกล้หมดอายุทันทีหรือไม่?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'ส่งทันที',
            cancelButtonText: 'ยกเลิก'
        });

        if (result.isConfirmed) {
            try {
                Swal.showLoading();
                const res = await fetch('/api/notifications', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'check-expiring' })
                });
                const data = await res.json();
                Swal.close();
                if (data.success) {
                    Swal.fire('Success', data.message, 'success');
                    fetchData(); // Reload logs
                } else {
                    Swal.fire('Error', data.message, 'error');
                }
            } catch (error) {
                Swal.close();
                Swal.fire('Error', 'การส่งล้มเหลว', 'error');
            }
        }
    };

    if (loading) {
        return <div className="loading"><i className="fas fa-spinner fa-spin"></i> กำลังโหลด...</div>;
    }

    return (
        <div className="content-container">
            <div className="card mb-4">
                <div className="card-header">
                    <h3 className="card-title"><i className="fas fa-bell"></i> ตั้งค่าการแจ้งเตือน Telegram</h3>
                </div>
                <div className="card-body">
                    <form onSubmit={(e) => e.preventDefault()}>
                        <div className="form-group">
                            <label>Telegram Bot Token *</label>
                            <input
                                type="text"
                                name="telegram_bot_token"
                                value={settings.telegram_bot_token || ''}
                                onChange={handleInputChange}
                                placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                            />
                            <small className="text-muted d-block mt-1">Token จาก @BotFather</small>
                        </div>
                        <div className="form-group">
                            <label>Chat ID *</label>
                            <input
                                type="text"
                                name="telegram_chat_id"
                                value={settings.telegram_chat_id || ''}
                                onChange={handleInputChange}
                                placeholder="-1001234567890"
                            />
                            <small className="text-muted d-block mt-1">ID ของกลุ่มหรือผู้ใช้ที่ต้องการรับแจ้งเตือน</small>
                        </div>
                        <div className="form-group">
                            <label>แจ้งเตือนก่อนหมดอายุ (วัน)</label>
                            <input
                                type="number"
                                name="days_before_expiry"
                                value={settings.days_before_expiry}
                                onChange={handleInputChange}
                                min="1"
                                max="365"
                            />
                        </div>
                        <div className="form-group">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    name="is_active"
                                    checked={!!settings.is_active}
                                    onChange={handleInputChange}
                                    style={{ width: '20px', height: '20px' }}
                                />
                                <span>เปิดใช้งานการแจ้งเตือนอัตโนมัติ</span>
                            </label>
                        </div>
                        <div className="form-actions" style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                            <button type="button" className="btn btn-primary" onClick={saveSettings}>
                                <i className="fas fa-save"></i> บันทึก
                            </button>
                            <button type="button" className="btn btn-secondary" onClick={testNotification}>
                                <i className="fas fa-paper-plane"></i> ทดสอบ
                            </button>
                            <button type="button" className="btn btn-warning" onClick={sendExpiryNotifications}>
                                <i className="fas fa-radiation"></i> ส่งแจ้งเตือนทันที
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3 className="card-title"><i className="fas fa-history"></i> ประวัติการแจ้งเตือน</h3>
                </div>
                <div className="card-body">
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>วันเวลา</th>
                                    <th>ร้านค้า</th>
                                    <th>สถานะ</th>
                                    <th>ข้อความ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.length === 0 ? (
                                    <tr><td colSpan="4" className="text-center p-4">ไม่พบประวัติการแจ้งเตือน</td></tr>
                                ) : (
                                    logs.map(log => (
                                        <tr key={log.id}>
                                            <td>{new Date(log.sent_at).toLocaleString('th-TH')}</td>
                                            <td>{log.shop_name || '-'}</td>
                                            <td>
                                                <span className={`badge ${log.status === 'success' ? 'badge-active' : 'badge-expired'}`}>
                                                    {log.status}
                                                </span>
                                            </td>
                                            <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.message}>
                                                {log.message}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
