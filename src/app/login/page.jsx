'use client';

import { useState, useEffect, useRef } from 'react';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import '../../styles/login-base.css';
import '../../styles/login-responsive.css';
import '../../styles/login-slide.css';

export default function LoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [slideProgress, setSlideProgress] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [unlocked, setUnlocked] = useState(false);
    const [loginSuccess, setLoginSuccess] = useState(false);

    const sliderBtnRef = useRef(null);
    const slideContainerRef = useRef(null);
    const startXRef = useRef(0);

    // Load saved credentials
    useEffect(() => {
        const savedData = localStorage.getItem('rememberMe');
        if (savedData) {
            try {
                const data = JSON.parse(atob(savedData));
                if (data.username && data.password) {
                    setUsername(data.username);
                    setPassword(atob(data.password));
                    setRememberMe(true);
                }
            } catch (e) {
                localStorage.removeItem('rememberMe');
            }
        }
    }, []);

    // Slider Logic
    const handleStartDrag = (e) => {
        if (unlocked || loading) return;
        setError('');
        setIsDragging(true);
        const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
        startXRef.current = clientX;
    };

    const handleDrag = (e) => {
        if (!isDragging) return;
        const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
        const moveX = clientX - startXRef.current;

        if (slideContainerRef.current && sliderBtnRef.current) {
            const maxMove = slideContainerRef.current.offsetWidth - sliderBtnRef.current.offsetWidth - 6;
            let newLeft = Math.max(4, Math.min(moveX, maxMove));
            setSlideProgress(newLeft);
        }
    };

    const handleEndDrag = async () => {
        if (!isDragging) return;
        setIsDragging(false);

        if (slideContainerRef.current && sliderBtnRef.current) {
            const maxMove = slideContainerRef.current.offsetWidth - sliderBtnRef.current.offsetWidth - 6;
            if (slideProgress > maxMove * 0.8) {
                // Trigger Login
                await handleLogin();
            } else {
                // Snap back
                setSlideProgress(0);
            }
        }
    };

    // Add document event listeners for drag outside the button
    useEffect(() => {
        const handleMove = (e) => handleDrag(e);
        const handleUp = () => handleEndDrag();

        if (isDragging) {
            document.addEventListener('mousemove', handleMove);
            document.addEventListener('mouseup', handleUp);
            document.addEventListener('touchmove', handleMove);
            document.addEventListener('touchend', handleUp);
        } else {
            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('mouseup', handleUp);
            document.removeEventListener('touchmove', handleMove);
            document.removeEventListener('touchend', handleUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('mouseup', handleUp);
            document.removeEventListener('touchmove', handleMove);
            document.removeEventListener('touchend', handleUp);
        };
    }, [isDragging, slideProgress]);

    const handleLogin = async () => {
        if (!username || !password) {
            setError('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
            setSlideProgress(0);
            return;
        }

        setLoading(true);
        // Maximize slider visual
        if (slideContainerRef.current && sliderBtnRef.current) {
            const maxMove = slideContainerRef.current.offsetWidth - sliderBtnRef.current.offsetWidth - 6;
            setSlideProgress(maxMove);
        }

        try {
            // Get CAPTCHA response
            const captchaResponse = document.querySelector('[name="cf-turnstile-response"]')?.value;

            const res = await fetch('/api/auth?action=login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    password,
                    'cf-turnstile-response': captchaResponse
                })
            });

            const data = await res.json();

            if (data.success) {
                setUnlocked(true);
                setLoginSuccess(true);

                // Save credentials
                if (rememberMe) {
                    const savedData = {
                        username,
                        password: btoa(password)
                    };
                    localStorage.setItem('rememberMe', btoa(JSON.stringify(savedData)));
                } else {
                    localStorage.removeItem('rememberMe');
                }

                // Redirect after animation
                setTimeout(() => {
                    router.push('/dashboard');
                }, 1500);

            } else {
                setError(data.message || 'เข้าสู่ระบบไม่สำเร็จ');
                setSlideProgress(0);
                if (window.turnstile) window.turnstile.reset();
            }
        } catch (err) {
            setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
            setSlideProgress(0);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-body">
            <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />

            <div className="bg-shapes">
                <div className="shape shape--1"></div>
                <div className="shape shape--2"></div>
                <div className="shape shape--3"></div>
            </div>

            <div className="particles">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="particle"></div>
                ))}
            </div>

            <div className="login-container">
                <div className="login-card">
                    {/* Left Side */}
                    <div className="card-left">
                        <div className="card-left__content">
                            <div className="brand">
                                <div className="brand__logo">
                                    <Image
                                        src="/image/shop-logo.png"
                                        alt="Shop License"
                                        width={52}
                                        height={52}
                                        className="brand__logo-img"
                                        priority
                                    />
                                </div>
                                <span className="brand__name">Shop License</span>
                            </div>

                            <h1 className="hero__title">
                                ระบบจัดการ<br />
                                <span className="hero__title--highlight">ใบอนุญาตร้านค้า</span>
                            </h1>

                            <p className="hero__description">
                                ยกระดับการจัดการร้านค้าของคุณด้วยระบบที่ใช้งานง่าย ออกแบบมาเพื่อ
                                ความเรียบง่าย ปลอดภัย และรวดเร็ว ให้การจัดการใบอนุญาตเป็นเรื่องง่ายในทุกวัน
                            </p>

                            <div className="features">
                                <div className="features__label">คุณสมบัติเด่น</div>
                                <div className="features__list">
                                    <div className="feature-tag feature-tag--purple">
                                        <i className="fas fa-check"></i> จัดการร้านค้า
                                    </div>
                                    <div className="feature-tag feature-tag--blue">
                                        <i className="fas fa-check"></i> บันทึกใบอนุญาต
                                    </div>
                                    <div className="feature-tag feature-tag--green">
                                        <i className="fas fa-check"></i> แจ้งเตือน Telegram
                                    </div>
                                    <div className="feature-tag feature-tag--orange">
                                        <i className="fas fa-check"></i> Export CSV/PDF
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side */}
                    <div className="card-right">
                        <svg className="wave-divider" viewBox="0 0 50 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M50,0 
                                     C25,10 0,16 25,25 
                                     C50,34 0,40 25,50 
                                     C50,60 0,66 25,75 
                                     C50,84 25,90 25,100 
                                     L50,100 Z" fill="#FFFFFF" />
                        </svg>

                        <header className="form-header">
                            <h2 className="form-header__title">ยินดีต้อนรับกลับมา</h2>
                            <p className="form-header__subtitle">เข้าสู่ระบบเพื่อดำเนินการต่อ</p>
                        </header>

                        {error && (
                            <div className="error-message show" style={{ display: 'flex' }}>
                                <i className="fas fa-exclamation-circle"></i>
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} noValidate>
                            <div className="input-group">
                                <input
                                    type="text"
                                    id="username"
                                    className="input-field"
                                    placeholder=" "
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                                <label htmlFor="username" className="input-label">ชื่อผู้ใช้</label>
                                <i className="fas fa-user input-icon"></i>
                            </div>

                            <div className="input-group">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    className="input-field input-field--with-toggle"
                                    placeholder=" "
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <label htmlFor="password" className="input-label">รหัสผ่าน</label>
                                <i className="fas fa-lock input-icon"></i>
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                </button>
                            </div>

                            <div className="remember-me">
                                <label className="remember-me__label">
                                    <input
                                        type="checkbox"
                                        className="remember-me__checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                    />
                                    <span className="remember-me__checkmark"></span>
                                    <span className="remember-me__text">จดจำฉัน</span>
                                </label>
                            </div>

                            {/* Cloudflare Turnstile CAPTCHA */}
                            {/* Note: In a real Next.js app, consider checking env vars for hostname before rendering */}
                            <div id="captchaContainer" className="captcha-container">
                                <div className="cf-turnstile" data-sitekey="0x4AAAAAACGLJgpZShtyGkT0" data-theme="light"></div>
                            </div>

                            <div className="btn-wrapper">
                                <div
                                    className={`slide-container ${loading ? 'loading' : ''} ${unlocked ? 'unlocked' : ''} ${error ? 'error' : ''}`}
                                    id="slideContainer"
                                    ref={slideContainerRef}
                                >
                                    <div
                                        className="slide-bg"
                                        style={{ width: slideProgress > 0 ? `${slideProgress + 25}px` : '0px' }}
                                    ></div>
                                    <div className="slide-text">เลื่อนเพื่อเข้าสู่ระบบ »</div>
                                    <div
                                        className="slider-btn"
                                        id="sliderBtn"
                                        ref={sliderBtnRef}
                                        style={{ left: slideProgress > 0 ? `${slideProgress}px` : '4px', transition: isDragging ? 'none' : 'left 0.3s ease' }}
                                        onMouseDown={handleStartDrag}
                                        onTouchStart={handleStartDrag}
                                    >
                                        <i className="fas fa-arrow-right"></i>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Page Transition Overlay */}
            <div className={`page-transition ${loginSuccess ? 'active success' : ''}`}>
                <div className="page-transition__bg"></div>
                <div className="page-transition__content">
                    <div className="page-transition__logo">
                        <Image
                            src="/image/shop-logo.png"
                            alt="Shop License"
                            width={80}
                            height={80}
                            priority
                        />
                    </div>
                    <div className="page-transition__spinner"></div>
                    <div className="page-transition__success">
                        <i className="fas fa-check"></i>
                    </div>
                    <div className="page-transition__text">
                        {loginSuccess ? 'เข้าสู่ระบบสำเร็จ!' : 'กำลังเข้าสู่ระบบ...'}
                    </div>
                </div>
            </div>
        </div>
    );
}
