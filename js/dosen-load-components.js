// js/dosen-load-components.js
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // 1. Muat Sidebar Dosen
        const sidebarContainer = document.getElementById('sidebar-container');
        if (sidebarContainer) {
            const response = await fetch('../components/sidebar-dosen.html');
            if (!response.ok) throw new Error(`Gagal memuat sidebar: HTTP ${response.status}`);
            const sidebarHTML = await response.text();
            sidebarContainer.innerHTML = sidebarHTML;
            
            // Logika Menu Aktif
            const currentPage = window.location.pathname.split('/').pop();
            let activeId = '';
            if (currentPage === 'dosen-dashboard.html') activeId = 'menu-dashboard';
            else if (currentPage === 'dosen-matakuliah.html') activeId = 'menu-matakuliah';
            else if (currentPage === 'dosen-tugas.html') activeId = 'menu-tugas';
            // ... tambahkan halaman lainnya ...
            if (activeId) {
                const activeLink = document.getElementById(activeId);
                if (activeLink) activeLink.classList.add('sidebar-item-active', 'rounded-xl');
            }
        }

        // 2. Muat Header Dosen
        const headerContainer = document.getElementById('header-container');
        if (headerContainer) {
            const response = await fetch('../components/header-dosen.html');
            if (!response.ok) throw new Error(`Gagal memuat header: HTTP ${response.status}`);
            const headerHTML = await response.text();
            headerContainer.innerHTML = headerHTML;

            // --- LOGIKA ISI DATA HEADER (DIPINDAHKAN KE SINI) ---
            const sessionData = localStorage.getItem('user_session');
            if (sessionData) {
                const user = JSON.parse(sessionData);
                
                // Update Judul Halaman
                const pageTitle = document.getElementById('pageTitle');
                if (pageTitle) pageTitle.innerText = 'Dashboard Dosen';

                // Update Nama Dosen
                const dosenNameDisplay = document.getElementById('dosenNameDisplay');
                if (dosenNameDisplay) dosenNameDisplay.innerText = user.nama_dosen || 'Dosen';

                // Update Spesialisasi (jika ada)
                const spesialisasiDisplay = document.getElementById('dosenSpesialisasiDisplay');
                if (spesialisasiDisplay) spesialisasiDisplay.innerText = user.spesialisasi || 'Dosen Pengajar';
            }
            // -------------------------------------------------
        }
    } catch (error) {
        console.error("Gagal memuat komponen:", error);
    }
});
