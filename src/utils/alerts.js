/**
 * Alert Utilities
 * Wrapper for SweetAlert2 with consistent styling
 * Follows Single Responsibility - only handles alerts
 */

import Swal from 'sweetalert2';

/**
 * Shows a success alert
 * @param {string} message - Success message
 * @param {string} title - Optional title (default: 'สำเร็จ')
 */
export const showSuccess = (message, title = 'สำเร็จ') => {
    return Swal.fire({
        icon: 'success',
        title,
        text: message,
        timer: 2000,
        showConfirmButton: false
    });
};

/**
 * Shows an error alert
 * @param {string} message - Error message
 * @param {string} title - Optional title (default: 'เกิดข้อผิดพลาด')
 */
export const showError = (message, title = 'เกิดข้อผิดพลาด') => {
    return Swal.fire({
        icon: 'error',
        title,
        text: message
    });
};

/**
 * Shows a warning alert
 * @param {string} message - Warning message
 * @param {string} title - Optional title
 */
export const showWarning = (message, title = 'คำเตือน') => {
    return Swal.fire({
        icon: 'warning',
        title,
        text: message
    });
};

/**
 * Shows info alert
 * @param {string} message - Info message
 * @param {string} title - Optional title
 */
export const showInfo = (message, title = 'ข้อมูล') => {
    return Swal.fire({
        icon: 'info',
        title,
        text: message
    });
};

/**
 * Shows delete confirmation dialog
 * @param {string} itemName - Name of item being deleted
 * @returns {Promise<boolean>} True if confirmed
 */
export const confirmDelete = async (itemName = 'ข้อมูลนี้') => {
    const result = await Swal.fire({
        title: 'ยืนยันการลบ?',
        text: `${itemName}จะถูกลบถาวร`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'ลบข้อมูล',
        cancelButtonText: 'ยกเลิก'
    });

    return result.isConfirmed;
};

/**
 * Shows a general confirmation dialog
 * @param {Object} options - Confirmation options
 * @returns {Promise<boolean>} True if confirmed
 */
export const confirm = async ({
    title = 'ยืนยัน?',
    text = '',
    confirmText = 'ตกลง',
    cancelText = 'ยกเลิก',
    icon = 'question'
}) => {
    const result = await Swal.fire({
        title,
        text,
        icon,
        showCancelButton: true,
        confirmButtonColor: '#D97757',
        cancelButtonColor: '#6b7280',
        confirmButtonText: confirmText,
        cancelButtonText: cancelText
    });

    return result.isConfirmed;
};

/**
 * Shows loading state
 * @param {string} message - Loading message
 */
export const showLoading = (message = 'กำลังประมวลผล...') => {
    Swal.fire({
        title: message,
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
};

/**
 * Closes any open alert
 */
export const closeAlert = () => {
    Swal.close();
};
