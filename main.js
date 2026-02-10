// Helper
window.$ = document.querySelector.bind(document);
window.$$ = document.querySelectorAll.bind(document);

// --- GLOBAL DIRTY STATE GUARD ---
window.isDirty = false;
window.resetDirty = () => { window.isDirty = false; };

// 1. Browser Native Guard (Close/Refresh)
window.onbeforeunload = (e) => {
    if (window.isDirty) {
        e.preventDefault();
        e.returnValue = ''; // Required for Chrome
    }
};

// 2. Internal Navigation Guard
document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (link && window.isDirty) {
        const href = link.getAttribute('href');
        if (href && href !== '#' && !href.startsWith('javascript:')) {
            e.preventDefault();
            showUnsavedChangesModal(() => {
                window.resetDirty();
                window.location.href = href;
            });
        }
    }
});

function showUnsavedChangesModal(onConfirm) {
    // Remove existing if any
    const existing = document.getElementById('unsavedModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'unsavedModal';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);
        display: flex; justify-content: center; align-items: center; z-index: 9999;
        animation: fadeIn 0.2s ease-out;
    `;

    modal.innerHTML = `
        <div style="
            background: white; padding: 25px; border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2); width: 90%; max-width: 400px;
            text-align: center; font-family: 'Roboto', sans-serif;
            transform: scale(0.9); animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        ">
            <div style="font-size: 3rem; color: #f59e0b; margin-bottom: 10px;"><i class="fas fa-exclamation-triangle"></i></div>
            <h2 style="margin: 0 0 10px; color: #333;">Kaydedilmemiş Değişiklikler!</h2>
                Bağlantıdan ayrılırsanız yaptığınız değişiklikler kaydedilmeyecek.
            </p>
            <div style="display: flex; gap: 10px;">
                <button id="btnStay" style="
                    flex: 1; padding: 12px; border: 1px solid #ddd; background: white; 
                    color: #555; border-radius: 6px; cursor: pointer; font-weight: bold;
                    transition: all 0.2s;
                ">Vazgeç, Düzenlemeye Devam Et</button>
                <button id="btnLeave" style="
                    flex: 1; padding: 12px; border: none; background: #ef4444; 
                    color: white; border-radius: 6px; cursor: pointer; font-weight: bold;
                    box-shadow: 0 4px 6px rgba(239, 68, 68, 0.3); transition: all 0.2s;
                ">Değişiklikleri Kaydetmeden Çık</button>
            </div>
        </div>
        <style>
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes popIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            #btnStay:hover { background: #f9fafb; border-color: #ccc; }
            #btnLeave:hover { background: #dc2626; transform: translateY(-1px); }
        </style>
    `;

    document.body.appendChild(modal);

    document.getElementById('btnStay').onclick = () => modal.remove();
    document.getElementById('btnLeave').onclick = () => {
        window.isDirty = false; // Reset first
        modal.remove();
        if (typeof onConfirm === 'function') onConfirm();
    };

    // Close on backdrop click (optional, but requested implicitly)
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
}
// ------------------------------


//Auth Guard
(function () {
    const path = window.location.pathname;
    const page = path.split("/").pop();

    // Public pages that don't require login
    const publicPages = ['index.html', '', 'rapor-goruntule.html'];

    if (!publicPages.includes(page)) {
        const userStr = localStorage.getItem('user');
        if (!userStr) {
            window.location.href = 'index.html';
        } else {
            // Role Guard for Settings Page
            if (page === 'ayarlar.html') {
                try {
                    const user = JSON.parse(userStr);
                    const role = (user.role || user.rol || '').toLowerCase();
                    const isAdmin = (!!user.isAdmin) || (role === 'admin');

                    if (!isAdmin) {
                        alert("Bu sayfaya erişim yetkiniz yok!");
                        window.location.href = 'dashboard.html';
                    }
                } catch (e) {
                    console.error("Auth Error:", e);
                    window.location.href = 'index.html';
                }
            }
        }
    }
})();

// Sidebar Renderer
function renderSidebar() {
    try {
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : {};

        // Robust Admin Check
        const role = (user.role || user.rol || '').toLowerCase();
        const isAdmin = (!!user.isAdmin) || (role === 'admin');

        console.log('Sidebar user:', user, 'isAdmin:', isAdmin);

        const sidebar = document.createElement('div');
        sidebar.className = 'sidebar';

        sidebar.innerHTML = `
            <div class="brand">
                <i class="fas fa-car-crash"></i> Oto Eskpertiz
            </div>
            <nav>
                <a href="dashboard.html" class="nav-link"><i class="fas fa-home"></i> Ana Ekran</a>
                <a href="yeni-rapor.html" class="nav-link"><i class="fas fa-plus-circle"></i> Yeni Rapor</a>
                <a href="pdfler.html" class="nav-link"><i class="fas fa-file-pdf"></i> PDF Yönetimi</a>
                <a href="dosya-isimlendirme.html" class="nav-link"><i class="fas fa-file-signature"></i> Dosya İsimlendirme</a>
                ${isAdmin ? '<a href="ayarlar.html" class="nav-link"><i class="fas fa-cog"></i> Ayarlar</a>' : ''}
                <div class="nav-link" onclick="toggleTheme()" style="cursor: pointer;">
                    <i class="fas fa-moon" id="themeIcon"></i> <span id="themeText">Karanlık Mod</span>
                </div>
                <a href="#" onclick="logout()" class="nav-link" style="margin-top: auto; color: var(--danger);"><i class="fas fa-sign-out-alt"></i> Çıkış</a>
            </nav>
            <div class="mobile-toggle" onclick="toggleSidebar()">
                <i class="fas fa-times"></i>
            </div>
        `;
        const container = document.querySelector('.app-container');
        if (container) {
            // Remove existing sidebar if any (re-render protection)
            const old = container.querySelector('.sidebar');
            if (old) old.remove();

            container.prepend(sidebar);

            // --- MOBILE FEATURES (Isolated for Reliability) ---
            function initMobileFeatures() {
                try {
                    // 1. Ensure Mobile Toggle Button Exists
                    let toggleBtn = document.querySelector('.mobile-toggle-btn');
                    if (!toggleBtn) {
                        toggleBtn = document.createElement('div');
                        toggleBtn.className = 'mobile-toggle-btn mobile-only';
                        toggleBtn.innerHTML = '<i class="fas fa-bars"></i>';
                        document.body.appendChild(toggleBtn);
                        console.log("Mobile toggle init: Created button");
                    }

                    // Force styling fallback in JS
                    if (window.innerWidth <= 992) {
                        toggleBtn.style.setProperty('display', 'flex', 'important');
                    }

                    // 2. Ensure Quick Menu Exists
                    let quickMenu = document.querySelector('.quick-menu-container');
                    const user = JSON.parse(localStorage.getItem('user') || '{}');
                    const role = (user.role || user.rol || '').toLowerCase();
                    const isAdmin = (!!user.isAdmin) || (role === 'admin');

                    if (!quickMenu) {
                        quickMenu = document.createElement('div');
                        quickMenu.className = 'quick-menu-container';
                        quickMenu.innerHTML = `
                <div class="quick-menu-item" data-href="dashboard.html"><i class="fas fa-home"></i> Ana Ekran</div>
                <div class="quick-menu-item" data-href="yeni-rapor.html"><i class="fas fa-plus"></i> Yeni Rapor</div>
                <div class="quick-menu-item" data-href="pdfler.html"><i class="fas fa-file-pdf"></i> PDF</div>
                <div class="quick-menu-item" data-href="dosya-isimlendirme.html"><i class="fas fa-file-signature"></i> Dosya</div>
                ${isAdmin ? '<div class="quick-menu-item" data-href="ayarlar.html"><i class="fas fa-cog"></i> Ayarlar</div>' : ''}
                <div class="quick-menu-item" data-action="toggleSidebar"><i class="fas fa-bars"></i> Tüm Menü</div>
            `;
                        document.body.appendChild(quickMenu);
                    }

                    // 3. Gesture Logic
                    const btn = toggleBtn;
                    const menu = quickMenu;
                    let isDragging = false;
                    let startX = 0;
                    let startY = 0;
                    let startTime = 0;

                    const openMenu = () => {
                        menu.classList.add('show');
                        btn.classList.add('active');
                        try { if (navigator.vibrate) navigator.vibrate(10); } catch (e) { /* ignore */ }
                    };

                    const closeMenu = () => {
                        menu.classList.remove('show');
                        btn.classList.remove('active');
                        menu.querySelectorAll('.quick-menu-item').forEach(el => el.classList.remove('active'));
                    };

                    const handleTouchStart = (e) => {
                        e.preventDefault();
                        isDragging = true;
                        startTime = Date.now();
                        openMenu();
                    };

                    const handleTouchMove = (e) => {
                        if (!isDragging) return;
                        e.preventDefault();
                        const touch = e.touches[0];
                        const target = document.elementFromPoint(touch.clientX, touch.clientY);

                        menu.querySelectorAll('.quick-menu-item').forEach(el => el.classList.remove('active'));
                        if (target) {
                            const item = target.closest('.quick-menu-item');
                            if (item) item.classList.add('active');
                        }
                    };

                    const handleTouchEnd = (e) => {
                        if (!isDragging) return;
                        isDragging = false;

                        const duration = Date.now() - startTime;
                        const activeItem = menu.querySelector('.quick-menu-item.active');

                        if (activeItem) {
                            // Selection made
                            const href = activeItem.getAttribute('data-href');
                            const action = activeItem.getAttribute('data-action');
                            if (href) window.location.href = href;
                            else if (action === 'toggleSidebar') toggleSidebar();
                            closeMenu();
                        } else {
                            // No selection - click vs drag
                            if (duration < 190) { window.location.href = "dashboard.html"; } else {
                                closeMenu();
                            }
                        }
                    };

                    // Bind Events (safely remove old if re-running not supported, but simplified here)
                    btn.removeEventListener('touchstart', handleTouchStart);
                    btn.addEventListener('touchstart', handleTouchStart, { passive: false });

                    btn.removeEventListener('touchmove', handleTouchMove);
                    btn.addEventListener('touchmove', handleTouchMove, { passive: false });
                    document.removeEventListener('touchmove', handleTouchMove); // Clean this? hard to clean anon function without ref. 
                    // For simplicity/robustness, we just add to btn for now or use named functions?
                    // Using named functions above allows removal.
                    // Actually document listener is tricky if we don't scope it. 
                    // Let's stick to btn listener for move if possible? 
                    // No, finger leaves btn. 
                    // Just add proper checks.

                    document.addEventListener('touchmove', (e) => { if (isDragging) handleTouchMove(e); }, { passive: false });

                    btn.removeEventListener('touchend', handleTouchEnd);
                    btn.addEventListener('touchend', handleTouchEnd);
                    document.addEventListener('touchend', (e) => { if (isDragging) handleTouchEnd(e); });

                    // Desktop
                    btn.onclick = (e) => { window.location.href = "dashboard.html"; };
                    btn.addEventListener('mouseenter', openMenu);
                    menu.addEventListener('mouseleave', closeMenu);

                } catch (e) {
                    console.error("Mobile init error:", e);
                }
            }

            // Auto-run mobile init
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', initMobileFeatures);
            } else {
                initMobileFeatures();
            }

            // Immediate check for safety
            initMobileFeatures();

            window.addEventListener('resize', () => {
                // Re-check visibility logic if needed
                const btn = document.querySelector('.mobile-toggle-btn');
                if (btn) {
                    if (window.innerWidth <= 992) {
                        btn.style.setProperty('display', 'flex', 'important');
                    } else {
                        btn.style.display = '';
                    }
                }
            });


        } else {
            console.error('App container not found for sidebar!');
        }

        // ... (Active link logic remains)
        // Set Active Link (Moved inside try block to access sidebar variable)
        const currentPath = window.location.pathname.split('/').pop() || 'dashboard.html';
        const links = sidebar.querySelectorAll('.nav-link');
        links.forEach(link => {
            if (link.getAttribute('href') === currentPath || (currentPath === '/' && link.getAttribute('href') === 'dashboard.html')) {
                link.classList.add('active');
            }
        });

    } catch (e) {
        console.error('Sidebar error:', e);
    }
} // End renderSidebar

// ... (Toast and API Request functions remain same) ...

// Sidebar Toggle (Standard Drawer for content overlay or "Tüm Menü")
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    sidebar.classList.toggle('open');
    let overlay = document.querySelector('.sidebar-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        overlay.onclick = toggleSidebar;
        document.body.appendChild(overlay);
    }
    if (sidebar.classList.contains('open')) overlay.classList.add('show');
    else overlay.classList.remove('show');
}
// --- NOTIFICATION SYSTEM ---
function renderNotificationBell() {
    const container = document.querySelector('.main-content');
    if (!container) return;

    const bellWrapper = document.createElement('div');
    bellWrapper.className = 'notification-wrapper';
    bellWrapper.innerHTML = `
        <div class="bell-icon" onclick="toggleNotifications()">
            <i class="fas fa-bell"></i>
            <span class="badge" id="notificationCount" style="display:none;">0</span>
        </div>
        <div class="notification-dropdown" id="notificationDropdown">
            <div class="dropdown-header">Bildirimler</div>
            <div class="dropdown-body" id="notificationList">
                <div class="empty-state">Bildirim yok</div>
            </div>
        </div>
    `;

    // Style injection if not in CSS
    // Using absolute positioning relative to main-content padding
    bellWrapper.style.cssText = "position: absolute; top: 20px; right: 20px; z-index: 500;";
    container.style.position = 'relative'; // Ensure relative context
    container.appendChild(bellWrapper);

    // Start Polling
    checkNotifications();
    setInterval(checkNotifications, 30000); // Poll every 30s
}

async function checkNotifications() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;

    try {
        // Mock query params since we don't have JWT
        const res = await fetch(`/notifications?userId=${user.id || 999}&role=${user.role || 'Danışman'}`);
        const data = await res.json();

        if (Array.isArray(data)) {
            const unread = data.filter(n => !n.okundu);
            const count = unread.length;
            const badge = document.getElementById('notificationCount');

            if (count > 0) {
                badge.innerText = count;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }

            renderNotificationList(data);
        }
    } catch (e) { console.error("Notif check failed", e); }
}

function renderNotificationList(notifications) {
    const list = document.getElementById('notificationList');
    if (!notifications.length) {
        list.innerHTML = '<div class="empty-state">Bildirim yok</div>';
        return;
    }

    list.innerHTML = notifications.map(n => `
        <div class="notif-item ${n.okundu ? '' : 'unread'}" onclick="markRead(${n.id}, '${n.baglanti || '#'}')">
            <div class="notif-text">${n.mesaj}</div>
            <div class="notif-time">${new Date(n.createdAt).toLocaleTimeString()}</div>
        </div>
    `).join('');
}

function toggleNotifications() {
    const dd = document.getElementById('notificationDropdown');
    dd.classList.toggle('show');
}

async function markRead(id, link) {
    try {
        await apiRequest(`notifications/${id}/read`, 'PUT');
        checkNotifications(); // Refresh
        if (link && link !== '#') window.location.href = link;
    } catch (e) { console.error(e); }
}

function logout() {
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

function toggleTheme() {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeUI(newTheme);
}

function updateThemeUI(theme) {
    const icon = document.getElementById('themeIcon');
    const text = document.getElementById('themeText');
    if (icon && text) {
        // Remove class to reset animation if needed, but better to just add/remove
        icon.classList.remove('rolling-icon');
        void icon.offsetWidth; // Trigger reflow
        icon.classList.add('rolling-icon');

        if (theme === 'dark') {
            icon.className = 'fas fa-sun rolling-icon';
            text.innerText = 'Aydınlık Mod';
        } else {
            icon.className = 'fas fa-moon rolling-icon';
            text.innerText = 'Karanlık Mod';
        }

        // Remove class after animation ends to clean up? Optional.
        setTimeout(() => icon.classList.remove('rolling-icon'), 500);
    }
}

// Init Theme
document.addEventListener('DOMContentLoaded', () => {
    const saved = localStorage.getItem('theme') || 'light';
    if (document.body) document.body.setAttribute('data-theme', saved);
});

// Auto-Render if .app-container exists
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.app-container')) renderSidebar();
});


if (typeof API_URL === 'undefined') {
    var API_URL = 'http://localhost:5000';
}

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

// Navigation Active State
document.addEventListener('DOMContentLoaded', () => {
    const currentPath = window.location.pathname;
    $$('.nav-link').forEach(link => {
        if (link.getAttribute('href') === currentPath || (currentPath === '/' && link.getAttribute('href') === 'dashboard.html')) {
            link.classList.add('active');
        }
    });
});

// Toast Notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
        position: fixed; bottom: 20px; right: 20px; 
        background: ${type === 'success' ? '#10b981' : '#ef4444'}; 
        color: white; padding: 1rem 2rem; border-radius: 0.5rem; 
        box-shadow: 0 4px 6px rgba(0,0,0,0.1); z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-in forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Fetch Wrapper
async function apiRequest(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
    };
    if (body) options.body = JSON.stringify(body);

    try {
        const res = await fetch(endpoint.startsWith('/') ? endpoint : `/${endpoint}`, options);
        if (!res.ok) {
            const text = await res.text();
            console.error("API Response (" + res.status + "):", text);
            throw new Error(`HTTP Error: ${res.status}`);
        }
        return await res.json();
    } catch (err) {
        console.error("API Error:", err);
        showToast("Bir hata oluştu: " + err.message, 'error');
        throw err;
    }
}

// Sidebar Toggle (Mobile)
// Already defined above in the main block used by renderSidebar
// Keeping this here just in case, but usually we should avoid dupes.
// The previous replace replaced the top block.
// We should check if we left the old toggleSidebar at the bottom.
// Based on file view, toggleSidebar was at lines 195-216.
// I will replace this block with an empty string or comment since I moved it up or better, keep it here and remove from top if I didn't put it there.
// Wait, I *did* put it in the top block replacement? No, I put `renderSidebar` and helper.
// The previous replacement updated `renderSidebar` and added the helper at the top.
// Be careful not to duplicate.
// Let's look at what I sent in previous step.
// ReplacementContent included `function toggleSidebar() ...` at the end of the block.
// So I effectively moved it up or duplicated it if I didn't cover the old lines.
// The previous `TargetContent` covered lines 1-44.
// `toggleSidebar` was at 195.
// So now `toggleSidebar` is defined TWICE. Once at top, once at bottom.
// I need to REMOVE the one at the bottom.
w*cascade08wy *cascade08y� *cascade08��*cascade08�� *cascade08��*cascade08�� *cascade08��*cascade08�� *cascade08��*cascade08�� *cascade08��*cascade08�� *cascade08��*cascade08�� *cascade08��*cascade08�� *cascade08��*cascade08�� *cascade08��*cascade08�� *cascade08��*cascade08�� *cascade08��*cascade08�� *cascade08��*cascade08�� *cascade08��*cascade08�� *cascade08��*cascade08�� *cascade08��*cascade08�� *cascade08��*cascade08�� *cascade08��*cascade08�� *cascade08��*cascade08�� *cascade08��*cascade08�� *cascade08��*cascade08�� *cascade08��*cascade08�� *cascade08��*cascade08�� *cascade08��  *cascade08� � *cascade08� �! *cascade08�!�!*cascade08�!�! *cascade08�!�'*cascade08�'�' *cascade08�'�( *cascade08�(�(*cascade08�(�( *cascade08�(�(*cascade08�(�( *cascade08�(�(*cascade08�(�( *cascade08�(�(*cascade08�(�( *cascade08�(�(*cascade08�(�( *cascade08�(�(*cascade08�(�( *cascade08�(�)*cascade08�)�) *cascade08�)�)*cascade08�)�) *cascade08�)�)*cascade08�)�) *cascade08�)�)*cascade08�)�) *cascade08�)�)*cascade08�)�)*cascade08�)�) *cascade08�)�**cascade08�*�* *cascade08�*�**cascade08�*�. *cascade08�.�/�/�1 *cascade08�1�2*cascade08�2�4 *cascade08�4�5*cascade08�5�6 *cascade08�6�7*cascade08�7�7 *cascade08�7�7 *cascade08�7�7*cascade08�7�7 *cascade08�7�8*cascade08�8�8 *cascade08�8�8*cascade08�8�8 *cascade08�8�8*cascade08�8�8 *cascade08�8�8*cascade08�8�8 *cascade08�8�8*cascade08�8�8 *cascade08�8�8*cascade08�8�8 *cascade08�8�8*cascade08�8�8 *cascade08�8�8*cascade08�8�8 *cascade08�8�8*cascade08�8�8 *cascade08�8�8 *cascade08�8�8*cascade08�8�8 *cascade08�8�8*cascade08�8�8 *cascade08�8�9*cascade08�9�9 *cascade08�9�9*cascade08�9�9 *cascade08�9�9*cascade08�9�9 *cascade08�9�9*cascade08�9�9 *cascade08�9�9*cascade08�9�9 *cascade08�9�9*cascade08�9�: *cascade08�:�:*cascade08�:�: *cascade08�:�:*cascade08�:�: *cascade08�:�:*cascade08�:�: *cascade08�:�:*cascade08�:�: *cascade08�:�: *cascade08�:�:*cascade08�:�: *cascade08�:�:*cascade08�:�; *cascade08�;�;*cascade08�;�< *cascade08�<�< *cascade08�<�<*cascade08�<�< *cascade08�<�<�<�< *cascade08�<�<*cascade08�<�< *cascade08�<�<*cascade08�<�< *cascade08�<�<�<�< *cascade08�<�<�<�< *cascade08�<�<�<�< *cascade08�<�<*cascade08�<�< *cascade08�<�<*cascade08�<�< *cascade08�<�<*cascade08�<�< *cascade08�<�<*cascade08�<�< *cascade08�<�<*cascade08�<�< *cascade08�<�< *cascade08�<�<*cascade08�<�< *cascade08�<�<*cascade08�<�< *cascade08�<�<*cascade08�<�< *cascade08�<�< *cascade08�<�< *cascade08�<�=*cascade08�=�= *cascade08�=�=*cascade08�=�= *cascade08�=�=*cascade08�=�= *cascade08�=�=*cascade08�=�= *cascade08�=�=*cascade08�=�=*cascade08�=�=*cascade08�=�> *cascade08�>�>*cascade08�>�> *cascade08�>�>*cascade08�>�> *cascade08�>�>*cascade08�>�>*cascade08�>�> *cascade08�>�>*cascade08�>�> *cascade08�>�>*cascade08�>�> *cascade08�>�>*cascade08�>�> *cascade08�>�>*cascade08�>�> *cascade08�>�>*cascade08�>�> *cascade08�>�> *cascade08�>�?*cascade08�?�? *cascade08�?�?*cascade08�?�? *cascade08�?�?*cascade08�?�? *cascade08�?�?*cascade08�?�? *cascade08�?�?*cascade08�?�? *cascade08�?�?*cascade08�?�@ *cascade08�@�B*cascade08�B�B *cascade08�B�B*cascade08�B�B *cascade08�B�B*cascade08�B�B *cascade08�B�B*cascade08�B�C *cascade08�C�C*cascade08�C�C *cascade08�C�C*cascade08�C�E *cascade08�E�F�F�I *cascade08�I�I*cascade08�I�I *cascade08�I�I*cascade08�I�J *cascade08�J�J*cascade08�J�J *cascade08�J�J*cascade08�J�J *cascade08�J�J*cascade08�J�J *cascade08�J�J*cascade08�J�J *cascade08�J�J*cascade08�J�J *cascade08�J�J*cascade08�J�J *cascade08�J�J*cascade08�J�J *cascade08�J�J*cascade08�J�J *cascade08�J�J*cascade08�J�K *cascade08�K�K*cascade08�K�K *cascade08�K�K*cascade08�K�K *cascade08�K�K*cascade08�K�K *cascade08�K�K*cascade08�K�L *cascade08�L�L*cascade08�L�L *cascade08�L�L*cascade08�L�L *cascade08�L�L*cascade08�L�L *cascade08�L�L *cascade08�L�L*cascade08�L�L *cascade08�L�L*cascade08�L�L *cascade08�L�L*cascade08�L�M *cascade08�M�M*cascade08�M�M *cascade08�M�M*cascade08�M�M *cascade08�M�M *cascade08�M�M*cascade08�M�M *cascade08�M�M *cascade08�M�M*cascade08�M�M*cascade08�M�M*cascade08�M�M *cascade08�M�M*cascade08�M�M *cascade08�M�N*cascade08�N�N *cascade08�N�N*cascade08�N�N *cascade08�N�N*cascade08�N�N *cascade08�N�N*cascade08�N�N *cascade08�N�N*cascade08�N�N *cascade08�N�N*cascade08�N�N*cascade08�N�N*cascade08�N�N *cascade08�N�N*cascade08�N�N *cascade08�N�N *cascade08�N�N *cascade08�N�N*cascade08�N�O *cascade08�O�O*cascade08�O�O *cascade08�O�O*cascade08�O�O *cascade08�O�O*cascade08�O�P *cascade08�P�P*cascade08�P�P *cascade08�P�Q*cascade08�Q�Q *cascade08�Q�Q*cascade08�Q�Q *cascade08�Q�Q*cascade08�Q�Q *cascade08�Q�Q*cascade08�Q�Q *cascade08�Q�Q*cascade08�Q�Q *cascade08�Q�Q*cascade08�Q�Q *cascade08�Q�Q*cascade08�Q�Q *cascade08�Q�Q*cascade08�Q�Q *cascade08�Q�Q*cascade08�Q�Q *cascade08�Q�Q*cascade08�Q�Q *cascade08�Q�Q*cascade08�Q�Q *cascade08�Q�Q*cascade08�Q�Q *cascade08�Q�Q*cascade08�Q�Q *cascade08�Q�Q*cascade08�Q�R *cascade08�R�R*cascade08�R�R *cascade08�R�R*cascade08�R�R *cascade08�R�R*cascade08�R�R *cascade08�R�R*cascade08�R�R *cascade08�R�R*cascade08�R�R *cascade08�R�R*cascade08�R�R *cascade08�R�R*cascade08�R�R*cascade08�R�R *cascade08�R�R*cascade08�R�R *cascade08�R�R*cascade08�R�R *cascade08�R�R*cascade08�R�R *cascade08�R�S*cascade08�S�S *cascade08�S�S *cascade08�S�S*cascade08�S�S *cascade08�S�S*cascade08�S�S *cascade08�S�S*cascade08�S�T *cascade08�T�T*cascade08�T�T *cascade08�T�T*cascade08�T�T *cascade08�T�T*cascade08�T�T *cascade08�T�T*cascade08�T�V *cascade08�V�V*cascade08�V�V *cascade08�V�V*cascade08�V�V *cascade08�V�V*cascade08�V�W *cascade08�W�W*cascade08�W�W *cascade08�W�W*cascade08�W�W *cascade08�W�W*cascade08�W�X *cascade08�X�X*cascade08�X�X *cascade08�X�X*cascade08�X�X *cascade08�X�X*cascade08�X�X *cascade08�X�Y*cascade08�Y�Y *cascade08�Y�Y *cascade08�Y�Y*cascade08�Y�Y *cascade08�Y�Y*cascade08�Y�Y *cascade08�Y�Y*cascade08�Y�Y *cascade08�Y�Z *cascade08�Z�Z*cascade08�Z�Z *cascade08�Z�Z*cascade08�Z�Z *cascade08�Z�[ *cascade08�[�[*cascade08�[�[ *cascade08�[�[*cascade08�[�[ *cascade08�[�[*cascade08�[�[ *cascade08�[�[*cascade08�[�[ *cascade08�[�[*cascade08�[�[ *cascade08�[�[*cascade08�[�[ *cascade08�[�[*cascade08�[�[ *cascade08�[�[*cascade08�[�\ *cascade08�\�\*cascade08�\�] *cascade08�]�]*cascade08�]�] *cascade08�]�]*cascade08�]�]*cascade08�]�] *cascade08�]�]*cascade08�]�]*cascade08�]�] *cascade08�]�^*cascade08�^�^ *cascade08�^�^*cascade08�^�^ *cascade08�^�^*cascade08�^�^ *cascade08�^�^*cascade08�^�^ *cascade08�^�^*cascade08�^�^ *cascade08�^�^*cascade08�^�^ *cascade08�^�^*cascade08�^�^ *cascade08�^�^*cascade08�^�^ *cascade08�^�^*cascade08�^�^ *cascade08�^�^*cascade08�^�^ *cascade08�^�^ *cascade08�^�^ *cascade08�^�^*cascade08�^�^ *cascade08�^�^*cascade08�^�^ *cascade08�^�^*cascade08�^�^ *cascade08�^�^*cascade08�^�^ *cascade08�^�^*cascade08�^�^ *cascade08�^�^*cascade08�^�_ *cascade08�_�_ *cascade08�_�_ *cascade08�_�_*cascade08�_�_ *cascade08�_�_*cascade08�_�_ *cascade08�_�_*cascade08�_�_ *cascade08�_�_*cascade08�_�_ *cascade08�_�_*cascade08�_�_ *cascade08�_�_*cascade08�_�_ *cascade08�_�_*cascade08�_�_ *cascade08�_�_ *cascade08�_�_ *cascade08�_�_ *cascade08�_�_*cascade08�_�_ *cascade08�_�_*cascade08�_�_ *cascade08�_�_*cascade08�_�_ *cascade08�_�_*cascade08�_�_ *cascade08�_�_ *cascade08�_�_*cascade08�_�_ *cascade08�_�_ *cascade08�_�_ *cascade08�_�_*cascade08�_�_ *cascade08�_�`*cascade08�`�` *cascade08�`�`*cascade08�`�` *cascade08�`�`*cascade08�`�` *cascade08�`�`*cascade08�`�` *cascade08�`�`*cascade08�`�` *cascade08�`�`*cascade08�`�` *cascade08�`�a*cascade08�a�a *cascade08�a�a*cascade08�a�a *cascade08�a�a *cascade08�a�a*cascade08�a�a *cascade08�a�a*cascade08�a�a *cascade08�a�a *cascade08�a�a*cascade08�a�a*cascade08�a�a *cascade08�a�a*cascade08�a�a *cascade08�a�a*cascade08�a�a *cascade08�a�a*cascade08�a�a *cascade08�a�a*cascade08�a�a *cascade08�a�a*cascade08�a�a *cascade08�a�a*cascade08�a�a *cascade08�a�a *cascade08�a�a *cascade08�a�a*cascade08�a�a *cascade08�a�a *cascade08�a�a*cascade08�a�a *cascade08�a�a*cascade08�a�a *cascade08�a�a*cascade08�a�a *cascade08�a�a*cascade08�a�a *cascade08�a�a*cascade08�a�b *cascade08�b�b*cascade08�b�b *cascade08�b�b *cascade08�b�b*cascade08�b�b *cascade08�b�b*cascade08�b�b *cascade08�b�b*cascade08�b�b *cascade08�b�b*cascade08�b�b *cascade08�b�b*cascade08�b�b *cascade08�b�b*cascade08�b�b *cascade08�b�b*cascade08�b�b *cascade08�b�b*cascade08�b�b *cascade08�b�b*cascade08�b�b *cascade08�b�b *cascade08�b�b *cascade08�b�b*cascade08�b�b *cascade08�b�b*cascade08�b�b *cascade08�b�b*cascade08�b�b *cascade08�b�b*cascade08�b�b *cascade08�b�b*cascade08�b�b *cascade08�b�b*cascade08�b�b*cascade08�b�b*cascade08�b�b *cascade08�b�b*cascade08�b�b *cascade08�b�c*cascade08�c�c *cascade08�c�c *cascade08�c�c*cascade08�c�c *cascade08�c�c*cascade08�c�c *cascade08�c�c*cascade08�c�c*cascade08�c�c*cascade08�c�c *cascade08�c�c*cascade08�c�c *cascade08�c�c*cascade08�c�c *cascade08�c�c*cascade08�c�c *cascade08�c�c*cascade08�c�c *cascade08�c�c*cascade08�c�c *cascade08�c�c*cascade08�c�c *cascade08�c�c*cascade08�c�c *cascade08�c�c*cascade08�c�c *cascade08�c�c*cascade08�c�c *cascade08�c�c*cascade08�c�c *cascade08�c�c*cascade08�c�c *cascade08�c�c*cascade08�c�c *cascade08�c�c*cascade08�c�c *cascade08�c�c *cascade08�c�c*cascade08�c�c *cascade08�c�c*cascade08�c�c*cascade08�c�c *cascade08�c�c*cascade08�c�c *cascade08�c�c*cascade08�c�c *cascade08�c�d*cascade08�d�d *cascade08�d�d*cascade08�d�d *cascade08�d�d*cascade08�d�d *cascade08�d�d*cascade08�d�d *cascade08�d�d*cascade08�d�d *cascade08�d�d*cascade08�d�d *cascade08�d�d*cascade08�d�d *cascade08�d�d*cascade08�d�d *cascade08�d�d*cascade08�d�d *cascade08�d�d*cascade08�d�d *cascade08�d�d*cascade08�d�d *cascade08�d�d*cascade08�d�d *cascade08�d�d*cascade08�d�d *cascade08�d�e*cascade08�e�e *cascade08�e�e*cascade08�e�e *cascade08�e�e*cascade08�e�e *cascade08�e�e*cascade08�e�e *cascade08�e�e*cascade08�e�e *cascade08�e�e *cascade08�e�e*cascade08�e�e *cascade08�e�e *cascade08�e�e *cascade08�e�e *cascade08�e�e *cascade08�e�e*cascade08�e�e *cascade08�e�e*cascade08�e�e *cascade08�e�e*cascade08�e�e *cascade08�e�e *cascade08�e�e*cascade08�e�e *cascade08�e�e *cascade08�e�e *cascade08�e�e*cascade08�e�e *cascade08�e�e*cascade08�e�e *cascade08�e�e*cascade08�e�e *cascade08�e�e*cascade08�e�e *cascade08�e�e*cascade08�e�e *cascade08�e�e*cascade08�e�e *cascade08�e�e*cascade08�e�e *cascade08�e�e*cascade08�e�e *cascade08�e�e*cascade08�e�f *cascade08�f�f*cascade08�f�f *cascade08�f�f*cascade08�f�f *cascade08�f�f*cascade08�f�f *cascade08�f�f*cascade08�f�f *cascade08�f�f*cascade08�f�f *cascade08�f�f*cascade08�f�f *cascade08�f�f *cascade08�f�f*cascade08�f�f *cascade08�f�f*cascade08�f�f *cascade08�f�f*cascade08�f�f *cascade08�f�f*cascade08�f�f *cascade08�f�f*cascade08�f�f *cascade08�f�f*cascade08�f�f *cascade08�f�f *cascade08�f�f*cascade08�f�f *cascade08�f�f *cascade08�f�f*cascade08�f�f *cascade08�f�f *cascade08�f�f*cascade08�f�f *cascade08�f�f*cascade08�f�f *cascade08�f�f*cascade08�f�f *cascade08�f�f*cascade08�f�f *cascade08�f�f*cascade08�f�f *cascade08�f�g*cascade08�g�g *cascade08�g�g*cascade08�g�g *cascade08�g�g*cascade08�g�g *cascade08�g�g*cascade08�g�g *cascade08�g�g*cascade08�g�g *cascade08�g�g *cascade08�g�g *cascade08�g�g*cascade08�g�g *cascade08�g�g*cascade08�g�g *cascade08�g�g*cascade08�g�g *cascade08�g�g*cascade08�g�g *cascade08�g�g*cascade08�g�g *cascade08�g�g*cascade08�g�g *cascade08�g�g *cascade08�g�g*cascade08�g�g *cascade08�g�g*cascade08�g�g *cascade08�g�g*cascade08�g�g *cascade08�g�g*cascade08�g�g *cascade08�g�g*cascade08�g�g *cascade08�g�g*cascade08�g�g *cascade08�g�g*cascade08�g�g*cascade08�g�g*cascade08�g�g *cascade08�g�g*cascade08�g�g *cascade08�g�g *cascade08�g�g *cascade08�g�g*cascade08�g�g *cascade08�g�g *cascade08�g�g *cascade08�g�h *cascade08�h�h*cascade08�h�h *cascade08�h�h*cascade08�h�h *cascade08�h�h*cascade08�h�h *cascade08�h�h*cascade08�h�h *cascade08�h�h*cascade08�h�h *cascade08�h�h*cascade08�h�h *cascade08�h�h*cascade08�h�h *cascade08�h�h*cascade08�h�h *cascade08�h�h*cascade08�h�h *cascade08�h�h*cascade08�h�h *cascade08�h�h*cascade08�h�h *cascade08�h�h*cascade08�h�h *cascade08�h�h*cascade08�h�h *cascade08�h�h *cascade08�h�h*cascade08�h�h *cascade08�h�h *cascade08�h�h *cascade08�h�h *cascade08�h�h*cascade08�h�h *cascade08�h�h*cascade08�h�h*cascade08�h�h *cascade08�h�h*cascade08�h�h *cascade08�h�h*cascade08�h�h *cascade08�h�h *cascade08�h�h*cascade08�h�h *cascade08�h�i*cascade08�i�i *cascade08�i�i*cascade08�i�i *cascade08�i�i*cascade08�i�i *cascade08�i�i*cascade08�i�i *cascade08�i�i*cascade08�i�i *cascade08�i�i*cascade08�i�i *cascade08�i�j*cascade08�j�j *cascade08�j�j*cascade08�j�j *cascade08�j�j*cascade08�j�j *cascade08�j�j*cascade08�j�j *cascade08�j�j*cascade08�j�k *cascade08�k�k*cascade08�k�k *cascade08�k�k*cascade08�k�k *cascade08�k�k*cascade08�k�k *cascade08�k�l*cascade08�l�l *cascade08�l�l*cascade08�l�l *cascade08�l�l*cascade08�l�l *cascade08�l�l*cascade08�l�l *cascade08�l�l*cascade08�l�l *cascade08�l�l*cascade08�l�l *cascade08�l�l*cascade08�l�l *cascade08�l�l*cascade08�l�l *cascade08�l�l*cascade08�l�l *cascade08�l�l*cascade08�l�l *cascade08�l�l*cascade08�l�l *cascade08�l�l*cascade08�l�l *cascade08�l�l*cascade08�l�l *cascade08�l�l*cascade08�l�l *cascade08�l�l*cascade08�l�l *cascade08�l�l*cascade08�l�m *cascade08�m�m*cascade08�m�m *cascade08�m�m*cascade08�m�m *cascade08�m�m*cascade08�m�m *cascade08�m�m*cascade08�m�m *cascade08�m�m*cascade08�m�m *cascade08�m�m *cascade08�m�m*cascade08�m�m*cascade08�m�m *cascade08�m�m*cascade08�m�m *cascade08�m�m*cascade08�m�m *cascade08�m�m*cascade08�m�m *cascade08�m�m*cascade08�m�m *cascade08�m�m*cascade08�m�m *cascade08�m�m*cascade08�m�m *cascade08�m�m*cascade08�m�m *cascade08�m�m*cascade08�m�m *cascade08�m�m*cascade08�m�m *cascade08�m�m*cascade08�m�m *cascade08�m�n*cascade08�n�n *cascade08�n�n*cascade08�n�n *cascade08�n�n*cascade08�n�n *cascade08�n�n*cascade08�n�n *cascade08�n�n*cascade08�n�n *cascade08�n�n*cascade08�n�n *cascade08�n�n*cascade08�n�n *cascade08�n�n*cascade08�n�n *cascade08�n�n*cascade08�n�n *cascade08�n�n*cascade08�n�n *cascade08�n�n*cascade08�n�n *cascade08�n�n*cascade08�n�n *cascade08�n�n*cascade08�n�n *cascade08�n�n*cascade08�n�n *cascade08�n�n*cascade08�n�n *cascade08�n�n*cascade08�n�n *cascade08�n�n*cascade08�n�n *cascade08�n�n*cascade08�n�n *cascade08�n�n *cascade08�n�n*cascade08�n�n *cascade08�n�o*cascade08�o�o *cascade08�o�o *cascade08�o�o*cascade08�o�o *cascade08�o�o*cascade08�o�o*cascade08�o�o*cascade08�o�o *cascade08�o�o*cascade08�o�o *cascade08�o�o*cascade08�o�o *cascade08�o�o*cascade08�o�o *cascade08�o�o *cascade08�o�p*cascade08�p�p *cascade08�p�p *cascade08�p�p*cascade08�p�p *cascade08�p�p*cascade08�p�p *cascade08�p�p*cascade08�p�p *cascade08�p�p*cascade08�p�p *cascade08�p�p*cascade08�p�p *cascade08�p�p*cascade08�p�p *cascade08�p�p *cascade08�p�p*cascade08�p�p *cascade08�p�p*cascade08�p�p *cascade08�p�p*cascade08�p�p *cascade08�p�p*cascade08�p�p *cascade08�p�r*cascade08�r�r*cascade08�r�r *cascade08�r�r*cascade08�r�r *cascade08�r�r*cascade08�r�r *cascade08�r�r*cascade08�r�r *cascade08�r�r*cascade08�r�r *cascade08�r�r*cascade08�r�r *cascade08�r�r*cascade08�r�r *cascade08�r�r*cascade08�r�r *cascade08�r�r*cascade08�r�r *cascade08�r�r*cascade08�r�r *cascade08�r�r*cascade08�r�r *cascade08�r�r*cascade08�r�r *cascade08�r�r*cascade08�r�r *cascade08�r�r*cascade08�r�r *cascade08�r�r*cascade08�r�s *cascade08�s�s*cascade08�s�s *cascade08�s�s*cascade08�s�s *cascade08�s�s*cascade08�s�s *cascade08�s�s*cascade08�s�s *cascade08�s�s*cascade08�s�s *cascade08�s�s*cascade08�s�s *cascade08�s�s*cascade08�s�s*cascade08�s�s *cascade08�s�s*cascade08�s�s *cascade08�s�s*cascade08�s�s*cascade08�s�s*cascade08�s�s *cascade08�s�s*cascade08�s�s *cascade08�s�s*cascade08�s�s *cascade08�s�s *cascade08�s�s *cascade08�s�s*cascade08�s�s *cascade08�s�s*cascade08�s�s *cascade08�s�s *cascade08�s�s*cascade08�s�s *cascade08�s�s*cascade08�s�s *cascade08�s�s*cascade08�s�s *cascade08�s�t*cascade08�t�t*cascade08�t�t *cascade08�t�t*cascade08�t�t *cascade08�t�t *cascade08�t�t *cascade08�t�t*cascade08�t�t *cascade08�t�u*cascade08�u�u *cascade08�u�u *cascade08�u�u*cascade08�u�u *cascade08�u�u*cascade08�u�u *cascade08�u�u*cascade08�u�u *cascade08�u�u *cascade08�u�v *cascade08�v�v *cascade08�v�v*cascade08�v�v *cascade08�v�v *cascade08�v�v*cascade08�v�v *cascade08�v�w*cascade08�w�w *cascade08�w�w*cascade08�w�w *cascade08�w�w*cascade08�w�w *cascade08�w�w*cascade08�w�w *cascade08�w�w*cascade08�w�w *cascade08�w�w*cascade08�w�w *cascade08�w�w*cascade08�w�w *cascade08�w�w*cascade08�w�w *cascade08�w�w*cascade08�w�w *cascade08�w�w*cascade08�w�w *cascade08�w�w*cascade08�w�x *cascade08�x�x*cascade08�x�x *cascade08�x�x*cascade08�x�x *cascade08�x�x*cascade08�x�x *cascade08�x�y*cascade08�y�y *cascade08�y�y*cascade08�y�y *cascade08�y�z*cascade08�z�z*cascade08�z�z *cascade08�z�z*cascade08�z�z *cascade08�z�z *cascade08�z�z*cascade08�z�z *cascade08�z�z*cascade08�z�z *cascade08�z�z*cascade08�z�z *cascade08�z�{*cascade08�{�{ *cascade08�{�{*cascade08�{�{ *cascade08�{�{*cascade08�{�{ *cascade08�{�{*cascade08�{�{ *cascade08�{�{*cascade08�{�{ *cascade08�{�{*cascade08�{�{ *cascade08�{�{*cascade08�{�{ *cascade08�{�{*cascade08�{�{ *cascade08�{�{*cascade08�{�{ *cascade08�{�| *cascade08�|�|*cascade08�|�| *cascade08�|�|*cascade08�|�| *cascade08�|�|*cascade08�|�| *cascade08�|�|*cascade08�|�| *cascade08�|�}*cascade08�}�} *cascade08�}�} *cascade08�}�*cascade08�� *cascade08�Ý *cascade08Ý��*cascade08��� *cascade08���*cascade08��� *cascade08��*cascade08��� *cascade08����*cascade08��ڢ *cascade08ڢݢ*cascade08ݢޢ *cascade08ޢ�*cascade08�� *cascade08��*cascade08�� *cascade08��*cascade08�� *cascade08���*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08��ң *cascade08ң�*cascade08��� *cascade08��˥ *cascade08˥ӥ*cascade08ӥԥ *cascade08ԥ�*cascade08�� *cascade08���*cascade08���� *cascade08����*cascade08��� *cascade08��*cascade08��� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08��ƶ *cascade08ƶȶ*cascade08ȶɶ *cascade08ɶж*cascade08жѶ *cascade08Ѷն*cascade08նֶ *cascade08ֶڶ*cascade08ڶ۶ *cascade08۶ݶ*cascade08ݶ� *cascade08��*cascade08�� *cascade08��*cascade08�� *cascade08��*cascade08�� *cascade08��*cascade08��� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08��÷*cascade08÷ķ *cascade08ķʷ*cascade08ʷ˷ *cascade08˷ַ*cascade08ַٷ *cascade08ٷڷ*cascade08ڷܷ *cascade08ܷ޷*cascade08޷߷ *cascade08߷�*cascade08�� *cascade08��*cascade08�� *cascade08��*cascade08�� *cascade08���*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08��¸*cascade08¸ø *cascade08øǸ*cascade08Ǹȸ *cascade08ȸϸ*cascade08ϸи *cascade08иԸ*cascade08Ըո *cascade08ոڸ*cascade08ڸ۸ *cascade08۸߸*cascade08߸� *cascade08��*cascade08�� *cascade08��*cascade08�� *cascade08��*cascade08�� *cascade08��*cascade08�� *cascade08���*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08��ƹ*cascade08ƹǹ *cascade08ǹʹ*cascade08ʹ˹ *cascade08˹͹*cascade08͹ι *cascade08ιй*cascade08йֹ *cascade08ֹع*cascade08عٹ *cascade08ٹ޹*cascade08޹߹ *cascade08߹�*cascade08�� *cascade08��*cascade08�� *cascade08��*cascade08�� *cascade08��*cascade08�� *cascade08��*cascade08��� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08��̺*cascade08̺ͺ *cascade08ͺѺ*cascade08ѺҺ *cascade08Һֺ*cascade08ֺ׺ *cascade08׺غ*cascade08غٺ *cascade08ٺ�*cascade08�� *cascade08��*cascade08�� *cascade08��*cascade08�� *cascade08��*cascade08�� *cascade08��*cascade08�� *cascade08��*cascade08��� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08��» *cascade08»ƻ*cascade08ƻǻ *cascade08ǻɻ*cascade08ɻʻ *cascade08ʻͻ*cascade08ͻλ *cascade08λ޻*cascade08޻߻ *cascade08߻�*cascade08�� *cascade08��*cascade08�� *cascade08��*cascade08�� *cascade08���*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08��Ƽ*cascade08ƼǼ *cascade08Ǽɼ*cascade08ɼʼ *cascade08ʼͼ*cascade08ͼμ *cascade08μҼ*cascade08ҼӼ *cascade08Ӽռ*cascade08ռּ *cascade08ּۼ*cascade08ۼܼ *cascade08ܼݼ*cascade08ݼ޼ *cascade08޼�*cascade08�� *cascade08��*cascade08��� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08��½*cascade08½Ľ *cascade08Ľƽ*cascade08ƽǽ *cascade08ǽɽ*cascade08ɽʽ *cascade08ʽ̽*cascade08̽ͽ *cascade08ͽӽ*cascade08ӽԽ *cascade08Խؽ*cascade08ؽڽ *cascade08ڽܽ*cascade08ܽݽ *cascade08ݽ߽*cascade08߽� *cascade08��*cascade08�� *cascade08��*cascade08�� *cascade08���*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08����*cascade08���� *cascade08��¾*cascade08¾þ *cascade08þƾ*cascade08ƾǾ *cascade08Ǿξ*cascade08ξо *cascade082@file:///c:/Users/Emmi/Documents/ekspertiz-node/public/js/main.js