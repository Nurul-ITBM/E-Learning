// js/dosen-dashboard.js - Dashboard Dosen
document.addEventListener('DOMContentLoaded', async () => {
    const sessionData = localStorage.getItem('user_session');
    
    if (sessionData) {
        const user = JSON.parse(sessionData);
        // Validasi Role
        if (user.role && user.role !== 'dosen') {
            window.location.href = 'login.html';
            return;
        }
        // Update Banner di Konten Utama (bukan header)
        const bannerName = document.getElementById('bannerDosenName');
        if (bannerName) bannerName.innerText = user.nama_dosen || 'Dosen';

        // Load Statistik (jumlah kelas)
        if (user.id_dosen) {
            await loadStatistikDosen(user.id_dosen);
        }
    } else {
        window.location.href = 'login.html';
    }
});

// Event Delegation untuk Logout
document.addEventListener('click', function(e) {
    const logoutBtn = e.target.closest('#btnLogout');
    if (logoutBtn) {
        localStorage.removeItem('user_session');
        window.location.href = 'login.html';
    }
});

async function loadStatistikDosen(id_dosen) {
    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'get_matakuliah_ampuan', id_dosen: id_dosen })
        });
        const result = await response.json();
        if (result.status === 'success') {
            const kelasCountElement = document.querySelector('.bg-teal-50 + div h3');
            if (kelasCountElement && result.data) {
                kelasCountElement.innerText = result.data.length;
            }
        }
    } catch (error) {
        console.error("Gagal memuat statistik dashboard:", error);
    }
}
