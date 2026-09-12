// js/mahasiswa-load-components.js
// Loader Sidebar & Header untuk Portal Mahasiswa

document.addEventListener('DOMContentLoaded', async function() {
    // ✅ Tambahkan class ke body agar CSS khusus mahasiswa (Indigo) aktif
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
            
            // ✅ Highlight menu aktif
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
        }

        // ==========================================
        // 3. SETUP HANDLER LOGOUT (TERPUSAT)
        // ==========================================
        setupLogoutHandler();

        // ==========================================
        // 4. ✅ SETUP TOGGLE SIDEBAR (MOBILE)
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
    
    // Hapus semua class active
    document.querySelectorAll('.sidebar-nav-link').forEach(el => {
        el.classList.remove('active');
    });

    // Mapping halaman → ID menu
    const menuMap = {
        'dashboard.html': 'menu-dashboard',
        'matakuliah.html': 'menu-matakuliah',
        'tugas.html': 'menu-tugas',
        'ujian.html': 'menu-ujian',
        'absensi.html': 'menu-absensi',
        'nilai.html': 'menu-nilai',
        'profil.html': 'menu-profil'
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
    
    // ✅ Set page title dinamis
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
        const currentPage = window.location.pathname.split('/').pop().replace('.html', '');
        const titleMap = {
            'dashboard': 'Dashboard Mahasiswa',
            'matakuliah': 'Mata Kuliah',
            'tugas': 'Tugas',
            'ujian': 'Ujian',
            'absensi': 'Riwayat Kehadiran',
            'nilai': 'Nilai Akademik',
            'profil': 'Profil Saya'
        };
        pageTitle.innerText = titleMap[currentPage] || 'Dashboard Mahasiswa';
    }
    
    // ✅ Set nama mahasiswa
    const nameDisplay = document.getElementById('mahasiswaNameDisplay');
    if (nameDisplay) {
        nameDisplay.innerText = user.nama_mahasiswa || user.username?.split('@')[0] || 'Mahasiswa';
    }
    
    // ✅ Set program studi
    const prodiDisplay = document.getElementById('mahasiswaProdiDisplay');
    if (prodiDisplay) {
        prodiDisplay.innerText = user.program_studi || 'Mahasiswa';
    }
    
    // ✅ Set inisial avatar otomatis
    const avatarInisial = document.getElementById('mahasiswaAvatarInisial');
    if (avatarInisial) {
        const nama = user.nama_mahasiswa || 'Mahasiswa';
        
        // Ambil kata valid
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
// HANDLER LOGOUT (TERPUSAT)
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
// ✅ TOGGLE SIDEBAR (MOBILE)
// ==========================================
function setupSidebarToggle() {
    // Buat overlay jika belum ada
    if (!document.getElementById('sidebarOverlay')) {
        const overlay = document.createElement('div');
        overlay.id = 'sidebarOverlay';
        document.body.appendChild(overlay);
    }
    
    const overlay = document.getElementById('sidebarOverlay');
    
    // Event delegation untuk semua klik
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
        
        // 2. Klik overlay → tutup sidebar
        if (e.target.id === 'sidebarOverlay') {
            const sidebar = document.querySelector('aside');
            if (sidebar) {
                sidebar.classList.remove('show');
                overlay.classList.remove('show');
            }
            return;
        }
        
        // 3. Klik menu link → tutup sidebar (mobile)
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
