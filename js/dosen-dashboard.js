// js/dosen-dashboard.js - Dashboard Dosen

document.addEventListener('DOMContentLoaded', async () => {
    const sessionData = localStorage.getItem('user_session');
    
    if (sessionData) {
        const user = JSON.parse(sessionData);

        // Set Judul Halaman untuk Header Komponen
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) pageTitle.innerText = 'Dashboard Dosen';
        
        // 1. Validasi Role (jika bukan dosen, lempar ke login)
        if (user.role && user.role !== 'dosen') {
            console.warn("Role pengguna tidak sesuai untuk halaman dosen.");
            window.location.href = 'login.html';
            return;
        }

        // 2. Tampilkan Data Profil di UI
        const namaDosen = user.nama_dosen || 'Dosen EduLearn';
        const spesialisasiDosen = user.spesialisasi || 'Pengajar Akademik';
        
        const userNameDisplay = document.getElementById('dosenNameDisplay');
        if (userNameDisplay) userNameDisplay.innerText = namaDosen;

        const userSpesialisasi = document.getElementById('dosenSpesialisasiDisplay');
        if (userSpesialisasi) userSpesialisasi.innerText = spesialisasiDosen;

        const bannerName = document.getElementById('bannerDosenName');
        if (bannerName) bannerName.innerText = namaDosen;

        // 3. Load Data Statistik Dashboard (Jumlah Kelas)
        if (user.id_dosen) {
            await loadStatistikDosen(user.id_dosen);
        } else {
            console.error("ID Dosen tidak ditemukan di session.");
        }

    } else {
        window.location.href = 'login.html';
    }
});

// 4. Event Delegation untuk Tombol Keluar (Logout)
// Ini akan bekerja meskipun tombol dimuat secara dinamis oleh komponen
document.addEventListener('click', function(e) {
    // Cek apakah elemen yang diklik adalah tombol dengan id btnLogout atau berada di dalamnya
    const logoutBtn = e.target.closest('#btnLogout');
    if (logoutBtn) {
        localStorage.removeItem('user_session');
        window.location.href = 'login.html';
    }
});

// 5. Fungsi Memuat Statistik Dashboard
async function loadStatistikDosen(id_dosen) {
    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            body: JSON.stringify({ 
                action: 'get_matakuliah_ampuan',
                id_dosen: id_dosen 
            })
        });
        const result = await response.json();

        if (result.status === 'success') {
            // Update angka "Kelas Diampu" di dashboard
            const kelasCountElement = document.querySelector('.bg-teal-50 + div h3');
            if (kelasCountElement && result.data) {
                kelasCountElement.innerText = result.data.length;
            }
        }
    } catch (error) {
        console.error("Gagal memuat statistik dashboard:", error);
    }
}
