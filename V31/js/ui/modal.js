/**
 * Modal Management
 * Controls modal display and interactions
 */

/**
 * Open the modal overlay
 */
export function openModal() {
    const modalOverlay = document.getElementById('modalOverlay');
    if (modalOverlay) {
        modalOverlay.classList.add('show');
    }
}

/**
 * Close the modal overlay
 */
export function closeModal() {
    const modalOverlay = document.getElementById('modalOverlay');
    if (modalOverlay) {
        modalOverlay.classList.remove('show');
    }
}

/**
 * Initialize modal event listeners
 * Sets up click-outside-to-close behavior for mobile devices
 */
export function initModalEventListeners() {
    const modalOverlay = document.getElementById('modalOverlay');
    if (!modalOverlay) return;

    modalOverlay.addEventListener('click', (event) => {
        // Close modal when clicking outside only on mobile devices (≤768px)
        // On desktop, require close button click
        if (event.target.id === 'modalOverlay') {
            const isMobile = window.innerWidth <= 768;
            if (isMobile) {
                closeModal();
            }
        }
    });
}
