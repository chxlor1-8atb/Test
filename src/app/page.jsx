'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import '../styles/login-base.css';
import '../styles/login-responsive.css';
import '../styles/login-slide.css';
import { checkAuth } from '@/utils/auth';

// --- Custom Hook: Slider Logic ---
function useSlider(unlocked, loading, onUnlock) {
    const [slideProgress, setSlideProgress] = useState(0);
    const [isDragging, setIsDragging] = useState(false);

    const sliderBtnRef = useRef(null);
    const slideContainerRef = useRef(null);
    const startXRef = useRef(0);

    // Stable callback for onUnlock to avoid effect re-binding
    const onUnlockRef = useRef(onUnlock);
    useEffect(() => {
        onUnlockRef.current = onUnlock;
    }, [onUnlock]);

    const handleStartDrag = useCallback((e) => {
        if (unlocked || loading) return;
        setIsDragging(true);
        const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
        startXRef.current = clientX;
    }, [unlocked, loading]);

    const handleDrag = useCallback((e) => {
        if (!isDragging) return;
        const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
        const moveX = clientX - startXRef.current;

        if (slideContainerRef.current && sliderBtnRef.current) {
            const maxMove = slideContainerRef.current.offsetWidth - sliderBtnRef.current.offsetWidth - 6;
            let newLeft = Math.max(4, Math.min(moveX, maxMove));
            setSlideProgress(newLeft);
        }
    }, [isDragging]);

    const handleEndDrag = useCallback(async () => {
        if (!isDragging) return;
        setIsDragging(false);

        if (slideContainerRef.current && sliderBtnRef.current) {
            const maxMove = slideContainerRef.current.offsetWidth - sliderBtnRef.current.offsetWidth - 6;
            // Check if dragged past 80%
            if (slideProgress > maxMove * 0.8) {
                if (onUnlockRef.current) await onUnlockRef.current();
            } else {
                setSlideProgress(0); // Snap back
            }
        }
    }, [isDragging, slideProgress]);

    // Global Event Listeners for Dragging
    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleDrag);
            document.addEventListener('mouseup', handleEndDrag);
            document.addEventListener('touchmove', handleDrag);
            document.addEventListener('touchend', handleEndDrag);
        }
        return () => {
            document.removeEventListener('mousemove', handleDrag);
            document.removeEventListener('mouseup', handleEndDrag);
            document.removeEventListener('touchmove', handleDrag);
            document.removeEventListener('touchend', handleEndDrag);
        };
    }, [isDragging, handleDrag, handleEndDrag]);

    const maximizeSlider = useCallback(() => {
        if (slideContainerRef.current && sliderBtnRef.current) {
            const maxMove = slideContainerRef.current.offsetWidth - sliderBtnRef.current.offsetWidth - 6;
            setSlideProgress(maxMove);
        }
    }, []);

    const resetSlider = useCallback(() => setSlideProgress(0), []);

    return {
        slideProgress,
        isDragging,
        sliderBtnRef,
        slideContainerRef,
        handleStartDrag,
        maximizeSlider,
        resetSlider
    };
}

// --- Main Components ---

export default function LoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [unlocked, setUnlocked] = useState(false);
    const [loginSuccess, setLoginSuccess] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);

    // Check if already authenticated
    useEffect(() => {
        const verifyAuth = async () => {
             try {
                const { authenticated } = await checkAuth();
                if (authenticated) {
                    router.replace('/dashboard');
                } else {
                    setCheckingAuth(false);
                }
             } catch (e) {
                 setCheckingAuth(false);
             }
        };
        verifyAuth();
    }, [router]);

    // Ref to hold the handleLogin function to break circular dependency with useSlider
    const handleLoginRef = useRef(null);

    // Callback that useSlider calls when unlocked
    const onSliderUnlock = useCallback(() => {
        if (handleLoginRef.current) {
            return handleLoginRef.current();
        }
    }, []);

    // Initialize Slider Hook
    const slider = useSlider(unlocked, loading, onSliderUnlock);

    // Real Login Handler
    const handleLogin = async () => {
        if (!username || !password) {
            setError('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
            slider.resetSlider();
            return;
        }

        setLoading(true);
        slider.maximizeSlider();

        try {
            const res = await fetch('/api/auth?action=login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    password
                })
            });

            const data = await res.json();

            if (data.success) {
                setUnlocked(true);
                setLoginSuccess(true);
                saveCredentials(rememberMe, username, password);

                setTimeout(() => {
                    router.push('/dashboard');
                }, 1500);
            } else {
                setError(data.message || 'เข้าสู่ระบบไม่สำเร็จ');
                slider.resetSlider();
            }
        } catch (err) {
            setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
            slider.resetSlider();
        } finally {
            setLoading(false);
        }
    };

    // Update Ref on every render so useSlider always has the latest handleLogin closure
    handleLoginRef.current = handleLogin;

    // Effect: Clear error on input change
    useEffect(() => {
        if (error) setError('');
    }, [username, password]);

    // Effect: Load Saved Credentials
    useEffect(() => {
        loadSavedCredentials();
    }, []);

    const loadSavedCredentials = () => {
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
    };

    const saveCredentials = (shouldRemember, user, pass) => {
        if (shouldRemember) {
            const savedData = { username: user, password: btoa(pass) };
            localStorage.setItem('rememberMe', btoa(JSON.stringify(savedData)));
        } else {
            localStorage.removeItem('rememberMe');
        }
    };

    if (checkingAuth) {
         return (
            <div className="login-body">
                <div className="bg-shapes">
                    <div className="shape shape--1"></div>
                    <div className="shape shape--2"></div>
                    <div className="shape shape--3"></div>
                </div>
                 {/* Invisible loading state or minimal spinner could go here if needed */}
            </div>
         );
    }

    return (
        <div className="login-body">


            {/* Background Effects */}
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
                    {/* Left Side: Brand & Info */}
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
                                    <FeatureTag color="purple" icon="check" text="จัดการร้านค้า" />
                                    <FeatureTag color="blue" icon="check" text="บันทึกใบอนุญาต" />
                                    <FeatureTag color="green" icon="check" text="แจ้งเตือนหมดอายุ" />
                                    <FeatureTag color="orange" icon="check" text="Export CSV/PDF" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Login Form */}
                    <div className="card-right">
                        <WaveDivider />

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
                            <InputGroup
                                id="username"
                                type="text"
                                label="ชื่อผู้ใช้"
                                value={username}
                                onChange={setUsername}
                                icon="user"
                            />

                            <InputGroup
                                id="password"
                                type={showPassword ? "text" : "password"}
                                label="รหัสผ่าน"
                                value={password}
                                onChange={setPassword}
                                icon="lock"
                                togglePassword={() => setShowPassword(!showPassword)}
                                isPasswordVisible={showPassword}
                            />

                            <div className="remember-me">
                                <label className="remember-me__label">
                                    <input
                                        type="checkbox"
                                        id="rememberMe"
                                        name="rememberMe"
                                        className="remember-me__checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                    />
                                    <span className="remember-me__checkmark"></span>
                                    <span className="remember-me__text">จดจำฉัน</span>
                                </label>
                            </div>



                            <div className="btn-wrapper">
                                <div
                                    className={`slide-container ${loading ? 'loading' : ''} ${unlocked ? 'unlocked' : ''} ${error ? 'error' : ''}`}
                                    id="slideContainer"
                                    ref={slider.slideContainerRef}
                                >
                                    <div
                                        className="slide-bg"
                                        style={{ width: slider.slideProgress > 0 ? `${slider.slideProgress + 25}px` : '0px' }}
                                    ></div>
                                    <div className="slide-text">เลื่อนเพื่อเข้าสู่ระบบ »</div>
                                    <div
                                        className="slider-btn"
                                        id="sliderBtn"
                                        ref={slider.sliderBtnRef}
                                        style={{
                                            left: slider.slideProgress > 0 ? `${slider.slideProgress}px` : '4px',
                                            /* Fix: Transition logic - animate when NOT dragging, e.g., snapping back or unlocking */
                                            transition: slider.isDragging ? 'none' : 'left 0.3s ease'
                                        }}
                                        onMouseDown={slider.handleStartDrag}
                                        onTouchStart={slider.handleStartDrag}
                                    >
                                        <i className="fas fa-arrow-right"></i>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <PageTransitionOverlay success={loginSuccess} />
        </div>
    );
}

// --- Sub Components ---

const FeatureTag = ({ color, icon, text }) => (
    <div className={`feature-tag feature-tag--${color}`}>
        <i className={`fas fa-${icon}`}></i> {text}
    </div>
);

const WaveDivider = () => (
    <svg className="wave-divider" viewBox="0 0 50 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M50,0 
                 C25,10 0,16 25,25 
                 C50,34 0,40 25,50 
                 C50,60 0,66 25,75 
                 C50,84 25,90 25,100 
                 L50,100 Z" fill="#FFFFFF" />
    </svg>
);

const InputGroup = ({ id, type, label, value, onChange, icon, togglePassword, isPasswordVisible }) => (
    <div className="input-group">
        <input
            type={type}
            id={id}
            name={id}
            className={`input-field ${togglePassword ? 'input-field--with-toggle' : ''}`}
            placeholder=" "
            value={value}
            onChange={(e) => onChange(e.target.value)}
            autoComplete={type === 'password' ? 'current-password' : 'username'}
            required
        />
        <label htmlFor={id} className="input-label">{label}</label>
        <i className={`fas fa-${icon} input-icon`}></i>
        {togglePassword && (
            <button
                type="button"
                className="password-toggle"
                onClick={togglePassword}
            >
                <i className={`fas ${isPasswordVisible ? 'fa-eye-slash' : 'fa-eye'}`}></i>
            </button>
        )}
    </div>
);

const PageTransitionOverlay = ({ success }) => (
    <div className={`page-transition ${success ? 'active success' : ''}`}>
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
                {success ? 'เข้าสู่ระบบสำเร็จ!' : 'กำลังเข้าสู่ระบบ...'}
            </div>
        </div>
    </div>
);
