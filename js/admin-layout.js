// js/admin-layout.js
// Loader Layout Admin (Split Sidebar + Header)

document.addEventListener('DOMContentLoaded', async function() {
    document.body.classList.add('role-admin');
    
    try {
        // ==========================================
        // FETCH LAYOUT
        // ==========================================
        const response = await fetch('../components/layout-admin.html');
        if (!response.ok) throw new Error(`Gagal memuat layout: HTTP ${response.status}`);
        const layoutHTML = await response.text();
        
        // ==========================================
        // PARSE & SPLIT
        // ==========================================
        const parser = new DOMParser();
        const doc = parser.parseFromString(layoutHTML, 'text/html');
        
        const sidebarPart = doc.getElementById('part-sidebar');
        const sidebarContainer = document.getElementById('sidebar-container');
        if (sidebarContainer && sidebarPart) {
            sidebarContainer.innerHTML = sidebarPart.innerHTML;
        }
        
        const headerPart = doc.getElementById('part-header');
        const headerContainer = document.getElementById('header-container');
        if (headerContainer && headerPart) {
            headerContainer.innerHTML = headerPart.innerHTML;
        }
        
        // ==========================================
        // SETUP
        // ==========================================
        highlightActiveMenu();
        fillHeaderData();
        setupLogoutHandler();
        setupSidebarToggle();
        
    } catch (error) {
        console.error("Gagal memuat layout admin:", error);
    }
});

// ==========================================
// HIGHLIGHT MENU AKTIF
// ==========================================
function highlightActiveMenu() {
    const currentPage = window.location.pathname.split('/').pop() || 'admin-dashboard.html';
    
    document.querySelectorAll('.sidebar-nav-link').forEach(el => {
        el.classList.remove('active');
    });

    const menuMap = {
        'admin-dashboard.html': 'menu-dashboard',
        'admin-users.html': 'menu-users',
        'admin-log.html': 'menu-log',
        'admin-backup.html': 'menu-backup',
        'admin-profil.html': 'menu-profil'
    };

    const activeId = menuMap[currentPage];
    if (activeId) {
        const activeLink = document.getElementById(activeId);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }
}

// ==========================================
// ISI DATA HEADER
// ==========================================
function fillHeaderData() {
    const sessionData = localStorage.getItem('user_session');
    if (!sessionData) return;
    
    const user = JSON.parse(sessionData);
    
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
        const currentPage = window.location.pathname.split('/').pop().replace('.html', '');
        const titleMap = {
            'admin-dashboard': 'Dashboard Admin',
            'admin-users': 'Kelola Users',
            'admin-log': 'Log Aktivitas',
            'admin-backup': 'Backup Database',
            'admin-profil': 'Profil Admin'
        };
        pageTitle.innerText = titleMap[currentPage] || 'Dashboard Admin';
    }
    
    const adminNameDisplay = document.getElementById('adminNameDisplay');
    if (adminNameDisplay) {
        adminNameDisplay.innerText = user.nama_admin || user.username?.split('@')[0] || 'Administrator';
    }
    
    const avatarInisial = document.getElementById('adminAvatarInisial');
    if (avatarInisial) {
        const nama = user.nama_admin || user.username || 'Admin';
        const kata = nama.split(' ').filter(k => k.length > 0);
        
        let inisial = '';
        if (kata.length >= 2) {
            inisial = kata[0].charAt(0) + kata[1].charAt(0);
        } else if (kata.length === 1) {
            inisial = kata[0].substring(0, 2);
        } else {
            inisial = 'AD';
        }
        
        avatarInisial.innerText = inisial.toUpperCase();
    }
}

// ==========================================
// HANDLER LOGOUT
// ==========================================
function setupLogoutHandler() {
    document.addEventListener('click', function(e) {
        const logoutBtn = e.target.closest('#btnLogout');
        if (logoutBtn) {
            e.preventDefault();
            
            if (confirm('Apakah Anda yakin ingin keluar?')) {
                localStorage.removeItem('user_session');
                window.location.href = '../login.html';
            }
        }
    });
}

// ==========================================
// TOGGLE SIDEBAR (MOBILE)
// ==========================================
function setupSidebarToggle() {
    if (!document.getElementById('sidebarOverlay')) {
        const overlay = document.createElement('div');
        overlay.id = 'sidebarOverlay';
        document.body.appendChild(overlay);
    }
    
    const overlay = document.getElementById('sidebarOverlay');
    
    const sidebarInit = document.querySelector('aside');
    if (sidebarInit) {
        sidebarInit.classList.remove('show');
        overlay.classList.remove('show');
    }
    
    document.addEventListener('click', function(e) {
        const toggleBtn = e.target.closest('#btnToggleSidebar');
        if (toggleBtn) {
            e.preventDefault();
            const sidebar = document.querySelector('aside');
            if (sidebar) {
                sidebar.classList.toggle('show');
                overlay.classList.toggle('show');
            }
            return;
        }
        
        if (e.target.id === 'sidebarOverlay') {
            const sidebar = document.querySelector('aside');
            if (sidebar) {
                sidebar.classList.remove('show');
                overlay.classList.remove('show');
            }
            return;
        }
        
        const menuLink = e.target.closest('.sidebar-nav-link');
        if (menuLink && window.innerWidth <= 768) {
            const sidebar = document.querySelector('aside');
            if (sidebar) {
                sidebar.classList.remove('show');
                overlay.classList.remove('show');
            }
        }
    });
}
