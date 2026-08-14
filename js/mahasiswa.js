// js/mahasiswa.js - Logika khusus Dashboard Mahasiswa

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Cek apakah pengguna sudah login
    const sessionData = localStorage.getItem('user_session');
    
    if (!sessionData) {
        // Jika belum login, tendang kembali ke halaman login
        window.location.href = '../login.html';
        return;
    }

    const user = JSON.parse(sessionData);

    // 2. Keamanan ekstra: Pastikan yang masuk benar-benar mahasiswa
    if (user.role !== 'mahasiswa') {
        alert('Akses ditolak. Anda bukan mahasiswa.');
        window.location.href = '../login.html';
        return;
    }

    // 3. Tampilkan Nama User di Dashboard
    // Mengambil kata pertama dari username jika nama lengkap belum di-fetch
    const namaAwal = user.username.split('@')[0];
    document.getElementById('userNameDisplay').innerText = namaAwal.charAt(0).toUpperCase() + namaAwal.slice(1);

    // 4. Fungsi Logout
    document.getElementById('btnLogout').addEventListener('click', () => {
        localStorage.removeItem('user_session');
        window.location.href = '../login.html';
    });

    // 5. Mengambil Data Jadwal Kelas dari Google Sheets
    await loadJadwalKelas(user.id_user);
});

async function loadJadwalKelas(id_mahasiswa) {
    try {
        // Panggil API di Google Apps Script (menggunakan CONFIG.API_URL dari config.js)
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'get_kelas_mahasiswa',
                id_mahasiswa: id_mahasiswa
            })
        });

        const result = await response.json();

        if (result.status === 'success') {
            console.log("Data Kelas:", result.data);
            // Nanti kita akan membuat kode untuk merender data ini ke HTML
            // Untuk saat ini, kita pastikan datanya berhasil ditarik dan muncul di console
        }
    } catch (error) {
        console.error("Gagal mengambil data kelas:", error);
    }
}
