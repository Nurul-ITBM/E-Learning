/**
 * Logika khusus untuk memuat sesi login Dosen
 */
document.addEventListener('DOMContentLoaded', () => {
    const sessionData = localStorage.getItem('user_session');
    
    if (sessionData) {
        const user = JSON.parse(sessionData);
        
        // Memastikan role yang login benar-benar dosen, jika bukan arahkan kembali atau cegah error
        if (user.role && user.role !== 'dosen') {
            console.warn("Role pengguna tidak sesuai untuk halaman dosen.");
        }

        // Mengambil data nama dan spesialisasi dari respons backend
        const namaDosen = user.nama_dosen || 'Dosen EduLearn';
        const spesialisasiDosen = user.spesialisasi || 'Pengajar Akademik';
        
        // Menampilkan nama ke elemen di Navbar
        const userNameDisplay = document.getElementById('dosenNameDisplay');
        if (userNameDisplay) {
            userNameDisplay.innerText = namaDosen;
        }

        // Menampilkan spesialisasi jika ada
        const userSpesialisasi = document.getElementById('dosenSpesialisasiDisplay');
        if (userSpesialisasi) {
            userSpesialisasi.innerText = spesialisasiDosen;
        }

        // Menampilkan nama ke Banner Sambutan Utama
        const bannerName = document.getElementById('bannerDosenName');
        if (bannerName) {
            bannerName.innerText = namaDosen;
        }
    } else {
        // Jika tidak ada sesi login, arahkan kembali ke halaman login utama
        window.location.href = 'login.html';
    }

    // Tombol Keluar (Logout)
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            localStorage.removeItem('user_session');
            window.location.href = 'login.html';
        });
    }
});
