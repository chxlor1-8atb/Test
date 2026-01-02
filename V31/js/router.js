/**
 * SPA Router - Handles navigation without page reload
 */

const Router = {
    // Current page
    currentPage: null,

    // Page configurations
    routes: {
        'dashboard': { title: 'Dashboard', template: 'dashboard', script: 'dashboard' },
        'expiring': { title: 'ใบอนุญาตใกล้หมดอายุ', template: 'expiring', script: 'expiring' },
        'shops': { title: 'จัดการร้านค้า', template: 'shops', script: 'shops' },
        'licenses': { title: 'จัดการใบอนุญาต', template: 'licenses', script: 'licenses' },
        'users': { title: 'จัดการผู้ใช้งาน', template: 'users', script: 'users' },
        'license-types': { title: 'ประเภทใบอนุญาต', template: 'license-types', script: 'license-types' },
        'notifications': { title: 'ตั้งค่าการแจ้งเตือน', template: 'notifications', script: 'notifications' },
        'export': { title: 'ส่งออกข้อมูล', template: 'export', script: 'export' }
    },

    // Loaded scripts cache
    loadedScripts: {},

    // Template cache
    templateCache: {},

    /**
     * Initialize router
     */
    init() {
        // Setup navigation click handlers
        this.setupNavLinks();

        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.page) {
                this.navigate(e.state.page, false);
            }
        });

        // Load initial page from URL hash or default to dashboard
        const hash = window.location.hash.slice(1);
        const initialPage = hash && this.routes[hash] ? hash : 'dashboard';
        this.navigate(initialPage, true);
    },

    /**
     * Setup navigation link click handlers
     */
    setupNavLinks() {
        document.querySelectorAll('.nav-link[data-page]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.getAttribute('data-page');
                if (page && page !== this.currentPage) {
                    this.navigate(page, true);
                }
            });
        });
    },

    /**
     * Navigate to a page
     */
    async navigate(page, pushState = true) {
        const route = this.routes[page];
        if (!route) {
            console.error('Route not found:', page);
            return;
        }

        const contentBody = document.getElementById('contentBody');
        if (!contentBody) return;

        // Start transition (fade out)
        contentBody.classList.add('page-transitioning');

        // Wait for fade out
        await this.wait(200);

        try {
            // Load template
            const template = await this.loadTemplate(route.template);

            // Update content
            contentBody.innerHTML = template;

            // Update page title
            document.getElementById('pageTitle').textContent = route.title;
            document.title = `${route.title} - ระบบจัดการใบอนุญาตร้านค้า`;

            // Update active nav link
            this.updateActiveNav(page);

            // Update URL hash
            if (pushState) {
                history.pushState({ page }, route.title, `#${page}`);
            }

            // Load and execute page script
            await this.loadPageScript(route.script);

            // Store current page
            this.currentPage = page;

        } catch (error) {
            console.error('Navigation error:', error);
            contentBody.innerHTML = `<div class="error-message"><i class="fas fa-exclamation-circle"></i> ไม่สามารถโหลดหน้านี้ได้</div>`;
        }

        // End transition (fade in)
        contentBody.classList.remove('page-transitioning');
    },

    /**
     * Load HTML template
     */
    async loadTemplate(name) {
        // Check cache
        if (this.templateCache[name]) {
            return this.templateCache[name];
        }

        const response = await fetch(`templates/${name}.html`);
        if (!response.ok) {
            throw new Error(`Template not found: ${name}`);
        }

        const html = await response.text();
        this.templateCache[name] = html;
        return html;
    },

    /**
     * Load and execute page script
     */
    async loadPageScript(name) {
        // Check if already loaded
        if (this.loadedScripts[name]) {
            // Re-initialize the page
            if (window.PageModules && window.PageModules[name]) {
                window.PageModules[name].init();
            }
            return;
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `js/pages/${name}.js`;
            script.onload = () => {
                this.loadedScripts[name] = true;
                // Initialize the page module
                if (window.PageModules && window.PageModules[name]) {
                    window.PageModules[name].init();
                }
                resolve();
            };
            script.onerror = () => reject(new Error(`Failed to load script: ${name}`));
            document.body.appendChild(script);
        });
    },

    /**
     * Update active navigation link
     */
    updateActiveNav(page) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-page') === page) {
                link.classList.add('active');
            }
        });
    },

    /**
     * Wait helper
     */
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};

// Global page modules registry
window.PageModules = {};
