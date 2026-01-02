/**
 * Common Utilities - Shared across all pages
 * Authentication, Navigation, User Info
 */

// Global state
let currentUser = null;

// Initialize common features
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    updateDateTime();
    setInterval(updateDateTime, 60000);
    setActiveMenu();
    setupNavigation();
});

/**
 * Setup navigation click handlers
 */
function setupNavigation() {
    document.querySelectorAll('.nav-link[data-page]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.getAttribute('data-page');
            if (page) {
                navigateTo(page);
            }
        });
    });
}

/**
 * Navigate to a specific page
 */
function navigateTo(page) {
    window.location.href = `${page}.html`;
}

/**
 * Authentication Check
 * Redirects to login page if not authenticated
 */
async function checkAuth() {
    try {
        const res = await fetch('../api/auth.php?action=check');
        const data = await res.json();

        if (!data.success) {
            window.location.href = '../index.html';
            return false;
        }

        currentUser = data.user;
        updateUserInfo();

        // Show admin-only menu items
        if (currentUser.role === 'admin') {
            const navUsers = document.getElementById('navUsers');
            const navLicenseTypes = document.getElementById('navLicenseTypes');
            if (navUsers) navUsers.style.display = 'flex';
            if (navLicenseTypes) navLicenseTypes.style.display = 'flex';
        }

        return true;
    } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '../index.html';
        return false;
    }
}

/**
 * Update user information in sidebar
 */
function updateUserInfo() {
    if (!currentUser) return;

    const userName = document.getElementById('userName');
    const userRole = document.getElementById('userRole');
    const userAvatar = document.getElementById('userAvatar');

    if (userName) userName.textContent = currentUser.full_name;
    if (userRole) userRole.textContent = currentUser.role === 'admin' ? 'ผู้ดูแลระบบ' : 'เจ้าหน้าที่';
    if (userAvatar) userAvatar.textContent = currentUser.full_name.charAt(0).toUpperCase();
}

/**
 * Logout function with confirmation dialog
 */
async function logout() {
    // Check if showLogoutConfirm is available (async module loading)
    if (typeof showLogoutConfirm === 'function') {
        const confirmed = await showLogoutConfirm();
        if (!confirmed) return;
    }

    try {
        await fetch('../api/auth.php?action=logout');
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        window.location.href = '../index.html';
    }
}

/**
 * Set active menu item based on current page
 */
function setActiveMenu() {
    // Get current page from URL
    const currentPath = window.location.pathname;
    const currentPage = currentPath.split('/').pop().replace('.html', '');

    // Remove active class from all links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');

        // Add active class to current page link
        const linkPage = link.getAttribute('data-page');
        if (linkPage === currentPage) {
            link.classList.add('active');
        }
    });
}

/**
 * Update current date/time display
 */
function updateDateTime() {
    const currentDateEl = document.getElementById('currentDate');
    if (!currentDateEl) return;

    const d = new Date();
    currentDateEl.textContent = d.toLocaleDateString('th-TH', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Toggle sidebar for mobile
 */
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    if (sidebar) sidebar.classList.toggle('show');
    if (overlay) overlay.classList.toggle('show');
}

/**
 * Debounce utility
 */
function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Initialize Custom Select Dropdowns
 * Transforms native select elements into themed custom dropdowns
 * @param {string} selector - CSS selector for select elements to transform
 * @param {object} options - Configuration options
 * @param {number} options.searchThreshold - Minimum options count to show search (default: 5)
 */
function initCustomSelects(selector = 'select:not(.no-custom)', options = {}) {
    const { searchThreshold = 5 } = options;
    const selects = document.querySelectorAll(selector);

    selects.forEach(select => {
        // Skip if already initialized
        if (select.parentElement?.classList.contains('custom-select-wrapper')) return;

        const hasSearch = select.options.length >= searchThreshold;

        // Create wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'custom-select-wrapper';
        if (hasSearch) wrapper.classList.add('searchable');

        // Create trigger button
        const trigger = document.createElement('div');
        trigger.className = 'custom-select-trigger';

        // Get selected option text
        const selectedOption = select.options[select.selectedIndex];
        const selectedText = selectedOption ? selectedOption.text : '';

        trigger.innerHTML = `
            <span class="custom-select-text">${selectedText}</span>
            <svg class="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
        `;

        // Create options container
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'custom-select-options';

        // Create search input if threshold met
        let searchInput = null;
        if (hasSearch) {
            const searchWrapper = document.createElement('div');
            searchWrapper.className = 'custom-select-search';
            searchWrapper.innerHTML = `
                <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.3-4.3"></path>
                </svg>
                <input type="text" class="custom-select-search-input" placeholder="ค้นหา..." autocomplete="off">
                <button type="button" class="search-clear" title="ล้าง">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M18 6 6 18"></path>
                        <path d="m6 6 12 12"></path>
                    </svg>
                </button>
            `;
            optionsContainer.appendChild(searchWrapper);
            searchInput = searchWrapper.querySelector('.custom-select-search-input');

            // Clear button handler
            const clearBtn = searchWrapper.querySelector('.search-clear');
            clearBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                searchInput.value = '';
                searchInput.dispatchEvent(new Event('input'));
                searchInput.focus();
            });
        }

        // Create options list container
        const optionsList = document.createElement('div');
        optionsList.className = 'custom-select-options-list';

        // Build options
        Array.from(select.options).forEach((option, index) => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'custom-select-option';
            if (index === select.selectedIndex) {
                optionDiv.classList.add('selected');
            }
            optionDiv.dataset.value = option.value;
            optionDiv.dataset.text = option.text.toLowerCase();
            optionDiv.textContent = option.text;

            optionDiv.addEventListener('click', (e) => {
                e.stopPropagation();

                // Update selected state
                optionsList.querySelectorAll('.custom-select-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                optionDiv.classList.add('selected');

                // Update trigger text
                trigger.querySelector('.custom-select-text').textContent = option.text;

                // Update native select
                select.value = option.value;

                // Trigger change event
                select.dispatchEvent(new Event('change', { bubbles: true }));

                // Clear search and close dropdown
                if (searchInput) {
                    searchInput.value = '';
                    filterOptions('');
                }
                wrapper.classList.remove('open');
            });

            optionsList.appendChild(optionDiv);
        });

        optionsContainer.appendChild(optionsList);

        // No results message
        const noResults = document.createElement('div');
        noResults.className = 'custom-select-no-results';
        noResults.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.3-4.3"></path>
            </svg>
            <span>ไม่พบรายการที่ค้นหา</span>
        `;
        optionsContainer.appendChild(noResults);

        // Filter function
        function filterOptions(searchTerm) {
            const term = searchTerm.toLowerCase().trim();
            let visibleCount = 0;

            optionsList.querySelectorAll('.custom-select-option').forEach(opt => {
                const text = opt.dataset.text;
                const matches = !term || text.includes(term);
                opt.style.display = matches ? '' : 'none';
                if (matches) visibleCount++;
            });

            // Show/hide no results message
            noResults.style.display = visibleCount === 0 ? 'flex' : 'none';

            // Update clear button visibility
            const clearBtn = optionsContainer.querySelector('.search-clear');
            if (clearBtn) {
                clearBtn.style.opacity = term ? '1' : '0';
                clearBtn.style.pointerEvents = term ? 'auto' : 'none';
            }
        }

        // Search input handler
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                filterOptions(e.target.value);
            });

            // Prevent dropdown close on search input click
            searchInput.addEventListener('click', (e) => {
                e.stopPropagation();
            });

            // Keyboard navigation
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    wrapper.classList.remove('open');
                    searchInput.value = '';
                    filterOptions('');
                } else if (e.key === 'Enter') {
                    // Select first visible option
                    const firstVisible = optionsList.querySelector('.custom-select-option:not([style*="display: none"])');
                    if (firstVisible) {
                        firstVisible.click();
                    }
                } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    const visibleOptions = Array.from(optionsList.querySelectorAll('.custom-select-option:not([style*="display: none"])'));
                    if (visibleOptions.length === 0) return;

                    const currentFocused = optionsList.querySelector('.custom-select-option.focused');
                    let nextIndex = 0;

                    if (currentFocused) {
                        const currentIndex = visibleOptions.indexOf(currentFocused);
                        if (e.key === 'ArrowDown') {
                            nextIndex = (currentIndex + 1) % visibleOptions.length;
                        } else {
                            nextIndex = (currentIndex - 1 + visibleOptions.length) % visibleOptions.length;
                        }
                        currentFocused.classList.remove('focused');
                    }

                    visibleOptions[nextIndex].classList.add('focused');
                    visibleOptions[nextIndex].scrollIntoView({ block: 'nearest' });
                }
            });
        }

        // Toggle dropdown on trigger click
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();

            // Close other open dropdowns
            document.querySelectorAll('.custom-select-wrapper.open').forEach(w => {
                if (w !== wrapper) {
                    w.classList.remove('open');
                    // Clear search in other dropdowns
                    const otherSearch = w.querySelector('.custom-select-search-input');
                    if (otherSearch) {
                        otherSearch.value = '';
                        otherSearch.dispatchEvent(new Event('input'));
                    }
                }
            });

            wrapper.classList.toggle('open');

            // Focus search input when opening
            if (wrapper.classList.contains('open') && searchInput) {
                setTimeout(() => searchInput.focus(), 50);
            }
        });

        // Close dropdown on outside click
        document.addEventListener('click', () => {
            if (wrapper.classList.contains('open')) {
                wrapper.classList.remove('open');
                if (searchInput) {
                    searchInput.value = '';
                    filterOptions('');
                }
            }
        });

        // Wrap select
        select.parentNode.insertBefore(wrapper, select);
        select.classList.add('hidden-select');
        wrapper.appendChild(select);
        wrapper.appendChild(trigger);
        wrapper.appendChild(optionsContainer);
    });
}

/**
 * Refresh custom select options
 * Call this after dynamically updating select options
 * @param {HTMLSelectElement} select - The native select element to refresh
 * @param {object} options - Configuration options
 * @param {number} options.searchThreshold - Minimum options count to show search (default: 5)
 */
function refreshCustomSelect(select, options = {}) {
    const { searchThreshold = 5 } = options;
    const wrapper = select.closest('.custom-select-wrapper');
    if (!wrapper) return;

    const trigger = wrapper.querySelector('.custom-select-trigger');
    const optionsContainer = wrapper.querySelector('.custom-select-options');

    if (!trigger || !optionsContainer) return;

    const hasSearch = select.options.length >= searchThreshold;

    // Update searchable class
    if (hasSearch) {
        wrapper.classList.add('searchable');
    } else {
        wrapper.classList.remove('searchable');
    }

    // Update trigger text
    const selectedOption = select.options[select.selectedIndex];
    const triggerText = trigger.querySelector('.custom-select-text');
    if (triggerText && selectedOption) {
        triggerText.textContent = selectedOption.text;
    }

    // Rebuild options container
    optionsContainer.innerHTML = '';

    // Create search input if threshold met
    let searchInput = null;
    if (hasSearch) {
        const searchWrapper = document.createElement('div');
        searchWrapper.className = 'custom-select-search';
        searchWrapper.innerHTML = `
            <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.3-4.3"></path>
            </svg>
            <input type="text" class="custom-select-search-input" placeholder="ค้นหา..." autocomplete="off">
            <button type="button" class="search-clear" title="ล้าง">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 6 6 18"></path>
                    <path d="m6 6 12 12"></path>
                </svg>
            </button>
        `;
        optionsContainer.appendChild(searchWrapper);
        searchInput = searchWrapper.querySelector('.custom-select-search-input');

        // Clear button handler
        const clearBtn = searchWrapper.querySelector('.search-clear');
        clearBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            searchInput.value = '';
            searchInput.dispatchEvent(new Event('input'));
            searchInput.focus();
        });
    }

    // Create options list container
    const optionsList = document.createElement('div');
    optionsList.className = 'custom-select-options-list';

    // Build options
    Array.from(select.options).forEach((option, index) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'custom-select-option';
        if (index === select.selectedIndex) {
            optionDiv.classList.add('selected');
        }
        optionDiv.dataset.value = option.value;
        optionDiv.dataset.text = option.text.toLowerCase();
        optionDiv.textContent = option.text;

        optionDiv.addEventListener('click', (e) => {
            e.stopPropagation();

            // Update selected state
            optionsList.querySelectorAll('.custom-select-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            optionDiv.classList.add('selected');

            // Update trigger text
            if (triggerText) {
                triggerText.textContent = option.text;
            }

            // Update native select
            select.value = option.value;

            // Trigger change event
            select.dispatchEvent(new Event('change', { bubbles: true }));

            // Clear search and close dropdown
            if (searchInput) {
                searchInput.value = '';
                filterOptions('');
            }
            wrapper.classList.remove('open');
        });

        optionsList.appendChild(optionDiv);
    });

    optionsContainer.appendChild(optionsList);

    // No results message
    const noResults = document.createElement('div');
    noResults.className = 'custom-select-no-results';
    noResults.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.3-4.3"></path>
        </svg>
        <span>ไม่พบรายการที่ค้นหา</span>
    `;
    optionsContainer.appendChild(noResults);

    // Filter function
    function filterOptions(searchTerm) {
        const term = searchTerm.toLowerCase().trim();
        let visibleCount = 0;

        optionsList.querySelectorAll('.custom-select-option').forEach(opt => {
            const text = opt.dataset.text;
            const matches = !term || text.includes(term);
            opt.style.display = matches ? '' : 'none';
            if (matches) visibleCount++;
        });

        // Show/hide no results message
        noResults.style.display = visibleCount === 0 ? 'flex' : 'none';

        // Update clear button visibility
        const clearBtn = optionsContainer.querySelector('.search-clear');
        if (clearBtn) {
            clearBtn.style.opacity = term ? '1' : '0';
            clearBtn.style.pointerEvents = term ? 'auto' : 'none';
        }
    }

    // Search input handler
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterOptions(e.target.value);
        });

        // Prevent dropdown close on search input click
        searchInput.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Keyboard navigation
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                wrapper.classList.remove('open');
                searchInput.value = '';
                filterOptions('');
            } else if (e.key === 'Enter') {
                // Select first visible option
                const firstVisible = optionsList.querySelector('.custom-select-option:not([style*="display: none"])');
                if (firstVisible) {
                    firstVisible.click();
                }
            } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                const visibleOptions = Array.from(optionsList.querySelectorAll('.custom-select-option:not([style*="display: none"])'));
                if (visibleOptions.length === 0) return;

                const currentFocused = optionsList.querySelector('.custom-select-option.focused');
                let nextIndex = 0;

                if (currentFocused) {
                    const currentIndex = visibleOptions.indexOf(currentFocused);
                    if (e.key === 'ArrowDown') {
                        nextIndex = (currentIndex + 1) % visibleOptions.length;
                    } else {
                        nextIndex = (currentIndex - 1 + visibleOptions.length) % visibleOptions.length;
                    }
                    currentFocused.classList.remove('focused');
                }

                visibleOptions[nextIndex].classList.add('focused');
                visibleOptions[nextIndex].scrollIntoView({ block: 'nearest' });
            }
        });
    }
}

