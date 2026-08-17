// js/dosen.js - Dashboard Dosen

document.addEventListener('DOMContentLoaded', async () => {
    const sessionData = localStorage.getItem('user_session');
    
    if (sessionData) {
        const user = JSON.parse(sessionData);

        // --- TAMBAHKAN DI SINI ---
        // Set Judul Halaman untuk Header Komponen
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) pageTitle.innerText = 'Dashboard Dosen';
        // -------------------------
        
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

        // 3. Load Data Statistik Dashboard (Jumlah Kelas, Tugas Masuk, dll)
        // Pastikan user.id_dosen ada (dari login)
        if (user.id_dosen) {
            await loadStatistikDosen(user.id_dosen);
        } else {
            console.error("ID Dosen tidak ditemukan di session.");
        }

    } else {
        // Jika tidak ada sesi login, arahkan kembali ke halaman login utama
        window.location.href = 'login.html';
    }

    // 4. Tombol Keluar (Logout)
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            localStorage.removeItem('user_session');
            window.location.href = 'login.html';
        });
    }
});

// 5. Fungsi Memuat Statistik Dashboard (Opsional, jika ingin dinamis)
async function loadStatistikDosen(id_dosen) {
    try {
        // Contoh: Ambil data jumlah kelas yang diampu
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            body: JSON.stringify({ 
                action: 'get_matakuliah_ampuan', // Fungsi backend yang sudah dibuat
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
        // Jika gagal, angka statistik tetap seperti default (3, 42, 5, 120)
    }
}
