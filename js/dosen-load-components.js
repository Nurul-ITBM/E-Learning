// js/dosen-load-components.js
document.addEventListener('DOMContentLoaded', async function() {
    // 1. MUAT SIDEBAR DOSEN
    const sidebarContainer = document.getElementById('sidebar-container');
    if (sidebarContainer) {
        try {
            // Pastikan path file benar (relatif terhadap root)
            const sidebarHTML = await fetch('components/sidebar-dosen.html').then(res => res.text());
            if (!response.ok) {
                throw new Error(`Gagal memuat sidebar: ${response.status} ${response.statusText}`);
            }
            const sidebarHTML = await response.text();
            sidebarContainer.innerHTML = sidebarHTML;
            
            // Tandai menu aktif
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
        } catch (error) {
            console.error('Error loading sidebar:', error);
            sidebarContainer.innerHTML = `<p class="text-red-500 p-4">Gagal memuat sidebar. Pastikan file components/sidebar.html ada.</p>`;
        }
    }

    // 2. MUAT HEADER DOSEN
    const headerContainer = document.getElementById('header-container');
    if (headerContainer) {
        try {
            const headerHTML = await fetch('components/header-dosen.html').then(res => res.text());
            if (!response.ok) {
                throw new Error(`Gagal memuat header: ${response.status} ${response.statusText}`);
            }
            const headerHTML = await response.text();
            headerContainer.innerHTML = headerHTML;
        } catch (error) {
            console.error('Error loading header:', error);
            headerContainer.innerHTML = `<p class="text-red-500 p-4">Gagal memuat header. Pastikan file components/header.html ada.</p>`;
        }
    }
});
