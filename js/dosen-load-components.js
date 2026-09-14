// js/dosen-load-components.js
// Loader Sidebar & Header untuk Portal Dosen
// ✅ Dengan Setup Notifikasi

document.addEventListener('DOMContentLoaded', async function() {
    // ✅ Tambahkan class ke body
    document.body.classList.add('role-dosen');

    try {
        // ==========================================
        // 1. MUAT SIDEBAR DOSEN
        // ==========================================
        const sidebarContainer = document.getElementById('sidebar-container');
        if (sidebarContainer) {
            const response = await fetch('../components/sidebar-dosen.html');
            if (!response.ok) throw new Error(`Gagal memuat sidebar: HTTP ${response.status}`);
            const sidebarHTML = await response.text();
            sidebarContainer.innerHTML = sidebarHTML;
            
            highlightActiveMenu();
        }

        // ==========================================
        // 2. MUAT HEADER DOSEN
        // ==========================================
        const headerContainer = document.getElementById('header-container');
        if (headerContainer) {
            const response = await fetch('../components/header-dosen.html');
            if (!response.ok) throw new Error(`Gagal memuat header: HTTP ${response.status}`);
            const headerHTML = await response.text();
            headerContainer.innerHTML = headerHTML;

            // ✅ Isi data header
            fillHeaderData();
            
            // ✅ SETUP NOTIFIKASI (BARU)
            setTimeout(() => {
                if (typeof setupNotifButton === 'function') {
                    console.log('🔔 Setup notifikasi dosen...');
                    setupNotifButton();
                    loadNotifikasiBadge();
                } else {
                    console.warn('⚠️ js/notifikasi.js belum di-load.');
                }
            }, 100);
        }

        // ==========================================
        // 3. SETUP HANDLER LOGOUT
        // ==========================================
        setupLogoutHandler();

        // ==========================================
        // 4. SETUP TOGGLE SIDEBAR (MOBILE)
        // ==========================================
        setupSidebarToggle();

    } catch (error) {
        console.error("Gagal memuat komponen dosen:", error);
    }
});

// ==========================================
// HIGHLIGHT MENU AKTIF
// ==========================================
function highlightActiveMenu() {
    const currentPage = window.location.pathname.split('/').pop() || 'dosen-dashboard.html';
    
    document.querySelectorAll('.sidebar-nav-link').forEach(el => {
        el.classList.remove('active');
    });

    const menuMap = {
        'dosen-dashboard.html': 'menu-dashboard',
        'dosen-matakuliah.html': 'menu-matakuliah',
        'dosen-tugas.html': 'menu-tugas',
        'dosen-ujian.html': 'menu-ujian',
        'dosen-absensi.html': 'menu-absensi',
        'dosen-nilai.html': 'menu-nilai',
        'dosen-profil.html': 'menu-profil'
    };

    const activeId = menuMap[currentPage];
    if (activeId) {
        const activeLink = document.getElementById(activeId);
        if (activeLink) activeLink.classList.add('active');
    }
}

// ==========================================
// ISI DATA HEADER
// ==========================================
function fillHeaderData() {
    const sessionData = localStorage.getItem('user_session');
    if (!sessionData) return;
    
    const user = JSON.parse(sessionData);
    
    // Set page title
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
        const currentPage = window.location.pathname.split('/').pop().replace('.html', '');
        const titleMap = {
            'dosen-dashboard': 'Dashboard Dosen',
            'dosen-matakuliah': 'Mata Kuliah Ampuan',
            'dosen-tugas': 'Kelola Tugas',
            'dosen-ujian': 'Kelola Ujian',
            'dosen-absensi': 'Rekap Absensi',
            'dosen-nilai': 'Rekap Nilai',
            'dosen-profil': 'Profil Dosen'
        };
        pageTitle.innerText = titleMap[currentPage] || 'Dashboard Dosen';
    }
    
    // Set nama dosen
    const dosenNameDisplay = document.getElementById('dosenNameDisplay');
    if (dosenNameDisplay) {
        dosenNameDisplay.innerText = user.nama_dosen || user.username?.split('@')[0] || 'Dosen';
    }
    
    // Set spesialisasi
    const spesialisasiDisplay = document.getElementById('dosenSpesialisasiDisplay');
    if (spesialisasiDisplay) {
        spesialisasiDisplay.innerText = user.spesialisasi || 'Dosen Pengajar';
    }
    
    // Set inisial avatar
    const avatarInisial = document.getElementById('dosenAvatarInisial');
    if (avatarInisial) {
        const nama = user.nama_dosen || 'Dosen';
        const kata = nama.split(' ').filter(k => k.length > 0 && !k.includes('.'));
        
        let inisial = '';
        if (kata.length >= 2) {
            inisial = kata[0].charAt(0) + kata[1].charAt(0);
        } else if (kata.length === 1) {
            inisial = kata[0].substring(0, 2);
        } else {
            inisial = nama.replace(/[^A-Za-z]/g, '').substring(0, 2);
        }
        
        avatarInisial.innerText = inisial.toUpperCase() || 'DS';
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
