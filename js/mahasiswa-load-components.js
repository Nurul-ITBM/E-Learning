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

    // ✅ Mapping halaman → ID menu (tanpa pengumuman)
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
                window.location.href = 'login.html';
            }
        }
    });
}
