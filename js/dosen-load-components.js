// js/dosen-load-components.js
document.addEventListener('DOMContentLoaded', async function() {
    // 1. Muat Sidebar Dosen
    const sidebarContainer = document.getElementById('sidebar-container');
    if (sidebarContainer) {
        const sidebarHTML = await fetch('components/sidebar-dosen.html').then(res => res.text());
        sidebarContainer.innerHTML = sidebarHTML;
        
        // Tandai menu aktif berdasarkan halaman saat ini
        const currentPage = window.location.pathname.split('/').pop();
        let activeId = '';
        if (currentPage === 'dosen-dashboard.html') activeId = 'menu-dashboard';
        else if (currentPage === 'dosen-matakuliah.html') activeId = 'menu-matakuliah';
        else if (currentPage === 'dosen-tugas.html') activeId = 'menu-tugas';
        else if (currentPage === 'dosen-ujian.html') activeId = 'menu-ujian';
        else if (currentPage === 'dosen-absensi.html') activeId = 'menu-absensi';
        else if (currentPage === 'dosen-nilai.html') activeId = 'menu-nilai';
        else if (currentPage === 'dosen-profil.html') activeId = 'menu-profil';

        if (activeId) {
            const activeLink = document.getElementById(activeId);
            if (activeLink) {
                activeLink.classList.add('sidebar-item-active', 'rounded-xl');
            }
        }
    }

    // 2. Muat Header Dosen
    const headerContainer = document.getElementById('header-container');
    if (headerContainer) {
        const headerHTML = await fetch('components/header-dosen.html').then(res => res.text());
        headerContainer.innerHTML = headerHTML;
        
        // (Opsional) Tambahkan logika untuk menampilkan nama dosen dari session jika header kosong
        // Ambil data dari session dan isi ke elemen header
    }
});
