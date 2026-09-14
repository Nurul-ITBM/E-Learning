// js/mahasiswa-load-components.js
// Loader Sidebar & Header untuk Portal Mahasiswa
// ✅ Dengan Setup Notifikasi

document.addEventListener('DOMContentLoaded', async function() {
    // ✅ Tambahkan class ke body
    document.body.classList.add('role-mahasiswa');

    try {
        // ==========================================
        // 1. MUAT SIDEBAR MAHASISWA
        // ==========================================
        const sidebarContainer = document.getElementById('sidebar-container');
        if (sidebarContainer) {
            const response = await fetch('../components/sidebar-mahasiswa.html');
            if (!response.ok) throw new Error(`Gagal memuat sidebar: HTTP ${response.status}`);
            const sidebarHTML = await response.text();
            sidebarContainer.innerHTML = sidebarHTML;
            
            highlightActiveMenu();
        }

        // ==========================================
        // 2. MUAT HEADER MAHASISWA
        // ==========================================
        const headerContainer = document.getElementById('header-container');
        if (headerContainer) {
            const response = await fetch('../components/header-mahasiswa.html');
            if (!response.ok) throw new Error(`Gagal memuat header: HTTP ${response.status}`);
            const headerHTML = await response.text();
            headerContainer.innerHTML = headerHTML;

            // ✅ Isi data header
            fillHeaderData();
            
            // ✅ SETUP NOTIFIKASI (BARU)
            setTimeout(() => {
                if (typeof setupNotifButton === 'function') {
                    console.log('🔔 Setup notifikasi mahasiswa...');
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
        console.error("Gagal memuat komponen mahasiswa:", error);
    }
});

// ==========================================
// HIGHLIGHT MENU AKTIF
// ==========================================
function highlightActiveMenu() {
    const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
    
    document.querySelectorAll('.sidebar-nav-link').forEach(el => {
        el.classList.remove('active');
    });

    const menuMap = {
        'dashboard.html': 'menu-dashboard',
        'mahasiswa-dashboard.html': 'menu-dashboard',
        'matakuliah.html': 'menu-matakuliah',
        'mahasiswa-matakuliah.html': 'menu-matakuliah',
        'tugas.html': 'menu-tugas',
        'mahasiswa-tugas.html': 'menu-tugas',
        'ujian.html': 'menu-ujian',
        'mahasiswa-ujian.html': 'menu-ujian',
        'absensi.html': 'menu-absensi',
        'mahasiswa-absensi.html': 'menu-absensi',
        'nilai.html': 'menu-nilai',
        'mahasiswa-nilai.html': 'menu-nilai',
        'profil.html': 'menu-profil',
        'mahasiswa-profil.html': 'menu-profil'
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
            'dashboard': 'Dashboard Mahasiswa',
            'mahasiswa-dashboard': 'Dashboard Mahasiswa',
            'matakuliah': 'Mata Kuliah',
            'mahasiswa-matakuliah': 'Mata Kuliah',
            'tugas': 'Tugas & Praktikum',
            'mahasiswa-tugas': 'Tugas & Praktikum',
            'ujian': 'Ujian',
            'mahasiswa-ujian': 'Ujian',
            'absensi': 'Riwayat Kehadiran',
            'mahasiswa-absensi': 'Riwayat Kehadiran',
            'nilai': 'Nilai Akademik',
            'mahasiswa-nilai': 'Nilai Akademik',
            'profil': 'Profil Saya',
            'mahasiswa-profil': 'Profil Saya'
        };
        pageTitle.innerText = titleMap[currentPage] || 'Dashboard Mahasiswa';
    }
    
    // Set nama mahasiswa
    const nameDisplay = document.getElementById('mahasiswaNameDisplay');
    if (nameDisplay) {
        nameDisplay.innerText = user.nama_mahasiswa || user.username?.split('@')[0] || 'Mahasiswa';
    }
    
    // Set program studi
    const prodiDisplay = document.getElementById('mahasiswaProdiDisplay');
    if (prodiDisplay) {
        prodiDisplay.innerText = user.program_studi || 'Mahasiswa';
    }
    
    // Set inisial avatar
    const avatarInisial = document.getElementById('mahasiswaAvatarInisial');
    if (avatarInisial) {
        const nama = user.nama_mahasiswa || 'Mahasiswa';
        const kata = nama.split(' ').filter(k => k.length > 0);
        
        let inisial = '';
        if (kata.length >= 2) {
            inisial = kata[0].charAt(0) + kata[1].charAt(0);
        } else if (kata.length === 1) {
            inisial = kata[0].substring(0, 2);
        } else {
            inisial = nama.substring(0, 2);
        }
        
        avatarInisial.innerText = inisial.toUpperCase() || 'MH';
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
        // 1. Tombol Hamburger
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
        
        // 2. Klik overlay → tutup
        if (e.target.id === 'sidebarOverlay') {
            const sidebar = document.querySelector('aside');
            if (sidebar) {
                sidebar.classList.remove('show');
                overlay.classList.remove('show');
            }
            return;
        }
        
        // 3. Klik menu link → tutup (mobile)
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
