// js/mahasiswa-load-components.js
document.addEventListener('DOMContentLoaded', async function() {
    // Tambahkan class ke body agar CSS khusus mahasiswa (Indigo) aktif
    document.body.classList.add('role-mahasiswa');

    try {
        // 1. Muat Sidebar Mahasiswa
        const sidebarContainer = document.getElementById('sidebar-container');
        if (sidebarContainer) {
            const response = await fetch('../components/sidebar-mahasiswa.html');
            const sidebarHTML = await response.text();
            sidebarContainer.innerHTML = sidebarHTML;
            
            // Tandai menu aktif berdasarkan halaman mahasiswa
            const currentPage = window.location.pathname.split('/').pop();
            let activeId = '';
            if (currentPage === 'dashboard.html') activeId = 'menu-dashboard';
            else if (currentPage === 'matakuliah.html') activeId = 'menu-matakuliah';
            else if (currentPage === 'tugas.html') activeId = 'menu-tugas';
            else if (currentPage === 'ujian.html') activeId = 'menu-ujian';
            else if (currentPage === 'absensi.html') activeId = 'menu-absensi';
            else if (currentPage === 'nilai.html') activeId = 'menu-nilai';
            else if (currentPage === 'pengumuman.html') activeId = 'menu-pengumuman';

            if (activeId) {
                const activeLink = document.getElementById(activeId);
                if (activeLink) activeLink.classList.add('active');
            }
        }

        // 2. Muat Header Mahasiswa
        const headerContainer = document.getElementById('header-container');
        if (headerContainer) {
            const response = await fetch('../components/header-mahasiswa.html');
            const headerHTML = await response.text();
            headerContainer.innerHTML = headerHTML;

            // Isi Header dengan data session
            const sessionData = localStorage.getItem('user_session');
            if (sessionData) {
                const user = JSON.parse(sessionData);
                const pageTitle = document.getElementById('pageTitle');
                if (pageTitle) pageTitle.innerText = 'Dashboard Mahasiswa';

                const nameDisplay = document.getElementById('mahasiswaNameDisplay');
                if (nameDisplay) nameDisplay.innerText = user.nama_mahasiswa || 'Mahasiswa';

                const prodiDisplay = document.getElementById('mahasiswaProdiDisplay');
                if (prodiDisplay) prodiDisplay.innerText = user.program_studi || 'Mahasiswa';
            }
        }
    } catch (error) {
        console.error("Gagal memuat komponen mahasiswa:", error);
    }
});
