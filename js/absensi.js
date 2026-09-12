// ==========================================
// js/absensi.js - Logika Halaman Absensi Mahasiswa
// Fitur: Filter Tanggal, Window Absen 15 Menit, Absen Keluar Independen
// ==========================================

let dataAbsensiGlobal = [];
let currentUser = null;

// ==========================================
// INISIALISASI
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Validasi Sesi
    const sessionData = localStorage.getItem('user_session');
    if (!sessionData) { 
        window.location.href = '../login.html'; 
        return; 
    }
    
    currentUser = JSON.parse(sessionData);
    console.log(">>> User session:", currentUser);

    // 2. Set Jam Sekarang
    updateJamSekarang();
    setInterval(updateJamSekarang, 1000);

    // 3. Tunggu DOM siap
    await new Promise(resolve => setTimeout(resolve, 100));

    // 4. Cek elemen
    const filterTanggal = document.getElementById('filterTanggalAbsen');
    const filterStatus = document.getElementById('filterStatusAbsen');
    const btnReset = document.getElementById('btnResetFilter');

    if (filterTanggal) filterTanggal.addEventListener('change', applyFilter);
    if (filterStatus) filterStatus.addEventListener('change', applyFilter);
    if (btnReset) btnReset.addEventListener('click', resetFilter);

    // 5. Load Data Absensi
    await loadAbsensi(currentUser);

    // 6. Auto-refresh setiap 30 detik
    setInterval(() => {
        console.log(">>> Auto-refresh absensi...");
        loadAbsensi(currentUser);
    }, 30000);
});

// ==========================================
// UPDATE JAM SEKARANG (WITA)
// ==========================================
function updateJamSekarang() {
    const el = document.getElementById('jamSekarang');
    if (!el) return;
    
    const now = new Date();
    const witaTime = now.toLocaleString('id-ID', {
        timeZone: 'Asia/Makassar',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
    el.innerText = witaTime + ' WITA';
}

// ==========================================
// LOAD DATA ABSENSI
// ==========================================
async function loadAbsensi(user) {
    try {
        const res = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ 
                action: 'get_absensi', 
                id_mahasiswa: user.id_mahasiswa || user.id_user
            })
        });
        const result = await res.json();
        console.log(">>> Data absensi:", result);
        
        if (result.status === 'success') {
            dataAbsensiGlobal = result.data || [];
            renderTabel(dataAbsensiGlobal);
        } else {
            document.getElementById('tabelAbsensiBody').innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-10 text-red-400">
                        <i class="fa-solid fa-circle-exclamation text-3xl mb-2 block"></i>
                        ${result.message || 'Gagal memuat data.'}
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
                    Gagal terhubung ke server.
                </td>
            </tr>
        `;
    }
}

async function loadAbsensi(user, retryCount = 0) {
    const MAX_RETRY = 2;
    
    try {
        const res = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ 
                action: 'get_absensi', 
                id_mahasiswa: user.id_mahasiswa || user.id_user
            })
        });
        const result = await res.json();
        console.log(">>> Data absensi:", result);
        
        if (result.status === 'success') {
            dataAbsensiGlobal = result.data || [];
            renderTabel(dataAbsensiGlobal);
        } else {
            showErrorState(result.message || 'Gagal memuat data.');
        }
    } catch (err) {
        console.error("Error load absensi:", err);
        
        // ✅ Retry logic
        if (retryCount < MAX_RETRY) {
            console.log(`>>> Retry ${retryCount + 1}/${MAX_RETRY}...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            return loadAbsensi(user, retryCount + 1);
        }
        
        showErrorState('Gagal terhubung ke server. Coba lagi nanti.');
    }
}

function showErrorState(message) {
    document.getElementById('tabelAbsensiBody').innerHTML = `
        <tr>
            <td colspan="6" class="text-center py-10 text-red-400">
                <i class="fa-solid fa-circle-exclamation text-3xl mb-2 block"></i>
                <p>${message}</p>
                <button onclick="loadAbsensi(currentUser)" class="mt-3 bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600">
                    <i class="fa-solid fa-rotate mr-1"></i> Coba Lagi
                </button>
            </td>
        </tr>
    `;
}

// ==========================================
// RENDER TABEL
// ==========================================
function renderTabel(data) {
    const tbody = document.getElementById('tabelAbsensiBody');
    
    if (data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-10 text-slate-400 italic">
                    <i class="fa-regular fa-folder-open text-3xl mb-2 block"></i>
                    Belum ada data absensi.
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = '';
    
    data.forEach(item => {
        // Warna badge status
        let color = 'text-slate-600 bg-slate-50 border-slate-200';
        let statusLabel = item.status || 'Belum';
        
        if (item.status === 'Hadir') {
            color = 'text-emerald-600 bg-emerald-50 border-emerald-200';
        } else if (item.status === 'Izin' || item.status === 'Sakit') {
            color = 'text-amber-600 bg-amber-50 border-amber-200';
        } else if (item.status === 'Terlambat') {
            color = 'text-orange-600 bg-orange-50 border-orange-200';
        } else if (item.status === 'Alpha') {
            color = 'text-red-600 bg-red-50 border-red-200';
        }
        
        // ✅ TOMBOL ABSEN MASUK
        let tombolMasuk = '';
        if (item.waktu_masuk && item.waktu_masuk !== '-' && item.waktu_masuk !== '') {
            // Sudah absen masuk
            tombolMasuk = `
                <div class="text-center">
                    <div class="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-1 rounded-lg text-[10px] font-bold">
                        <i class="fa-solid fa-check-circle"></i> ${item.waktu_masuk}
                    </div>
                </div>
            `;
        } else if (item.bisa_absen_masuk) {
            // BISA absen masuk
            tombolMasuk = `
                <button onclick="kirimAbsen('MASUK', '${item.id_pertemuan}')" 
                    class="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-sm transition animate-pulse w-full">
                    <i class="fa-solid fa-right-to-bracket mr-1"></i> MASUK
                </button>
            `;
        } else {
            // TIDAK BISA absen masuk
            tombolMasuk = `
                <button disabled 
                    class="tooltip-btn bg-slate-100 text-slate-400 px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-not-allowed w-full"
                    data-tooltip="${item.alasan_masuk || 'Belum waktunya'}">
                    <i class="fa-solid fa-lock mr-1"></i> MASUK
                </button>
            `;
        }
        
        // ✅ TOMBOL ABSEN KELUAR
        // Perubahan: TIDAK ada syarat "harus absen masuk dulu"
        let tombolKeluar = '';
        if (item.waktu_keluar && item.waktu_keluar !== '-' && item.waktu_keluar !== '') {
            // Sudah absen keluar
            tombolKeluar = `
                <div class="text-center">
                    <div class="inline-flex items-center gap-1 bg-red-50 text-red-600 border border-red-200 px-2 py-1 rounded-lg text-[10px] font-bold">
                        <i class="fa-solid fa-check-circle"></i> ${item.waktu_keluar}
                    </div>
                </div>
            `;
        } else if (item.bisa_absen_keluar) {
            // BISA absen keluar
            tombolKeluar = `
                <button onclick="kirimAbsen('KELUAR', '${item.id_pertemuan}')" 
                    class="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-sm transition animate-pulse w-full">
                    <i class="fa-solid fa-right-from-bracket mr-1"></i> KELUAR
                </button>
            `;
        } else {
            // TIDAK BISA absen keluar
            tombolKeluar = `
                <button disabled 
                    class="tooltip-btn bg-slate-100 text-slate-400 px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-not-allowed w-full"
                    data-tooltip="${item.alasan_keluar || 'Belum waktunya'}">
                    <i class="fa-solid fa-lock mr-1"></i> KELUAR
                </button>
            `;
        }
        
        tbody.innerHTML += `
            <tr class="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                <td class="px-4 py-4">
                    <div class="font-bold text-slate-800">${item.nama_pertemuan || '-'}</div>
                    <div class="text-[10px] text-slate-500 mt-0.5">${item.judul_materi || '-'}</div>
                </td>
                <td class="px-4 py-4">
                    <div class="font-semibold">${item.tanggal || '-'}</div>
                </td>
                <td class="px-4 py-4">
                    <div class="text-xs">
                        <i class="fa-regular fa-clock text-slate-400 mr-1"></i>
                        ${item.jam_mulai || '-'} - ${item.jam_selesai || '-'}
                    </div>
                </td>
                <td class="px-4 py-4 text-center">${tombolMasuk}</td>
                <td class="px-4 py-4 text-center">${tombolKeluar}</td>
                <td class="px-4 py-4 text-center">
                    <span class="px-3 py-1 rounded-full text-[10px] font-bold border ${color}">${statusLabel}</span>
                </td>
            </tr>
        `;
    });
}

// ==========================================
// FILTER DATA
// ==========================================
function applyFilter() {
    const tanggal = document.getElementById('filterTanggalAbsen')?.value || '';
    const status = document.getElementById('filterStatusAbsen')?.value || '';
    
    let filtered = [...dataAbsensiGlobal];
    
    // Filter tanggal
    if (tanggal) {
        const [year, month, day] = tanggal.split('-');
        const namaBulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 
                          'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        const bulanStr = namaBulan[parseInt(month) - 1];
        const tanggalPattern = `${parseInt(day)} ${bulanStr} ${year}`;
        
        filtered = filtered.filter(item => {
            return item.tanggal && item.tanggal === tanggalPattern;
        });
    }
    
    // Filter status
    if (status) {
        filtered = filtered.filter(item => {
            if (status === 'Belum') {
                return !item.waktu_masuk || item.waktu_masuk === '-';
            }
            return item.status === status;
        });
    }
    
    renderTabel(filtered);
}

function resetFilter() {
    const filterTanggal = document.getElementById('filterTanggalAbsen');
    const filterStatus = document.getElementById('filterStatusAbsen');
    
    if (filterTanggal) filterTanggal.value = '';
    if (filterStatus) filterStatus.value = '';
    
    renderTabel(dataAbsensiGlobal);
}

// ==========================================
// KIRIM ABSEN (MASUK / KELUAR)
// ==========================================
async function kirimAbsen(aksi, id_pertemuan) {
    if (!currentUser) {
        alert('Sesi tidak valid. Silakan login ulang.');
        return;
    }
    
    const pesanKonfirmasi = aksi === 'MASUK' 
        ? 'Apakah Anda yakin ingin melakukan absen MASUK?' 
        : 'Apakah Anda yakin ingin melakukan absen KELUAR?';
    
    if (!confirm(pesanKonfirmasi)) return;

    // Loading state
    const btn = event.target.closest('button');
    const originalHtml = btn ? btn.innerHTML : '';
    if (btn) {
        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>';
        btn.disabled = true;
    }

    try {
        const res = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ 
                action: 'proses_absen', 
                id_mahasiswa: currentUser.id_mahasiswa || currentUser.id_user, 
                id_pertemuan: id_pertemuan, 
                aksi: aksi 
            })
        });
        const result = await res.json();
        console.log(">>> Response absen:", result);
        alert(result.message);
        
        if (result.status === 'success') {
            // Reload data absensi
            await loadAbsensi(currentUser);
        } else {
            if (btn) {
                btn.innerHTML = originalHtml;
                btn.disabled = false;
            }
        }
    } catch (err) {
        console.error("Error kirim absen:", err);
        alert("❌ Terjadi kesalahan koneksi ke server.");
        if (btn) {
            btn.innerHTML = originalHtml;
            btn.disabled = false;
        }
    }
}
