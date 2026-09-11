// js/dosen-load-components.js
// Loader Sidebar & Header untuk Portal Dosen

document.addEventListener('DOMContentLoaded', async function() {
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
            
            // ✅ Highlight menu aktif
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
        }

        // ==========================================
        // 3. SETUP HANDLER LOGOUT (TERPUSAT)
        // ==========================================
        setupLogoutHandler();

    } catch (error) {
        console.error("Gagal memuat komponen:", error);
    }
});

// ==========================================
// HIGHLIGHT MENU AKTIF
// ==========================================
function highlightActiveMenu() {
    const currentPage = window.location.pathname.split('/').pop() || 'dosen-dashboard.html';
    
    // Hapus semua class active
    document.querySelectorAll('.sidebar-nav-link').forEach(el => {
        el.classList.remove('active');
    });

    // Mapping halaman → ID menu
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
