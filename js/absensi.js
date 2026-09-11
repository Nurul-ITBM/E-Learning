// js/absensi.js - Logika Halaman Absensi Mahasiswa

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Validasi Sesi Login
    const sessionData = localStorage.getItem('user_session');
    if (!sessionData) { 
        window.location.href = '../login.html'; 
        return; 
    }
    
    const user = JSON.parse(sessionData);
    console.log(">>> User session:", user);

    // 2. Fetch Data Absensi dari Server
    try {
        const res = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify({ 
                action: 'get_absensi', 
                id_mahasiswa: user.id_mahasiswa || user.id_user
            })
        });
        const result = await res.json();
        console.log(">>> Data absensi:", result);
        
        const tbody = document.getElementById('tabelAbsensiBody');
        tbody.innerHTML = '';
        
        if (result.status === 'success' && result.data.length > 0) {
            result.data.forEach(item => {
                // Warna badge status
                let color = 'text-slate-600 bg-slate-50 border-slate-200';
                if (item.status === 'Hadir') {
                    color = 'text-emerald-600 bg-emerald-50 border-emerald-200';
                } else if (item.status === 'Izin' || item.status === 'Sakit') {
                    color = 'text-amber-600 bg-amber-50 border-amber-200';
                } else if (item.status === 'Alpha') {
                    color = 'text-red-600 bg-red-50 border-red-200';
                }
                
                // Cek apakah sudah absen masuk/keluar
                const sudahMasuk = item.waktu_masuk && item.waktu_masuk !== '-';
                const sudahKeluar = item.waktu_keluar && item.waktu_keluar !== '-';
                
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
                                ${!sudahMasuk ? `
                                    <button onclick="kirimAbsen('MASUK', '${item.id_pertemuan}')" class="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-sm transition">
                                        <i class="fa-solid fa-right-to-bracket mr-1"></i> MASUK
                                    </button>
                                ` : `
                                    <span class="text-[10px] text-slate-400 italic">Sudah Masuk</span>
                                `}
                                ${sudahMasuk && !sudahKeluar ? `
                                    <button onclick="kirimAbsen('KELUAR', '${item.id_pertemuan}')" class="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-sm transition">
                                        <i class="fa-solid fa-right-from-bracket mr-1"></i> KELUAR
                                    </button>
                                ` : sudahKeluar ? `
                                    <span class="text-[10px] text-slate-400 italic">Selesai</span>
                                ` : ''}
                            </div>
                        </td>
                    </tr>
                `;
            });
        } else {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-10 text-slate-400 italic">
                        <i class="fa-regular fa-folder-open text-3xl mb-2 block"></i>
                        Belum ada riwayat absensi.
                    </td>
                </tr>
            `;
        }
    } catch (err) {
        console.error("Error load absensi:", err);
        document.getElementById('tabelAbsensiBody').innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-10 text-red-400">
                    <i class="fa-solid fa-circle-exclamation text-3xl mb-2 block"></i>
                    Gagal memuat data dari server.
                </td>
            </tr>
        `;
    }
});

// ==========================================
// FUNGSI KIRIM ABSEN (MASUK / KELUAR)
// ==========================================
async function kirimAbsen(aksi, id_pertemuan) {
    const sessionData = localStorage.getItem('user_session');
    if (!sessionData) {
        alert('Sesi tidak valid. Silakan login ulang.');
        return;
    }
    
    const user = JSON.parse(sessionData);
    
    if (!confirm(`Apakah Anda yakin ingin melakukan absen ${aksi}?`)) return;

    try {
        const res = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify({ 
                action: 'proses_absen', 
                id_mahasiswa: user.id_mahasiswa || user.id_user, 
                id_pertemuan: id_pertemuan, 
                aksi: aksi 
            })
        });
        const result = await res.json();
        console.log(">>> Response absen:", result);
        alert(result.message);
        
        if (result.status === 'success') {
            location.reload();
        }
    } catch (err) {
        console.error("Error kirim absen:", err);
        alert("Terjadi kesalahan koneksi ke server.");
    }
}
