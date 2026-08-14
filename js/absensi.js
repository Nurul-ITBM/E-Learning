// js/absensi.js

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Validasi Sesi
    const sessionData = localStorage.getItem('user_session');
    if (!sessionData) { window.location.href = '../login.html'; return; }
    
    const user = JSON.parse(sessionData);
    document.getElementById('userNameDisplay').innerText = user.username.split('@')[0];

    // 2. Fetch Data dari Server
    try {
        const res = await fetch(CONFIG.API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'get_absensi', id_mahasiswa: user.id_user })
        });
        const result = await res.json();
        
        const tbody = document.getElementById('tabelAbsensiBody');
        tbody.innerHTML = ''; // Hapus loading
        
        if (result.status === 'success' && result.data.length > 0) {
            result.data.forEach(item => {
                let color = item.status === 'Hadir' ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-amber-600 bg-amber-50 border-amber-200';
                
                tbody.innerHTML += `
                    <tr class="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td class="px-6 py-4 font-bold text-slate-800">${item.nama_pertemuan}</td>
                        <td class="px-6 py-4">${item.tanggal}</td>
                        <td class="px-6 py-4 font-mono">${item.waktu_absen}</td>
                        <td class="px-6 py-4">
                            <span class="px-3 py-1 rounded-full text-[10px] font-bold border ${color}">${item.status}</span>
                        </td>
                    </tr>
                `;
            });
        } else {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center py-10 text-slate-400">Belum ada riwayat absensi.</td></tr>`;
        }
    } catch (err) {
        console.error(err);
        document.getElementById('tabelAbsensiBody').innerHTML = `<tr><td colspan="4" class="text-center py-10 text-red-400">Gagal memuat data.</td></tr>`;
    }

    // Logout
    document.getElementById('btnLogout').addEventListener('click', () => {
        localStorage.removeItem('user_session');
        window.location.href = '../login.html';
    });
});
