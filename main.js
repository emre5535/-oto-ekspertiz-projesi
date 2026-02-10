Ğ¾// Helper
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
            <h2 style="margin: 0 0 10px; color: #333;">KaydedilmemiÅŸ DeÄŸiÅŸiklikler!</h2>
                BaÄŸlantÄ±dan ayrÄ±lÄ±rsanÄ±z yaptÄ±ÄŸÄ±nÄ±z deÄŸiÅŸiklikler kaydedilmeyecek.
            </p>
            <div style="display: flex; gap: 10px;">
                <button id="btnStay" style="
                    flex: 1; padding: 12px; border: 1px solid #ddd; background: white; 
                    color: #555; border-radius: 6px; cursor: pointer; font-weight: bold;
                    transition: all 0.2s;
                ">VazgeÃ§, DÃ¼zenlemeye Devam Et</button>
                <button id="btnLeave" style="
                    flex: 1; padding: 12px; border: none; background: #ef4444; 
                    color: white; border-radius: 6px; cursor: pointer; font-weight: bold;
                    box-shadow: 0 4px 6px rgba(239, 68, 68, 0.3); transition: all 0.2s;
                ">DeÄŸiÅŸiklikleri Kaydetmeden Ã‡Ä±k</button>
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
                        alert("Bu sayfaya eriÅŸim yetkiniz yok!");
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
                <a href="pdfler.html" class="nav-link"><i class="fas fa-file-pdf"></i> PDF YÃ¶netimi</a>
                <a href="dosya-isimlendirme.html" class="nav-link"><i class="fas fa-file-signature"></i> Dosya Ä°simlendirme</a>
                ${isAdmin ? '<a href="ayarlar.html" class="nav-link"><i class="fas fa-cog"></i> Ayarlar</a>' : ''}
                <div class="nav-link" onclick="toggleTheme()" style="cursor: pointer;">
                    <i class="fas fa-moon" id="themeIcon"></i> <span id="themeText">KaranlÄ±k Mod</span>
                </div>
                <a href="#" onclick="logout()" class="nav-link" style="margin-top: auto; color: var(--danger);"><i class="fas fa-sign-out-alt"></i> Ã‡Ä±kÄ±ÅŸ</a>
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
                <div class="quick-menu-item" data-action="toggleSidebar"><i class="fas fa-bars"></i> TÃ¼m MenÃ¼</div>
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
                            if (duration < 300) {
                                toggleSidebar();
                                closeMenu();
                            } else {
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
                    btn.onclick = (e) => { if (Date.now() - startTime < 500) return; toggleSidebar(); };
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

// Sidebar Toggle (Standard Drawer for content overlay or "TÃ¼m MenÃ¼")
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
        const res = await fetch(`/notifications?userId=${user.id || 999}&role=${user.role || 'DanÄ±ÅŸman'}`);
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
            text.innerText = 'AydÄ±nlÄ±k Mod';
        } else {
            icon.className = 'fas fa-moon rolling-icon';
            text.innerText = 'KaranlÄ±k Mod';
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
        showToast("Bir hata oluÅŸtu: " + err.message, 'error');
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
w*cascade08wy *cascade08y¹ *cascade08¹º*cascade08º¼ *cascade08¼½*cascade08½¾ *cascade08¾Â*cascade08ÂÄ *cascade08ÄÉ*cascade08ÉÊ *cascade08ÊÏ*cascade08ÏĞ *cascade08ĞÕ*cascade08ÕÖ *cascade08ÖÙ*cascade08ÙÚ *cascade08ÚÛ*cascade08Ûü *cascade08üş*cascade08şÿ *cascade08ÿ€*cascade08€ƒ *cascade08ƒ„*cascade08„… *cascade08…†*cascade08†‡ *cascade08‡‰*cascade08‰ù *cascade08ù‰*cascade08‰Š *cascade08Š*cascade08ß *cascade08ßë*cascade08ëí *cascade08íï*cascade08ïó *cascade08óô*cascade08ôö *cascade08ö*cascade08î *cascade08î*cascade08· *cascade08·Â*cascade08ÂË *cascade08Ëƒ*cascade08ƒ¼ *cascade08¼Ş  *cascade08Ş á *cascade08á “! *cascade08“!–!*cascade08–!Ì! *cascade08Ì!–'*cascade08–'µ' *cascade08µ'( *cascade08(„(*cascade08„(£( *cascade08£(º(*cascade08º(»( *cascade08»(Ú(*cascade08Ú(Ş( *cascade08Ş(à(*cascade08à(ê( *cascade08ê(î(*cascade08î(ï( *cascade08ï(ñ(*cascade08ñ(ú( *cascade08ú(”)*cascade08”)­) *cascade08­)¯)*cascade08¯)±) *cascade08±)Ô)*cascade08Ô)Ú) *cascade08Ú)Û)*cascade08Û)Ü) *cascade08Ü)İ)*cascade08İ)ß)*cascade08ß)ì) *cascade08ì)‚**cascade08‚*ƒ* *cascade08ƒ*…**cascade08…*À. *cascade08À.ª/ª/˜1 *cascade08˜1ó2*cascade08ó2ı4 *cascade08ı45*cascade085•6 *cascade08•6¿7*cascade08¿7Ú7 *cascade08Ú7í7 *cascade08í7ú7*cascade08ú7û7 *cascade08û7‰8*cascade08‰8‹8 *cascade08‹8Œ8*cascade08Œ88 *cascade088”8*cascade08”8—8 *cascade08—8¥8*cascade08¥8§8 *cascade08§8®8*cascade08®8¯8 *cascade08¯8±8*cascade08±8²8 *cascade08²8³8*cascade08³8¶8 *cascade08¶8¾8*cascade08¾8¿8 *cascade08¿8Â8*cascade08Â8Ã8 *cascade08Ã8Ä8 *cascade08Ä8Ê8*cascade08Ê8Ë8 *cascade08Ë8Ş8*cascade08Ş8ß8 *cascade08ß8‰9*cascade08‰9Š9 *cascade08Š99*cascade0899 *cascade089“9*cascade08“9•9 *cascade08•9˜9*cascade08˜9š9 *cascade08š9¡9*cascade08¡9£9 *cascade08£9«9*cascade08«9‚: *cascade08‚:…:*cascade08…:‹: *cascade08‹:Œ:*cascade08Œ:: *cascade08::*cascade08:™: *cascade08™:›:*cascade08›:¥: *cascade08¥:á: *cascade08á:æ:*cascade08æ:ö: *cascade08ö:ù:*cascade08ù:±; *cascade08±;¹;*cascade08¹;< *cascade08<—< *cascade08—<˜<*cascade08˜<™< *cascade08™<œ<œ<< *cascade08<Ÿ<*cascade08Ÿ< < *cascade08 <¡<*cascade08¡<¢< *cascade08¢<©<©<ª< *cascade08ª<­<­<®< *cascade08®<±<±<·< *cascade08·<»<*cascade08»<Î< *cascade08Î<Ö<*cascade08Ö<×< *cascade08×<Ü<*cascade08Ü<Ş< *cascade08Ş<å<*cascade08å<æ< *cascade08æ<ë<*cascade08ë<ì< *cascade08ì<ñ< *cascade08ñ<ò<*cascade08ò<ó< *cascade08ó<ö<*cascade08ö<÷< *cascade08÷<ø<*cascade08ø<ı< *cascade08ı<ş< *cascade08ş<ÿ< *cascade08ÿ<Å=*cascade08Å=Æ= *cascade08Æ=Ç=*cascade08Ç=È= *cascade08È=É=*cascade08É=Ê= *cascade08Ê=ò=*cascade08ò=ô= *cascade08ô=ú=*cascade08ú=û=*cascade08û=ş=*cascade08ş=€> *cascade08€>>*cascade08>‚> *cascade08‚>¦>*cascade08¦>§> *cascade08§>µ>*cascade08µ>Â>*cascade08Â>Ã> *cascade08Ã>È>*cascade08È>É> *cascade08É>Ë>*cascade08Ë>Ò> *cascade08Ò>à>*cascade08à>ã> *cascade08ã>æ>*cascade08æ>ò> *cascade08ò>÷>*cascade08÷>ø> *cascade08ø>ü> *cascade08ü>€?*cascade08€?Œ? *cascade08Œ??*cascade08?“? *cascade08“?œ?*cascade08œ?¨? *cascade08¨?¬?*cascade08¬?­? *cascade08­?®?*cascade08®?°? *cascade08°?¸?*cascade08¸?’@ *cascade08’@ŒB*cascade08ŒBŸB *cascade08ŸB¢B*cascade08¢B²B *cascade08²B·B*cascade08·BãB *cascade08ãBëB*cascade08ëBªC *cascade08ªC®C*cascade08®C¾C *cascade08¾CÂC*cascade08ÂC¿E *cascade08¿E¯F¯FÂI *cascade08ÂIÆI*cascade08ÆIËI *cascade08ËIÎI*cascade08ÎI‘J *cascade08‘J™J*cascade08™JJ *cascade08JŸJ*cascade08ŸJ«J *cascade08«J²J*cascade08²JµJ *cascade08µJ·J*cascade08·J¹J *cascade08¹J¿J*cascade08¿JÁJ *cascade08ÁJÅJ*cascade08ÅJÇJ *cascade08ÇJÌJ*cascade08ÌJØJ *cascade08ØJÛJ*cascade08ÛJóJ *cascade08óJøJ*cascade08øJ„K *cascade08„K‡K*cascade08‡KÍK *cascade08ÍKÓK*cascade08ÓKßK *cascade08ßKáK*cascade08áKòK *cascade08òKøK*cascade08øK„L *cascade08„L†L*cascade08†L—L *cascade08—LL*cascade08L©L *cascade08©L«L*cascade08«L¿L *cascade08¿LÁL *cascade08ÁLÈL*cascade08ÈLÔL *cascade08ÔLÕL*cascade08ÕLïL *cascade08ïLöL*cascade08öL†M *cascade08†M‡M*cascade08‡M¤M *cascade08¤M¬M*cascade08¬MØM *cascade08ØMÚM *cascade08ÚMáM*cascade08áMåM *cascade08åMçM *cascade08çMñM*cascade08ñMòM*cascade08òMøM*cascade08øMùM *cascade08ùMüM*cascade08üMşM *cascade08şMN*cascade08N‚N *cascade08‚NŒN*cascade08ŒNN *cascade08NN*cascade08NN *cascade08N›N*cascade08›NœN *cascade08œNN*cascade08NŸN *cascade08ŸN¥N*cascade08¥NÂN*cascade08ÂNÇN*cascade08ÇNÈN *cascade08ÈNÊN*cascade08ÊNËN *cascade08ËNÌN *cascade08ÌNŞN *cascade08ŞNæN*cascade08æNO *cascade08O¥O*cascade08¥OÅO *cascade08ÅOÍO*cascade08ÍOşO *cascade08şOÿO*cascade08ÿOP *cascade08P–P*cascade08–PûP *cascade08ûPƒQ*cascade08ƒQQ *cascade08QŸQ*cascade08ŸQ¢Q *cascade08¢Q¥Q*cascade08¥Q¦Q *cascade08¦Q¨Q*cascade08¨Q©Q *cascade08©QªQ*cascade08ªQ®Q *cascade08®Q¯Q*cascade08¯Q³Q *cascade08³QµQ*cascade08µQÖQ *cascade08ÖQÙQ*cascade08ÙQÚQ *cascade08ÚQİQ*cascade08İQáQ *cascade08áQâQ*cascade08âQãQ *cascade08ãQåQ*cascade08åQæQ *cascade08æQçQ*cascade08çQêQ *cascade08êQëQ*cascade08ëQíQ *cascade08íQõQ*cascade08õQ…R *cascade08…RR*cascade08RR *cascade08R”R*cascade08”R•R *cascade08•R–R*cascade08–R³R *cascade08³R¹R*cascade08¹R»R *cascade08»R¼R*cascade08¼R½R *cascade08½RÀR*cascade08ÀRÂR *cascade08ÂRÊR*cascade08ÊRÒR*cascade08ÒRãR *cascade08ãRäR*cascade08äRæR *cascade08æRçR*cascade08çRéR *cascade08éRíR*cascade08íRşR *cascade08şR‚S*cascade08‚S…S *cascade08…S©S *cascade08©S®S*cascade08®S¿S *cascade08¿SÂS*cascade08ÂSÒS *cascade08ÒS×S*cascade08×ST *cascade08T‰T*cascade08‰TœT *cascade08œTT*cascade08T¤T *cascade08¤T¦T*cascade08¦TÓT *cascade08ÓTÛT*cascade08ÛT§V *cascade08§V¯V*cascade08¯VÎV *cascade08ÎVÏV*cascade08ÏVãV *cascade08ãVêV*cascade08êV¸W *cascade08¸WºW*cascade08ºW»W *cascade08»WÁW*cascade08ÁWõW *cascade08õWùW*cascade08ùWªX *cascade08ªX«X*cascade08«XËX *cascade08ËXÌX*cascade08ÌXÜX *cascade08ÜXãX*cascade08ãXıX *cascade08ıX…Y*cascade08…Y¼Y *cascade08¼YÕY *cascade08ÕYØY*cascade08ØYÙY *cascade08ÙYÚY*cascade08ÚYÛY *cascade08ÛYßY*cascade08ßYşY *cascade08şYÉZ *cascade08ÉZËZ*cascade08ËZÛZ *cascade08ÛZãZ*cascade08ãZöZ *cascade08öZ[ *cascade08[[*cascade08[’[ *cascade08’[”[*cascade08”[•[ *cascade08•[–[*cascade08–[™[ *cascade08™[ [*cascade08 [¢[ *cascade08¢[£[*cascade08£[¥[ *cascade08¥[©[*cascade08©[½[ *cascade08½[Á[*cascade08Á[õ[ *cascade08õ[ı[*cascade08ı[É\ *cascade08É\Ñ\*cascade08Ñ\¡] *cascade08¡]©]*cascade08©]Î] *cascade08Î]à]*cascade08à]á]*cascade08á]õ] *cascade08õ]ü]*cascade08ü]ı]*cascade08ı]ş] *cascade08ş]€^*cascade08€^^ *cascade08^‚^*cascade08‚^ƒ^ *cascade08ƒ^…^*cascade08…^Š^ *cascade08Š^’^*cascade08’^¢^ *cascade08¢^£^*cascade08£^¤^ *cascade08¤^¨^*cascade08¨^©^ *cascade08©^ª^*cascade08ª^¼^ *cascade08¼^¿^*cascade08¿^À^ *cascade08À^È^*cascade08È^Ë^ *cascade08Ë^Í^*cascade08Í^Ï^ *cascade08Ï^Ñ^ *cascade08Ñ^Ô^ *cascade08Ô^×^*cascade08×^Ø^ *cascade08Ø^Ù^*cascade08Ù^Ú^ *cascade08Ú^Ü^*cascade08Ü^İ^ *cascade08İ^â^*cascade08â^ã^ *cascade08ã^ç^*cascade08ç^ş^ *cascade08ş^ÿ^*cascade08ÿ^ƒ_ *cascade08ƒ_„_ *cascade08„_…_ *cascade08…_‡_*cascade08‡_ˆ_ *cascade08ˆ_Š_*cascade08Š_‹_ *cascade08‹__*cascade08__ *cascade08__*cascade08_’_ *cascade08’_“_*cascade08“_”_ *cascade08”_˜_*cascade08˜_™_ *cascade08™_š_*cascade08š_³_ *cascade08³_µ_ *cascade08µ_¶_ *cascade08¶_¸_ *cascade08¸_»_*cascade08»_¼_ *cascade08¼_½_*cascade08½_Â_ *cascade08Â_Ü_*cascade08Ü_İ_ *cascade08İ_í_*cascade08í_î_ *cascade08î_ï_ *cascade08ï_ó_*cascade08ó_ô_ *cascade08ô_õ_ *cascade08õ_÷_ *cascade08÷_ü_*cascade08ü_ı_ *cascade08ı_š`*cascade08š`›` *cascade08›``*cascade08`` *cascade08`Á`*cascade08Á`Â` *cascade08Â`Ä`*cascade08Ä`Å` *cascade08Å`È`*cascade08È`Ê` *cascade08Ê`Ì`*cascade08Ì`Í` *cascade08Í`…a*cascade08…a†a *cascade08†a—a*cascade08—a˜a *cascade08˜a™a *cascade08™a¢a*cascade08¢a»a *cascade08»aÅa*cascade08ÅaÆa *cascade08ÆaÇa *cascade08ÇaÈa*cascade08ÈaÉa*cascade08ÉaÊa *cascade08ÊaÎa*cascade08ÎaÏa *cascade08ÏaÒa*cascade08ÒaÓa *cascade08ÓaÕa*cascade08Õa×a *cascade08×aŞa*cascade08Şaßa *cascade08ßaâa*cascade08âaãa *cascade08ãaça*cascade08çaèa *cascade08èaéa *cascade08éaêa *cascade08êaëa*cascade08ëaìa *cascade08ìaía *cascade08íağa*cascade08ğaña *cascade08ñaöa*cascade08öa÷a *cascade08÷aùa*cascade08ùaúa *cascade08úaûa*cascade08ûaüa *cascade08üaÿa*cascade08ÿa€b *cascade08€bƒb*cascade08ƒb…b *cascade08…b†b *cascade08†b‡b*cascade08‡bˆb *cascade08ˆb‹b*cascade08‹b¡b *cascade08¡b¢b*cascade08¢b£b *cascade08£b¦b*cascade08¦b§b *cascade08§bªb*cascade08ªb«b *cascade08«b­b*cascade08­b®b *cascade08®b²b*cascade08²b³b *cascade08³b´b*cascade08´bµb *cascade08µbºb*cascade08ºb»b *cascade08»b½b *cascade08½b¾b *cascade08¾bÃb*cascade08ÃbÄb *cascade08ÄbÅb*cascade08ÅbÇb *cascade08ÇbÈb*cascade08ÈbÉb *cascade08ÉbÌb*cascade08ÌbÍb *cascade08ÍbÏb*cascade08ÏbÑb *cascade08ÑbÓb*cascade08ÓbÔb*cascade08ÔbÙb*cascade08Ùbïb *cascade08ïbüb*cascade08übıb *cascade08ıb‹c*cascade08‹cŒc *cascade08Œcc *cascade08c‘c*cascade08‘c’c *cascade08’c“c*cascade08“c”c *cascade08”c˜c*cascade08˜c™c*cascade08™cŸc*cascade08Ÿc c *cascade08 c¢c*cascade08¢c¤c *cascade08¤c§c*cascade08§cªc *cascade08ªc¬c*cascade08¬c­c *cascade08­c®c*cascade08®c¯c *cascade08¯c³c*cascade08³c´c *cascade08´c¼c*cascade08¼c½c *cascade08½cÇc*cascade08ÇcÈc *cascade08ÈcÑc*cascade08ÑcÒc *cascade08Òc×c*cascade08×cØc *cascade08ØcÙc*cascade08ÙcÚc *cascade08ÚcÜc*cascade08Ücİc *cascade08İcàc*cascade08àcác *cascade08ácâc*cascade08âcãc *cascade08ãcåc *cascade08åcéc*cascade08écêc *cascade08êcëc*cascade08ëcôc*cascade08ôcõc *cascade08õcùc*cascade08ùcúc *cascade08úcşc*cascade08şcÿc *cascade08ÿc†d*cascade08†dœd *cascade08œd©d*cascade08©dªd *cascade08ªd½d*cascade08½d¾d *cascade08¾dÁd*cascade08ÁdÂd *cascade08ÂdÆd*cascade08ÆdÇd *cascade08ÇdÒd*cascade08ÒdÓd *cascade08ÓdÕd*cascade08ÕdÖd *cascade08ÖdÙd*cascade08ÙdÚd *cascade08Údßd*cascade08ßdàd *cascade08àdád*cascade08ádâd *cascade08âdãd*cascade08ãdåd *cascade08ådèd*cascade08èdùd *cascade08ùdúd*cascade08údûd *cascade08ûd‚e*cascade08‚eƒe *cascade08ƒeŒe*cascade08Œee *cascade08e—e*cascade08—e˜e *cascade08˜e¢e*cascade08¢e£e *cascade08£e©e*cascade08©eªe *cascade08ªe«e *cascade08«e¹e*cascade08¹eºe *cascade08ºe»e *cascade08»e¼e *cascade08¼e½e *cascade08½e¾e *cascade08¾eÀe*cascade08ÀeÁe *cascade08ÁeÅe*cascade08ÅeÇe *cascade08ÇeÈe*cascade08ÈeÉe *cascade08ÉeÊe *cascade08ÊeÏe*cascade08ÏeÑe *cascade08ÑeÒe *cascade08ÒeÓe *cascade08ÓeÔe*cascade08ÔeÕe *cascade08ÕeÖe*cascade08Öe×e *cascade08×eØe*cascade08ØeÙe *cascade08ÙeÚe*cascade08ÚeÛe *cascade08ÛeŞe*cascade08Şeße *cascade08ßeåe*cascade08åeæe *cascade08æeçe*cascade08çeèe *cascade08èeée*cascade08éeêe *cascade08êeíe*cascade08íe†f *cascade08†f‰f*cascade08‰fŠf *cascade08Šff*cascade08ff *cascade08f‘f*cascade08‘f’f *cascade08’f›f*cascade08›fœf *cascade08œf f*cascade08 f¡f *cascade08¡f¢f*cascade08¢f£f *cascade08£f¤f *cascade08¤f¦f*cascade08¦f§f *cascade08§f¨f*cascade08¨fªf *cascade08ªf°f*cascade08°f±f *cascade08±f³f*cascade08³fµf *cascade08µf·f*cascade08·f¸f *cascade08¸f¾f*cascade08¾f¿f *cascade08¿fÀf *cascade08ÀfÂf*cascade08ÂfÄf *cascade08ÄfÅf *cascade08ÅfÌf*cascade08ÌfÑf *cascade08ÑfÒf *cascade08ÒfÓf*cascade08Óféf *cascade08éfëf*cascade08ëfìf *cascade08ìfñf*cascade08ñfòf *cascade08òf÷f*cascade08÷føf *cascade08øfüf*cascade08üfıf *cascade08ıf„g*cascade08„g…g *cascade08…g‰g*cascade08‰gŠg *cascade08Šgg*cascade08g‘g *cascade08‘g”g*cascade08”g•g *cascade08•g—g*cascade08—g™g *cascade08™gšg *cascade08šg­g *cascade08­g¯g*cascade08¯g°g *cascade08°g±g*cascade08±g²g *cascade08²gµg*cascade08µg¶g *cascade08¶gºg*cascade08ºg»g *cascade08»g¾g*cascade08¾gÀg *cascade08ÀgÁg*cascade08ÁgÂg *cascade08ÂgÃg *cascade08ÃgÄg*cascade08ÄgÅg *cascade08ÅgÆg*cascade08ÆgÇg *cascade08ÇgÍg*cascade08ÍgÎg *cascade08ÎgĞg*cascade08ĞgÓg *cascade08ÓgÔg*cascade08ÔgÕg *cascade08Õg×g*cascade08×gÚg *cascade08Úgİg*cascade08İgŞg*cascade08Şgàg*cascade08àgág *cascade08ágãg*cascade08ãgäg *cascade08ägæg *cascade08ægèg *cascade08ègêg*cascade08êgëg *cascade08ëgşg *cascade08şgÿg *cascade08ÿgh *cascade08hƒh*cascade08ƒh„h *cascade08„h…h*cascade08…h†h *cascade08†h—h*cascade08—h˜h *cascade08˜h™h*cascade08™hšh *cascade08šh›h*cascade08›hœh *cascade08œhŸh*cascade08Ÿh h *cascade08 h£h*cascade08£h¤h *cascade08¤h¨h*cascade08¨h©h *cascade08©h«h*cascade08«h¬h *cascade08¬hµh*cascade08µh¶h *cascade08¶h¸h*cascade08¸hÏh *cascade08ÏhĞh*cascade08ĞhÑh *cascade08ÑhÕh*cascade08Õh×h *cascade08×hØh *cascade08ØhÙh*cascade08ÙhÚh *cascade08ÚhÛh *cascade08ÛhÜh *cascade08Ühİh *cascade08İhŞh*cascade08Şhßh *cascade08ßhàh*cascade08àhâh*cascade08âhäh *cascade08ähåh*cascade08åhæh *cascade08æhèh*cascade08èhéh *cascade08éhüh *cascade08ühşh*cascade08şhÿh *cascade08ÿhƒi*cascade08ƒi„i *cascade08„i‡i*cascade08‡iˆi *cascade08ˆii*cascade08ii *cascade08i”i*cascade08”i•i *cascade08•i˜i*cascade08˜iši *cascade08šii*cascade08i®i *cascade08®i‚j*cascade08‚jƒj *cascade08ƒj›j*cascade08›j±j *cascade08±jÔj*cascade08ÔjÕj *cascade08Õjçj*cascade08çjîj *cascade08îjïj*cascade08ïj¢k *cascade08¢k§k*cascade08§k®k *cascade08®k°k*cascade08°k¼k *cascade08¼kÂk*cascade08Âkèk *cascade08èkl*cascade08l‡l *cascade08‡lŒl*cascade08Œll *cascade08l•l*cascade08•l§l *cascade08§l¯l*cascade08¯l²l *cascade08²l³l*cascade08³l´l *cascade08´l¶l*cascade08¶l·l *cascade08·lĞl*cascade08ĞlÑl *cascade08ÑlÓl*cascade08ÓlÕl *cascade08ÕlÜl*cascade08Ülİl *cascade08İlçl*cascade08çlél *cascade08élêl*cascade08êlël *cascade08ëlìl*cascade08ìlíl *cascade08ílğl*cascade08ğlñl *cascade08ñlôl*cascade08ôlõl *cascade08õløl*cascade08ølùl *cascade08ùlÿl*cascade08ÿl€m *cascade08€mŠm*cascade08Šm‹m *cascade08‹mm*cascade08mm *cascade08m’m*cascade08’m“m *cascade08“m£m*cascade08£m¥m *cascade08¥m¬m*cascade08¬m¯m *cascade08¯m°m *cascade08°m¸m*cascade08¸m¹m*cascade08¹mºm *cascade08ºm½m*cascade08½m¾m *cascade08¾mÍm*cascade08ÍmÎm *cascade08ÎmĞm*cascade08ĞmÑm *cascade08ÑmÓm*cascade08ÓmÖm *cascade08ÖmØm*cascade08ØmÙm *cascade08ÙmÛm*cascade08ÛmÜm *cascade08Ümám*cascade08ámâm *cascade08âmäm*cascade08ämåm *cascade08åmæm*cascade08æmèm *cascade08èmğm*cascade08ğmüm *cascade08ümŒn*cascade08Œnn *cascade08nn*cascade08nn *cascade08n”n*cascade08”n•n *cascade08•n n*cascade08 n¢n *cascade08¢n¦n*cascade08¦n§n *cascade08§n©n*cascade08©nªn *cascade08ªn«n*cascade08«n­n *cascade08­n³n*cascade08³n¿n *cascade08¿nÀn*cascade08ÀnÂn *cascade08ÂnÈn*cascade08ÈnÉn *cascade08Énİn*cascade08İnŞn *cascade08Şnán*cascade08ánân *cascade08ânãn*cascade08ãnän *cascade08änån*cascade08ånæn *cascade08ænçn*cascade08çnén *cascade08énên*cascade08ênën *cascade08ënín*cascade08ínïn *cascade08ïnön*cascade08ön÷n *cascade08÷nøn *cascade08ønûn*cascade08ûnün *cascade08ün€o*cascade08€oo *cascade08o‚o *cascade08‚o…o*cascade08…o‡o *cascade08‡oo*cascade08oo*cascade08o­o*cascade08­o¾o *cascade08¾oÊo*cascade08ÊoÌo *cascade08ÌoÎo*cascade08ÎoÏo *cascade08ÏoĞo*cascade08ĞoÑo *cascade08Ñoào *cascade08àošp*cascade08špœp *cascade08œpp *cascade08p£p*cascade08£p¤p *cascade08¤pªp*cascade08ªp«p *cascade08«p¬p*cascade08¬p­p *cascade08­p¹p*cascade08¹p»p *cascade08»pÇp*cascade08ÇpÈp *cascade08ÈpÊp*cascade08ÊpËp *cascade08ËpÌp *cascade08ÌpÍp*cascade08ÍpÎp *cascade08ÎpĞp*cascade08ĞpÒp *cascade08Òp×p*cascade08×pÚp *cascade08ÚpÜp*cascade08Üpêp *cascade08êpˆr*cascade08ˆrŠr*cascade08Šr‹r *cascade08‹rr*cascade08rr *cascade08r•r*cascade08•r–r *cascade08–r˜r*cascade08˜r™r *cascade08™r©r*cascade08©r«r *cascade08«r±r*cascade08±rÆr *cascade08ÆrÊr*cascade08ÊrÏr *cascade08ÏrÖr*cascade08ÖrØr *cascade08ØrÛr*cascade08ÛrÜr *cascade08ÜrŞr*cascade08Şrár *cascade08árçr*cascade08çrér *cascade08érùr*cascade08ùrúr *cascade08úrûr*cascade08ûrür *cascade08ürır*cascade08ırşr *cascade08şrÿr*cascade08ÿrs *cascade08s‚s*cascade08‚sƒs *cascade08ƒs„s*cascade08„s…s *cascade08…s†s*cascade08†s‰s *cascade08‰s‘s*cascade08‘s’s *cascade08’s—s*cascade08—s™s *cascade08™sœs*cascade08œss *cascade08s¡s*cascade08¡s¢s*cascade08¢s¤s *cascade08¤s¥s*cascade08¥s¦s *cascade08¦s¬s*cascade08¬s­s*cascade08­s´s*cascade08´sÊs *cascade08ÊsËs*cascade08ËsÏs *cascade08Ïsâs*cascade08âsãs *cascade08ãsæs *cascade08æsçs *cascade08çsès*cascade08èsés *cascade08ésês*cascade08êsõs *cascade08õsös *cascade08ösùs*cascade08ùsús *cascade08úsûs*cascade08ûsıs *cascade08ısşs*cascade08şsÿs *cascade08ÿs‚t*cascade08‚tƒt*cascade08ƒt„t *cascade08„t¿t*cascade08¿tÃt *cascade08ÃtÄt *cascade08ÄtÆt *cascade08ÆtÇt*cascade08ÇtÈt *cascade08Èt u*cascade08 u£u *cascade08£u¤u *cascade08¤u»u*cascade08»uÍu *cascade08ÍuÎu*cascade08Îuİu *cascade08İuŞu*cascade08Şuáu *cascade08áuãu *cascade08ãuÆv *cascade08ÆvÈv *cascade08Èvôv*cascade08ôvõv *cascade08õvüv *cascade08üvşv*cascade08şvÿv *cascade08ÿv‚w*cascade08‚wƒw *cascade08ƒw‰w*cascade08‰wŠw *cascade08Šww*cascade08ww *cascade08w•w*cascade08•w–w *cascade08–w—w*cascade08—w™w *cascade08™w›w*cascade08›wœw *cascade08œww*cascade08wŸw *cascade08Ÿw£w*cascade08£w¤w *cascade08¤w²w*cascade08²w¹w *cascade08¹w»w*cascade08»w¼w *cascade08¼wÀw*cascade08Àw¤x *cascade08¤x¨x*cascade08¨xŞx *cascade08Şxßx*cascade08ßxãx *cascade08ãxæx*cascade08æxÿx *cascade08ÿxƒy*cascade08ƒy¸y *cascade08¸yìy*cascade08ìyîy *cascade08îy”z*cascade08”z˜z*cascade08˜z·z *cascade08·z¹z*cascade08¹z½z *cascade08½zÁz *cascade08ÁzÃz*cascade08ÃzÆz *cascade08ÆzÈz*cascade08ÈzÌz *cascade08ÌzÎz*cascade08ÎzÑz *cascade08Ñzš{*cascade08š{œ{ *cascade08œ{²{*cascade08²{´{ *cascade08´{¸{*cascade08¸{¹{ *cascade08¹{¼{*cascade08¼{½{ *cascade08½{Ã{*cascade08Ã{Ä{ *cascade08Ä{İ{*cascade08İ{à{ *cascade08à{ã{*cascade08ã{ä{ *cascade08ä{÷{*cascade08÷{ù{ *cascade08ù{û{*cascade08û{ü{ *cascade08ü{…| *cascade08…|¡|*cascade08¡|¢| *cascade08¢|¥|*cascade08¥|¦| *cascade08¦|³|*cascade08³|´| *cascade08´|¸|*cascade08¸|»| *cascade08»|©}*cascade08©}«} *cascade08«}­} *cascade08­}á€*cascade08á€ó™ *cascade08ó™Ã *cascade08Ã©Ÿ*cascade08©ŸéŸ *cascade08éŸöŸ*cascade08öŸæ  *cascade08æ ó *cascade08ó ¯¡ *cascade08¯¡½¢*cascade08½¢Ú¢ *cascade08Ú¢İ¢*cascade08İ¢Ş¢ *cascade08Ş¢à¢*cascade08à¢á¢ *cascade08á¢ê¢*cascade08ê¢ë¢ *cascade08ë¢ì¢*cascade08ì¢í¢ *cascade08í¢ù¢*cascade08ù¢û¢ *cascade08û¢‡£*cascade08‡£Š£ *cascade08Š££*cascade08£Ò£ *cascade08Ò£å£*cascade08å£¤ *cascade08¤Ë¥ *cascade08Ë¥Ó¥*cascade08Ó¥Ô¥ *cascade08Ô¥ä¥*cascade08ä¥å¥ *cascade08å¥ù¥*cascade08ù¥œ¦ *cascade08œ¦¡¦*cascade08¡¦è² *cascade08è²ë³*cascade08ë³˜´ *cascade08˜´£´*cascade08£´„¶ *cascade08„¶‘¶*cascade08‘¶’¶ *cascade08’¶“¶*cascade08“¶”¶ *cascade08”¶¶*cascade08¶¡¶ *cascade08¡¶ª¶*cascade08ª¶«¶ *cascade08«¶±¶*cascade08±¶²¶ *cascade08²¶½¶*cascade08½¶Æ¶ *cascade08Æ¶È¶*cascade08È¶É¶ *cascade08É¶Ğ¶*cascade08Ğ¶Ñ¶ *cascade08Ñ¶Õ¶*cascade08Õ¶Ö¶ *cascade08Ö¶Ú¶*cascade08Ú¶Û¶ *cascade08Û¶İ¶*cascade08İ¶à¶ *cascade08à¶å¶*cascade08å¶ç¶ *cascade08ç¶é¶*cascade08é¶ê¶ *cascade08ê¶ğ¶*cascade08ğ¶ñ¶ *cascade08ñ¶ô¶*cascade08ô¶õ¶ *cascade08õ¶÷¶*cascade08÷¶ù¶ *cascade08ù¶‚·*cascade08‚·„· *cascade08„·ˆ·*cascade08ˆ·‰· *cascade08‰·‹·*cascade08‹·· *cascade08··*cascade08·· *cascade08·“·*cascade08“·”· *cascade08”·˜·*cascade08˜·™· *cascade08™··*cascade08·Ÿ· *cascade08Ÿ·¡·*cascade08¡·£· *cascade08£·¨·*cascade08¨·ª· *cascade08ª·®·*cascade08®·¯· *cascade08¯·²·*cascade08²·´· *cascade08´···*cascade08··¹· *cascade08¹·¼·*cascade08¼·¾· *cascade08¾·À·*cascade08À·Á· *cascade08Á·Ã·*cascade08Ã·Ä· *cascade08Ä·Ê·*cascade08Ê·Ë· *cascade08Ë·Ö·*cascade08Ö·Ù· *cascade08Ù·Ú·*cascade08Ú·Ü· *cascade08Ü·Ş·*cascade08Ş·ß· *cascade08ß·á·*cascade08á·â· *cascade08â·ã·*cascade08ã·ä· *cascade08ä·ë·*cascade08ë·ñ· *cascade08ñ·÷·*cascade08÷·ø· *cascade08ø·€¸*cascade08€¸‚¸ *cascade08‚¸„¸*cascade08„¸…¸ *cascade08…¸Š¸*cascade08Š¸‹¸ *cascade08‹¸¸*cascade08¸¸ *cascade08¸’¸*cascade08’¸“¸ *cascade08“¸”¸*cascade08”¸•¸ *cascade08•¸˜¸*cascade08˜¸™¸ *cascade08™¸š¸*cascade08š¸›¸ *cascade08›¸¸*cascade08¸Ÿ¸ *cascade08Ÿ¸¥¸*cascade08¥¸¦¸ *cascade08¦¸«¸*cascade08«¸¬¸ *cascade08¬¸³¸*cascade08³¸´¸ *cascade08´¸¼¸*cascade08¼¸¾¸ *cascade08¾¸À¸*cascade08À¸Á¸ *cascade08Á¸Â¸*cascade08Â¸Ã¸ *cascade08Ã¸Ç¸*cascade08Ç¸È¸ *cascade08È¸Ï¸*cascade08Ï¸Ğ¸ *cascade08Ğ¸Ô¸*cascade08Ô¸Õ¸ *cascade08Õ¸Ú¸*cascade08Ú¸Û¸ *cascade08Û¸ß¸*cascade08ß¸à¸ *cascade08à¸â¸*cascade08â¸ä¸ *cascade08ä¸ç¸*cascade08ç¸é¸ *cascade08é¸ï¸*cascade08ï¸ñ¸ *cascade08ñ¸ó¸*cascade08ó¸ô¸ *cascade08ô¸ö¸*cascade08ö¸ú¸ *cascade08ú¸ş¸*cascade08ş¸€¹ *cascade08€¹ƒ¹*cascade08ƒ¹„¹ *cascade08„¹†¹*cascade08†¹ˆ¹ *cascade08ˆ¹‰¹*cascade08‰¹Š¹ *cascade08Š¹‹¹*cascade08‹¹Œ¹ *cascade08Œ¹¹*cascade08¹¹ *cascade08¹‘¹*cascade08‘¹’¹ *cascade08’¹™¹*cascade08™¹š¹ *cascade08š¹¹*cascade08¹Ÿ¹ *cascade08Ÿ¹¡¹*cascade08¡¹¢¹ *cascade08¢¹£¹*cascade08£¹¨¹ *cascade08¨¹«¹*cascade08«¹¬¹ *cascade08¬¹®¹*cascade08®¹²¹ *cascade08²¹¶¹*cascade08¶¹·¹ *cascade08·¹º¹*cascade08º¹»¹ *cascade08»¹½¹*cascade08½¹¾¹ *cascade08¾¹¿¹*cascade08¿¹À¹ *cascade08À¹Æ¹*cascade08Æ¹Ç¹ *cascade08Ç¹Ê¹*cascade08Ê¹Ë¹ *cascade08Ë¹Í¹*cascade08Í¹Î¹ *cascade08Î¹Ğ¹*cascade08Ğ¹Ö¹ *cascade08Ö¹Ø¹*cascade08Ø¹Ù¹ *cascade08Ù¹Ş¹*cascade08Ş¹ß¹ *cascade08ß¹à¹*cascade08à¹á¹ *cascade08á¹æ¹*cascade08æ¹ç¹ *cascade08ç¹ê¹*cascade08ê¹í¹ *cascade08í¹î¹*cascade08î¹ñ¹ *cascade08ñ¹ó¹*cascade08ó¹ù¹ *cascade08ù¹ş¹*cascade08ş¹ÿ¹ *cascade08ÿ¹‚º*cascade08‚ºƒº *cascade08ƒº…º*cascade08…º†º *cascade08†º‰º*cascade08‰ºŠº *cascade08Šº‘º*cascade08‘º’º *cascade08’º•º*cascade08•º–º *cascade08–ºº*cascade08º º *cascade08 º¥º*cascade08¥º¦º *cascade08¦º©º*cascade08©º¬º *cascade08¬º±º*cascade08±º³º *cascade08³ºµº*cascade08µº¶º *cascade08¶º¹º*cascade08¹ººº *cascade08ºº»º*cascade08»º¼º *cascade08¼º¿º*cascade08¿ºÁº *cascade08ÁºÌº*cascade08ÌºÍº *cascade08ÍºÑº*cascade08ÑºÒº *cascade08ÒºÖº*cascade08Öº×º *cascade08×ºØº*cascade08ØºÙº *cascade08Ùºâº*cascade08âºäº *cascade08äºæº*cascade08æºçº *cascade08çºèº*cascade08èºêº *cascade08êºîº*cascade08îºïº *cascade08ïºğº*cascade08ğºñº *cascade08ñºôº*cascade08ôºõº *cascade08õº÷º*cascade08÷ºøº *cascade08øºüº*cascade08üºıº *cascade08ıºşº*cascade08şºÿº *cascade08ÿº»*cascade08»‚» *cascade08‚»‡»*cascade08‡»‰» *cascade08‰»‹»*cascade08‹»Œ» *cascade08Œ»»*cascade08»» *cascade08»–»*cascade08–»—» *cascade08—»š»*cascade08š»›» *cascade08›»»*cascade08»» *cascade08»¨»*cascade08¨»ª» *cascade08ª»¬»*cascade08¬»­» *cascade08­»²»*cascade08²»³» *cascade08³»·»*cascade08·»¸» *cascade08¸»º»*cascade08º»»» *cascade08»»¿»*cascade08¿»À» *cascade08À»Á»*cascade08Á»Â» *cascade08Â»Æ»*cascade08Æ»Ç» *cascade08Ç»É»*cascade08É»Ê» *cascade08Ê»Í»*cascade08Í»Î» *cascade08Î»Ş»*cascade08Ş»ß» *cascade08ß»à»*cascade08à»â» *cascade08â»é»*cascade08é»ê» *cascade08ê»ñ»*cascade08ñ»ô» *cascade08ô»ı»*cascade08ı»ş» *cascade08ş»‚¼*cascade08‚¼¼ *cascade08¼’¼*cascade08’¼“¼ *cascade08“¼—¼*cascade08—¼˜¼ *cascade08˜¼š¼*cascade08š¼›¼ *cascade08›¼¼*cascade08¼Ÿ¼ *cascade08Ÿ¼¢¼*cascade08¢¼£¼ *cascade08£¼¥¼*cascade08¥¼¦¼ *cascade08¦¼©¼*cascade08©¼ª¼ *cascade08ª¼´¼*cascade08´¼µ¼ *cascade08µ¼¶¼*cascade08¶¼·¼ *cascade08·¼¾¼*cascade08¾¼¿¼ *cascade08¿¼Æ¼*cascade08Æ¼Ç¼ *cascade08Ç¼É¼*cascade08É¼Ê¼ *cascade08Ê¼Í¼*cascade08Í¼Î¼ *cascade08Î¼Ò¼*cascade08Ò¼Ó¼ *cascade08Ó¼Õ¼*cascade08Õ¼Ö¼ *cascade08Ö¼Û¼*cascade08Û¼Ü¼ *cascade08Ü¼İ¼*cascade08İ¼Ş¼ *cascade08Ş¼è¼*cascade08è¼ë¼ *cascade08ë¼ğ¼*cascade08ğ¼õ¼ *cascade08õ¼ø¼*cascade08ø¼ù¼ *cascade08ù¼ü¼*cascade08ü¼ı¼ *cascade08ı¼ƒ½*cascade08ƒ½…½ *cascade08…½‡½*cascade08‡½ˆ½ *cascade08ˆ½‹½*cascade08‹½Œ½ *cascade08Œ½½*cascade08½‘½ *cascade08‘½“½*cascade08“½”½ *cascade08”½—½*cascade08—½™½ *cascade08™½›½*cascade08›½œ½ *cascade08œ½½*cascade08½¢½ *cascade08¢½¤½*cascade08¤½¥½ *cascade08¥½¦½*cascade08¦½ª½ *cascade08ª½­½*cascade08­½®½ *cascade08®½±½*cascade08±½²½ *cascade08²½¾½*cascade08¾½¿½ *cascade08¿½Â½*cascade08Â½Ä½ *cascade08Ä½Æ½*cascade08Æ½Ç½ *cascade08Ç½É½*cascade08É½Ê½ *cascade08Ê½Ì½*cascade08Ì½Í½ *cascade08Í½Ó½*cascade08Ó½Ô½ *cascade08Ô½Ø½*cascade08Ø½Ú½ *cascade08Ú½Ü½*cascade08Ü½İ½ *cascade08İ½ß½*cascade08ß½à½ *cascade08à½ã½*cascade08ã½ä½ *cascade08ä½ó½*cascade08ó½ô½ *cascade08ô½ö½*cascade08ö½÷½ *cascade08÷½ø½*cascade08ø½ù½ *cascade08ù½ü½*cascade08ü½ı½ *cascade08ı½ş½*cascade08ş½ÿ½ *cascade08ÿ½…¾*cascade08…¾†¾ *cascade08†¾Š¾*cascade08Š¾‹¾ *cascade08‹¾¾*cascade08¾¾ *cascade08¾’¾*cascade08’¾“¾ *cascade08“¾—¾*cascade08—¾˜¾ *cascade08˜¾š¾*cascade08š¾›¾ *cascade08›¾¦¾*cascade08¦¾§¾ *cascade08§¾¨¾*cascade08¨¾©¾ *cascade08©¾ª¾*cascade08ª¾­¾ *cascade08­¾·¾*cascade08·¾¸¾ *cascade08¸¾»¾*cascade08»¾À¾ *cascade08À¾Â¾*cascade08Â¾Ã¾ *cascade08Ã¾Æ¾*cascade08Æ¾Ç¾ *cascade08Ç¾Î¾*cascade08Î¾Ğ¾ *cascade082@file:///c:/Users/Emmi/Documents/ekspertiz-node/public/js/main.js