/**
 * Custom Toast Component
 * Modern Expandable Toast with Timer - Based on Reference Design
 * Features: Expand/Collapse, Timer countdown, Click to stop
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createRoot } from 'react-dom/client';

// Toast Container ID
const TOAST_CONTAINER_ID = 'custom-toast-container';

// Icon SVGs
const Icons = {
    success: (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="14" cy="14" r="12" stroke="#10b981" strokeWidth="2.5" fill="none"/>
            <path d="M9 14.5L12.5 18L19 10" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    ),
    error: (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="14" cy="14" r="12" stroke="#ef4444" strokeWidth="2.5" fill="none"/>
            <path d="M10 10L18 18M18 10L10 18" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
    ),
    warning: (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="14" cy="14" r="12" stroke="#f59e0b" strokeWidth="2.5" fill="none"/>
            <path d="M14 9V15" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round"/>
            <circle cx="14" cy="19" r="1.5" fill="#f59e0b"/>
        </svg>
    ),
    info: (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="14" cy="14" r="12" stroke="#3b82f6" strokeWidth="2.5" fill="none"/>
            <path d="M14 13V19" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"/>
            <circle cx="14" cy="9" r="1.5" fill="#3b82f6"/>
        </svg>
    )
};

// Color mapping
const Colors = {
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6'
};

// Single Toast Component
function Toast({ 
    id, 
    type = 'success', 
    title, 
    message, 
    details,
    duration = 8000, 
    showDetails = false,
    confirmText = 'ตกลง',
    onClose,
    onConfirm 
}) {
    const [isExpanded, setIsExpanded] = useState(showDetails);
    const [timeLeft, setTimeLeft] = useState(Math.ceil(duration / 1000));
    const [isPaused, setIsPaused] = useState(false);
    const [progress, setProgress] = useState(100);
    const [isExiting, setIsExiting] = useState(false);
    const startTimeRef = useRef(Date.now());
    const pausedAtRef = useRef(null);
    const remainingRef = useRef(duration);

    const handleClose = useCallback(() => {
        setIsExiting(true);
        setTimeout(() => onClose?.(id), 300);
    }, [id, onClose]);

    const handleConfirm = useCallback(() => {
        onConfirm?.();
        handleClose();
    }, [onConfirm, handleClose]);

    const handlePause = useCallback(() => {
        if (!isPaused) {
            pausedAtRef.current = Date.now();
            remainingRef.current = remainingRef.current - (pausedAtRef.current - startTimeRef.current);
        } else {
            startTimeRef.current = Date.now();
        }
        setIsPaused(!isPaused);
    }, [isPaused]);

    // Timer effect
    useEffect(() => {
        if (isPaused) return;

        const interval = setInterval(() => {
            const elapsed = Date.now() - startTimeRef.current;
            const remaining = remainingRef.current - elapsed;
            
            if (remaining <= 0) {
                handleClose();
                return;
            }

            setTimeLeft(Math.ceil(remaining / 1000));
            setProgress((remaining / duration) * 100);
        }, 100);

        return () => clearInterval(interval);
    }, [isPaused, duration, handleClose]);

    return (
        <div 
            className={`custom-toast ${isExiting ? 'exiting' : ''}`}
            style={{
                '--toast-color': Colors[type]
            }}
        >
            {/* Main Header */}
            <div className="toast-header">
                <div className="toast-icon">
                    {Icons[type]}
                </div>
                <div className="toast-title">{title}</div>
                <div className="toast-actions">
                    {details && (
                        <button 
                            className="toast-btn toast-expand-btn"
                            onClick={() => setIsExpanded(!isExpanded)}
                            aria-label={isExpanded ? 'ย่อ' : 'ขยาย'}
                        >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path 
                                    d={isExpanded ? "M4 10L8 6L12 10" : "M4 6L8 10L12 6"} 
                                    stroke="currentColor" 
                                    strokeWidth="2" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </button>
                    )}
                    <button 
                        className="toast-btn toast-close-btn"
                        onClick={handleClose}
                        aria-label="ปิด"
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                    </button>
                </div>
            </div>

            {/* Expandable Content */}
            <div className={`toast-content ${isExpanded ? 'expanded' : ''}`}>
                {message && <p className="toast-message">{message}</p>}
                {details && isExpanded && (
                    <>
                        <p className="toast-details">{details}</p>
                        <button className="toast-confirm-btn" onClick={handleConfirm}>
                            {confirmText}
                        </button>
                    </>
                )}
            </div>

            {/* Timer Footer */}
            <div className="toast-footer" onClick={handlePause}>
                <span className="toast-timer-text">
                    {isPaused 
                        ? 'หยุดชั่วคราว คลิกเพื่อดำเนินการต่อ' 
                        : `จะปิดใน ${timeLeft} วินาที คลิกเพื่อหยุด`
                    }
                </span>
            </div>

            {/* Progress Bar */}
            <div className="toast-progress-container">
                <div 
                    className="toast-progress-bar" 
                    style={{ 
                        width: `${progress}%`,
                        transition: isPaused ? 'none' : 'width 0.1s linear'
                    }}
                />
            </div>
        </div>
    );
}

// Toast Container Component
function ToastContainer({ toasts, onClose, onConfirm }) {
    return (
        <div className="toast-container">
            {toasts.map(toast => (
                <Toast 
                    key={toast.id} 
                    {...toast} 
                    onClose={onClose}
                    onConfirm={() => onConfirm?.(toast.id)}
                />
            ))}
        </div>
    );
}

// Toast Manager Class
class ToastManager {
    constructor() {
        this.toasts = [];
        this.listeners = new Set();
        this.container = null;
        this.root = null;
    }

    init() {
        if (typeof window === 'undefined') return;
        
        let container = document.getElementById(TOAST_CONTAINER_ID);
        if (!container) {
            container = document.createElement('div');
            container.id = TOAST_CONTAINER_ID;
            document.body.appendChild(container);
        }
        this.container = container;
        this.root = createRoot(container);
        this.render();
    }

    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    notify() {
        this.listeners.forEach(listener => listener(this.toasts));
        this.render();
    }

    render() {
        if (!this.root) return;
        this.root.render(
            <ToastContainer 
                toasts={this.toasts}
                onClose={(id) => this.remove(id)}
                onConfirm={(id) => this.remove(id)}
            />
        );
    }

    add(options) {
        if (!this.container) this.init();
        
        const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
        const toast = { id, ...options };
        this.toasts = [...this.toasts, toast];
        this.notify();
        return id;
    }

    remove(id) {
        this.toasts = this.toasts.filter(t => t.id !== id);
        this.notify();
    }

    clear() {
        this.toasts = [];
        this.notify();
    }
}

// Singleton instance
const toastManager = new ToastManager();

// Public API
export const toast = {
    success: (title, message, options = {}) => {
        return toastManager.add({ type: 'success', title, message, ...options });
    },
    error: (title, message, options = {}) => {
        return toastManager.add({ type: 'error', title, message, duration: 10000, ...options });
    },
    warning: (title, message, options = {}) => {
        return toastManager.add({ type: 'warning', title, message, ...options });
    },
    info: (title, message, options = {}) => {
        return toastManager.add({ type: 'info', title, message, ...options });
    },
    remove: (id) => toastManager.remove(id),
    clear: () => toastManager.clear()
};

/**
 * @deprecated Use showSuccess, showError, showWarning, showInfo from '@/utils/alerts' instead
 * Those functions have additional features like pending delete with undo
 */

// Export for initialization
export const initToast = () => toastManager.init();

export default toast;

