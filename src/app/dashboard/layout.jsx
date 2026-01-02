'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import Swal from 'sweetalert2';
import '../../styles/style.css';

export default function DashboardLayout({ children }) {
    const router = useRouter();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState('');
    const [expiringCount, setExpiringCount] = useState(0);

    useEffect(() => {
        const init = async () => {
            await checkAuth();
            fetchExpiringCount();
        };
        init();
        updateDateTime();
        const timer = setInterval(updateDateTime, 60000);
        return () => clearInterval(timer);
    }, []);

    const fetchExpiringCount = async () => {
        try {
            const res = await fetch('/api/dashboard?action=expiring_count');
            const data = await res.json();
            if (data.success) {
                setExpiringCount(data.count || 0);
            }
        } catch (error) {
            console.error('Failed to fetch stats', error);
        }
    };

    const updateDateTime = () => {
        const d = new Date();
        setCurrentDate(d.toLocaleDateString('th-TH', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }));
    };

    const checkAuth = async () => {
        try {
            const res = await fetch('/api/auth?action=check', {
                cache: 'no-store',
                headers: {
                    'Pragma': 'no-cache',
                    'Cache-Control': 'no-cache'
                }
            });
            const data = await res.json();
            if (!data.success) {
                router.push('/login');
                return;
            }
            setUser(data.user);
        } catch {
            router.push('/login');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        const result = await Swal.fire({
            title: 'ยืนยันการออกจากระบบ',
            text: "คุณต้องการออกจากระบบหรือไม่?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'ออกจากระบบ',
            cancelButtonText: 'ยกเลิก'
        });

        if (result.isConfirmed) {
            await fetch('/api/auth?action=logout', { method: 'POST' });
            router.push('/login');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="loading"><i className="fas fa-spinner fa-spin"></i> กำลังโหลด...</div>
            </div>
        );
    }

    if (!user) return null;

    // Helper to check active state more accurately
    const isActive = (path) => {
        if (path === '/dashboard' && pathname === '/dashboard') return true;
        if (path !== '/dashboard' && pathname.startsWith(path)) return true;
        return false;
    };

    return (
        <div className="dashboard-container">
            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? 'show' : ''}`} id="sidebar">
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <img src="/image/shop-logo.png" alt="Shop License" style={{ width: '40px', height: '40px', borderRadius: '12px' }} />
                        <span>Shop License</span>
                    </div>
                </div>
                <nav className="sidebar-nav">
                    <div className="nav-section">
                        <div className="nav-section-title">เมนูหลัก</div>
                        <Link href="/dashboard" className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}>
                            <i className="fas fa-chart-pie"></i><span>Dashboard</span>
                        </Link>
                        <Link href="/dashboard/expiring" className={`nav-link ${isActive('/dashboard/expiring') ? 'active' : ''}`}>
                            <i className="fas fa-bell"></i>
                            <span>ใบอนุญาตใกล้หมดอายุ</span>
                            {expiringCount > 0 && <span className="nav-badge" style={{ display: 'inline' }}>{expiringCount}</span>}
                        </Link>
                        <Link href="/dashboard/shops" className={`nav-link ${isActive('/dashboard/shops') ? 'active' : ''}`}>
                            <i className="fas fa-store"></i><span>ร้านค้า</span>
                        </Link>
                        <Link href="/dashboard/licenses" className={`nav-link ${isActive('/dashboard/licenses') ? 'active' : ''}`}>
                            <i className="fas fa-file-alt"></i><span>ใบอนุญาต</span>
                        </Link>
                    </div>

                    <div className="nav-section">
                        <div className="nav-section-title">จัดการระบบ</div>
                        {user.role === 'admin' && (
                            <>
                                <Link href="/dashboard/users" className={`nav-link ${isActive('/dashboard/users') ? 'active' : ''}`}>
                                    <i className="fas fa-users"></i><span>ผู้ใช้งาน</span>
                                </Link>
                                <Link href="/dashboard/license-types" className={`nav-link ${isActive('/dashboard/license-types') ? 'active' : ''}`}>
                                    <i className="fas fa-tags"></i><span>ประเภทใบอนุญาต</span>
                                </Link>
                            </>
                        )}
                        <Link href="/dashboard/notifications" className={`nav-link ${isActive('/dashboard/notifications') ? 'active' : ''}`}>
                            <i className="fas fa-bell"></i><span>การแจ้งเตือน</span>
                        </Link>
                        {user.role === 'admin' && (
                            <Link href="/dashboard/settings/custom-fields" className={`nav-link ${isActive('/dashboard/settings/custom-fields') ? 'active' : ''}`}>
                                <i className="fas fa-sliders-h"></i><span>Custom Fields</span>
                            </Link>
                        )}
                    </div>

                    <div className="nav-section">
                        <div className="nav-section-title">รายงาน</div>
                        <Link href="/dashboard/export" className={`nav-link ${isActive('/dashboard/export') ? 'active' : ''}`}>
                            <i className="fas fa-file-export"></i><span>ส่งออกข้อมูล</span>
                        </Link>
                    </div>
                </nav>
                <div className="sidebar-footer">
                    <div className="user-info">
                        <div className="user-avatar">{user.full_name?.charAt(0).toUpperCase() || 'U'}</div>
                        <div className="user-details">
                            <div className="user-name">{user.full_name}</div>
                            <div className="user-role">{user.role === 'admin' ? 'ผู้ดูแลระบบ' : 'เจ้าหน้าที่'}</div>
                        </div>
                        <button className="btn btn-icon btn-secondary" onClick={handleLogout} title="ออกจากระบบ">
                            <i className="fas fa-sign-out-alt"></i>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Overlay */}
            <div className={`sidebar-overlay ${sidebarOpen ? 'show' : ''}`} onClick={() => setSidebarOpen(false)}></div>

            {/* Main Content */}
            <main className="main-content">
                <header className="content-header">
                    <div className="header-left">
                        <button className="header-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="เปิด/ปิดเมนู">
                            <i className={`fas ${sidebarOpen ? 'fa-times' : 'fa-bars'}`}></i>
                        </button>
                        <h1 id="pageTitle">Dashboard</h1>
                    </div>
                    <div className="header-actions">
                        <span>{currentDate}</span>
                    </div>
                </header>
                <div className="content-body">
                    {children}
                </div>
            </main>
        </div>
    );
}
