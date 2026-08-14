// js/absensi.js

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Validasi Sesi Login
    const sessionData = localStorage.getItem('user_session');
    if (!sessionData) { 
        window.location.href = '../login.html'; 
        return; 
    }
    
    const user = JSON.parse(sessionData);
    const namaUser = user.username ? user.username.split('@')[0] : 'Mahasiswa';
    document.getElementById('userNameDisplay').innerText = namaUser;

    // 2. Fetch Data dari Server (Google Apps Script)
    try {
        const res = await fetch(CONFIG.API_URL, {
            method: 'POST',
            body: JSON.stringify({ 
                action: 'get_absensi', 
                id_mahasiswa: user.id_mahasiswa 
            })
        });
        const result = await res.json();
        
        const tbody = document.getElementById('tabelAbsensiBody');
        tbody.innerHTML = '';
        
        // Di dalam file js/absensi.js
        if (result.status === 'success' && result.data.length > 0) {
            result.data.forEach(item => {
                let color = 'text-slate-600 bg-slate-50 border-slate-200';
                if (item.status === 'Hadir') {
                    color = 'text-emerald-600 bg-emerald-50 border-emerald-200';
                } else if (item.status === 'Izin' || item.status === 'Sakit') {
                    color = 'text-amber-600 bg-amber-50 border-amber-200';
                }
                
                tbody.innerHTML += `
                    <tr class="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td class="px-6 py-4 font-bold text-slate-800">${item.nama_pertemuan || '-'}</td>
                        <td class="px-6 py-4">${item.tanggal || '-'}</td>
                        <td class="px-6 py-4 font-mono text-emerald-600 font-semibold">${item.waktu_masuk || '-'}</td>
                        <td class="px-6 py-4 font-mono text-red-600 font-semibold">${item.waktu_keluar || '-'}</td>
                        <td class="px-6 py-4">
                            <span class="px-3 py-1 rounded-full text-[10px] font-bold border ${color}">${item.status || 'Belum'}</span>
                        </td>
                        <td class="px-6 py-4 text-center">
                            <div class="flex justify-center space-x-2">
                                <button onclick="kirimAbsen('MASUK', '${item.id_pertemuan}')" class="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-sm transition">MASUK</button>
                                <button onclick="kirimAbsen('KELUAR', '${item.id_pertemuan}')" class="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-sm transition">KELUAR</button>
                            </div>
                        </td>
                    </tr>
                `;
            });
        } else {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center py-10 text-slate-400">Belum ada riwayat absensi.</td></tr>`;
        }
    } catch (err) {
        console.error(err);
        document.getElementById('tabelAbsensiBody').innerHTML = `<tr><td colspan="5" class="text-center py-10 text-red-400">Gagal memuat data dari server.</td></tr>`;
    }

    // 3. Tombol Logout
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            localStorage.removeItem('user_session');
            window.location.href = '../login.html';
        });
    }
});

// 4. Fungsi untuk Mengirim Aksi Tombol Absen (Masuk / Keluar)
async function kirimAbsen(aksi, id_pertemuan) {
    const sessionData = localStorage.getItem('user_session');
    if (!sessionData) return;
    
    const user = JSON.parse(sessionData);
    
    if (!confirm(`Apakah Anda yakin ingin melakukan absen ${aksi}?`)) return;

    try {
        const res = await fetch(CONFIG.API_URL, {
            method: 'POST',
            body: JSON.stringify({ 
                action: 'proses_absen', 
                id_mahasiswa: user.id_mahasiswa, 
                id_pertemuan: id_pertemuan, 
                aksi: aksi 
            })
        });
        const result = await res.json();
        alert(result.message);
        
        if (result.status === 'success') {
            location.reload(); // Muat ulang halaman untuk memperbarui status
        }
    } catch (err) {
        console.error(err);
        alert("Terjadi kesalahan koneksi ke server.");
    }
}
