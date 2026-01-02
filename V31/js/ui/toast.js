/**
 * Toast Notification System
 * Displays temporary toast messages to users
 */

const TOAST_ICONS = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-circle',
    info: 'fa-info-circle'
};

const TOAST_DURATION = 3000;
const TOAST_FADE_DURATION = 300;

/**
 * Display a toast notification
 * @param {string} message - Message to display
 * @param {string} type - Toast type: 'success', 'error', or 'info'
 */
export function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) {
        console.error('Toast container not found');
        return;
    }

    const toast = createToastElement(message, type);
    container.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);

    // Auto-remove after duration
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), TOAST_FADE_DURATION);
    }, TOAST_DURATION);
}

/**
 * Create toast DOM element
 * @param {string} message - Message text
 * @param {string} type - Toast type
 * @returns {HTMLElement} Toast element
 */
function createToastElement(message, type) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icon = TOAST_ICONS[type] || TOAST_ICONS.info;
    toast.innerHTML = `<i class="fas ${icon}"></i> ${message}`;

    return toast;
}
