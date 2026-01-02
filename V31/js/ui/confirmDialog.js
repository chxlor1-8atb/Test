/**
 * Custom Confirmation Dialog
 * Beautiful, modern confirmation dialog with warning
 */

// Store the resolve callback
let dialogResolve = null;

/**
 * Show confirmation dialog
 * @param {Object} options - Dialog options
 * @param {string} options.title - Dialog title (e.g., "ยืนยันการลบ")
 * @param {string} options.message - Main message
 * @param {string} options.warning - Warning text (red, emphasized)
 * @param {string} options.confirmText - Confirm button text (default: "ลบ")
 * @param {string} options.cancelText - Cancel button text (default: "ยกเลิก")
 * @param {string} options.type - Dialog type: 'danger', 'warning', 'info' (default: 'danger')
 * @returns {Promise<boolean>} - Resolves true if confirmed, false if cancelled
 */
export function showConfirmDialog(options = {}) {
    return new Promise((resolve) => {
        dialogResolve = resolve;

        const {
            title = 'ยืนยันการดำเนินการ',
            message = 'คุณต้องการดำเนินการนี้หรือไม่?',
            warning = '',
            confirmText = 'ยืนยัน',
            cancelText = 'ยกเลิก',
            type = 'danger',
            confirmIcon = 'fas fa-trash-alt'
        } = options;

        // Icon based on type
        const icons = {
            danger: 'fas fa-exclamation-triangle',
            warning: 'fas fa-exclamation-circle',
            info: 'fas fa-info-circle'
        };
        const icon = icons[type] || icons.danger;

        // Create dialog HTML
        const dialogHTML = `
            <div class="confirm-dialog-overlay" id="confirmDialogOverlay">
                <div class="confirm-dialog confirm-dialog-${type}">
                    <div class="confirm-dialog-icon ${type}">
                        <i class="${icon}"></i>
                    </div>
                    <div class="confirm-dialog-content">
                        <h3 class="confirm-dialog-title">${title}</h3>
                        <p class="confirm-dialog-message">${message}</p>
                        ${warning ? `<div class="confirm-dialog-warning"><i class="fas fa-info-circle"></i> ${warning}</div>` : ''}
                    </div>
                    <div class="confirm-dialog-actions">
                        <button class="btn btn-secondary" id="confirmDialogCancel">
                            <i class="fas fa-times"></i> ${cancelText}
                        </button>
                        <button class="btn btn-${type}" id="confirmDialogConfirm">
                            <i class="${confirmIcon}"></i> ${confirmText}
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add to DOM
        document.body.insertAdjacentHTML('beforeend', dialogHTML);

        // Get elements
        const overlay = document.getElementById('confirmDialogOverlay');
        const confirmBtn = document.getElementById('confirmDialogConfirm');
        const cancelBtn = document.getElementById('confirmDialogCancel');

        // Animate in
        requestAnimationFrame(() => {
            overlay.classList.add('show');
        });

        // Event handlers
        const handleConfirm = () => {
            closeDialog(true);
        };

        const handleCancel = () => {
            closeDialog(false);
        };

        const handleKeydown = (e) => {
            if (e.key === 'Escape') {
                closeDialog(false);
            } else if (e.key === 'Enter') {
                closeDialog(true);
            }
        };

        const handleOverlayClick = (e) => {
            if (e.target === overlay) {
                closeDialog(false);
            }
        };

        // Close dialog function
        const closeDialog = (result) => {
            overlay.classList.remove('show');

            // Remove after animation
            setTimeout(() => {
                overlay.remove();
                document.removeEventListener('keydown', handleKeydown);
                if (dialogResolve) {
                    dialogResolve(result);
                    dialogResolve = null;
                }
            }, 200);
        };

        // Attach events
        confirmBtn.addEventListener('click', handleConfirm);
        cancelBtn.addEventListener('click', handleCancel);
        overlay.addEventListener('click', handleOverlayClick);
        document.addEventListener('keydown', handleKeydown);

        // Focus confirm button
        setTimeout(() => {
            cancelBtn.focus();
        }, 100);
    });
}

/**
 * Show delete confirmation dialog (preset for delete operations)
 * @param {string} itemName - Name of item being deleted (e.g., "ร้านค้านี้", "ใบอนุญาตนี้")
 * @returns {Promise<boolean>}
 */
export function showDeleteConfirm(itemName = 'รายการนี้') {
    return showConfirmDialog({
        title: 'ยืนยันการลบข้อมูล',
        message: `คุณต้องการลบ${itemName}หรือไม่?`,
        warning: 'การดำเนินการนี้ไม่สามารถยกเลิกได้ ข้อมูลจะถูกลบอย่างถาวร',
        confirmText: 'ลบข้อมูล',
        cancelText: 'ยกเลิก',
        type: 'danger'
    });
}

/**
 * Show logout confirmation dialog
 * @returns {Promise<boolean>}
 */
export function showLogoutConfirm() {
    return showConfirmDialog({
        title: 'ยืนยันการออกจากระบบ',
        message: 'คุณต้องการออกจากระบบหรือไม่?',
        warning: '',
        confirmText: 'ออกจากระบบ',
        cancelText: 'ยกเลิก',
        type: 'danger',
        confirmIcon: 'fas fa-sign-out-alt'
    });
}

// Make functions available globally
window.showConfirmDialog = showConfirmDialog;
window.showDeleteConfirm = showDeleteConfirm;
window.showLogoutConfirm = showLogoutConfirm;
