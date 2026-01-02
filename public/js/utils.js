/**
 * Utility Functions - Shared helpers
 * Date formatting, Toasts, Modals, etc.
 */

/**
 * Format date to Thai format
 * @param {string} dateString - Date string from database
 * @returns {string} Formatted date
 */
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type: success, error, info, warning
 */
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };

    toast.innerHTML = `
        <i class="fas ${icons[type] || icons.info}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    // Show toast
    setTimeout(() => toast.classList.add('show'), 10);

    // Hide and remove toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * Open modal
 */
function openModal() {
    const overlay = document.getElementById('modalOverlay');
    if (overlay) {
        overlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Close modal
 */
function closeModal() {
    const overlay = document.getElementById('modalOverlay');
    if (overlay) {
        overlay.classList.remove('show');
        document.body.style.overflow = '';
    }
}

/**
 * Create modal content helper
 * @param {string} title - Modal title
 * @param {string} bodyHTML - Modal body HTML
 * @param {string} footerHTML - Modal footer HTML
 */
function setModalContent(title, bodyHTML, footerHTML) {
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const modalFooter = document.getElementById('modalFooter');

    if (modalTitle) modalTitle.textContent = title;
    if (modalBody) modalBody.innerHTML = bodyHTML;
    if (modalFooter) modalFooter.innerHTML = footerHTML;
}

/**
 * Loading spinner HTML
 */
function getLoadingHTML() {
    return '<div class="loading"><i class="fas fa-spinner fa-spin"></i> กำลังโหลด...</div>';
}

/**
 * Error message HTML
 */
function getErrorHTML(message) {
    return `<div class="error-message"><i class="fas fa-exclamation-circle"></i> ${message}</div>`;
}

/**
 * Empty state HTML
 */
function getEmptyHTML(message = 'ไม่พบข้อมูล') {
    return `<tr><td colspan="10" style="text-align:center;color:var(--text-muted);padding:2rem">${message}</td></tr>`;
}

/**
 * Format number with Thai separators
 */
function formatNumber(num) {
    return new Intl.NumberFormat('th-TH').format(num);
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Render Pagination Controls
 * Standardized pagination for all pages
 * 
 * @param {string} containerId - ID of the container element
 * @param {object} paginationState - Object containing {page, limit, total, totalPages}
 * @param {function} onPageChange - Callback function(newPage)
 * @param {function} onLimitChange - Callback function(newLimit)
 */
function renderPagination(containerId, paginationState, onPageChange, onLimitChange) {
    const container = document.getElementById(containerId);
    // If no container or invalid state, clear and return
    // Note: We show pagination even if totalPages <= 1 so users can see the count/limit
    if (!container) return;

    // Ensure we have valid numbers
    const page = parseInt(paginationState.page) || 1;
    const limit = parseInt(paginationState.limit) || 10;
    const total = parseInt(paginationState.total) || 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    // If no data, clear
    if (total === 0) {
        container.innerHTML = '';
        return;
    }

    const startItem = (page - 1) * limit + 1;
    const endItem = Math.min(page * limit, total);

    let paginationHTML = `
        <div class="pagination-container">
            <div class="pagination-info">
                แสดง <strong>${startItem}-${endItem}</strong> จาก <strong>${total}</strong> รายการ
            </div>
            <div class="pagination-controls">
                <button class="pagination-btn prev-btn" ${page === 1 ? 'disabled' : ''}>
                    <i class="fas fa-angle-double-left"></i>
                </button>
                <button class="pagination-btn prev-page-btn" ${page === 1 ? 'disabled' : ''}>
                    <i class="fas fa-angle-left"></i>
                </button>`;

    // Page numbers logic
    const maxVisiblePages = 5;
    let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
        paginationHTML += `<button class="pagination-btn page-num-btn" data-page="1">1</button>`;
        if (startPage > 2) paginationHTML += `<span class="pagination-ellipsis">...</span>`;
    }

    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `<button class="pagination-btn page-num-btn ${i === page ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) paginationHTML += `<span class="pagination-ellipsis">...</span>`;
        paginationHTML += `<button class="pagination-btn page-num-btn" data-page="${totalPages}">${totalPages}</button>`;
    }

    paginationHTML += `
                <button class="pagination-btn next-page-btn" ${page === totalPages ? 'disabled' : ''}>
                    <i class="fas fa-angle-right"></i>
                </button>
                <button class="pagination-btn next-btn" ${page === totalPages ? 'disabled' : ''}>
                    <i class="fas fa-angle-double-right"></i>
                </button>
            </div>
            <div class="pagination-limit">
                <span>แสดง</span>
                <select class="limit-select">
                    <option value="10" ${limit === 10 ? 'selected' : ''}>10</option>
                    <option value="20" ${limit === 20 ? 'selected' : ''}>20</option>
                    <option value="50" ${limit === 50 ? 'selected' : ''}>50</option>
                    <option value="100" ${limit === 100 ? 'selected' : ''}>100</option>
                </select>
                <span>รายการ</span>
            </div>
        </div>`;

    container.innerHTML = paginationHTML;

    // Attach Event Listeners

    // First Page
    const prevBtn = container.querySelector('.prev-btn');
    if (prevBtn) prevBtn.onclick = () => onPageChange(1);

    // Prev Page
    const prevPageBtn = container.querySelector('.prev-page-btn');
    if (prevPageBtn) prevPageBtn.onclick = () => onPageChange(Math.max(1, page - 1));

    // Next Page
    const nextPageBtn = container.querySelector('.next-page-btn');
    if (nextPageBtn) nextPageBtn.onclick = () => onPageChange(Math.min(totalPages, page + 1));

    // Last Page
    const nextBtn = container.querySelector('.next-btn');
    if (nextBtn) nextBtn.onclick = () => onPageChange(totalPages);

    // Page Numbers
    container.querySelectorAll('.page-num-btn').forEach(btn => {
        btn.onclick = () => onPageChange(parseInt(btn.getAttribute('data-page')));
    });

    // Limit Change
    const limitSelect = container.querySelector('.limit-select');
    if (limitSelect) {
        limitSelect.onchange = (e) => onLimitChange(e.target.value);

        // Initialize custom select for this new element if the utility exists
        if (typeof initCustomSelects === 'function') {
            initCustomSelects(`#${containerId} .limit-select`);
        }
    }
}
