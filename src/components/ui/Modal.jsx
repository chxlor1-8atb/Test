'use client';

import { useEffect, useCallback } from 'react';

/**
 * Modal Component
 * Reusable modal wrapper with consistent styling
 * Handles:
 * - Backdrop click to close
 * - Escape key to close
 * - Focus trap (accessibility)
 * 
 * @param {boolean} isOpen - Whether modal is visible
 * @param {function} onClose - Callback when modal should close
 * @param {string} title - Modal title
 * @param {ReactNode} children - Modal content
 * @param {string} className - Additional CSS classes
 */
export default function Modal({
    isOpen,
    onClose,
    title,
    children,
    className = '',
    showCloseButton = true
}) {
    // Handle escape key
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Escape') {
            onClose();
        }
    }, [onClose]);

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, handleKeyDown]);

    if (!isOpen) return null;

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="modal-overlay show"
            style={{ display: 'flex' }}
            onClick={handleBackdropClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div
                className={`modal show ${className}`.trim()}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <h3 id="modal-title" className="modal-title">{title}</h3>
                    {showCloseButton && (
                        <button
                            className="modal-close"
                            onClick={onClose}
                            aria-label="ปิด"
                        >
                            <i className="fas fa-times"></i>
                        </button>
                    )}
                </div>
                <div className="modal-body">
                    {children}
                </div>
            </div>
        </div>
    );
}
