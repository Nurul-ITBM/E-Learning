// js/dosen-load-components.js
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // 1. Muat Sidebar Dosen
        const sidebarContainer = document.getElementById('sidebar-container');
        if (sidebarContainer) {
            // PERBAIKAN PENTING: Tambahkan "../" di depan path
            const response = await fetch('../components/sidebar-dosen.html');
            if (!response.ok) throw new Error(`Gagal memuat sidebar: HTTP ${response.status}`);
            
            const sidebarHTML = await response.text();
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
            // PERBAIKAN PENTING: Tambahkan "../" di depan path
            const response = await fetch('../components/header-dosen.html');
            if (!response.ok) throw new Error(`Gagal memuat header: HTTP ${response.status}`);
            
            const headerHTML = await response.text();
            headerContainer.innerHTML = headerHTML;
        }
    } catch (error) {
        console.error("Gagal memuat komponen:", error);
        // Tampilkan pesan error di layar agar Anda tahu penyebabnya
        document.body.innerHTML += `
            <div style="position:fixed; top:0; left:0; width:100%; padding:20px; background: #fee; color:red; border-bottom:3px solid red; z-index:9999;">
                <strong>⚠️ Error Memuat Komponen:</strong> ${error.message} <br>
                <small>Cek Console (F12) untuk detail lebih lanjut.</small>
            </div>
        `;
    }
});
