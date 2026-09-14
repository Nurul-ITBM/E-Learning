// ==========================================
// js/absensi.js - Logika Halaman Absensi Mahasiswa
// ✅ Versi Baru: Panel Absen Hari Ini + Tabel Riwayat
// ==========================================

let dataAbsensiGlobal = [];
let currentUser = null;

// ==========================================
// INISIALISASI
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Validasi Sesi
    const sessionData = localStorage.getItem('user_session') || localStorage.getItem('user');
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

    // 4. Setup Filter
    const filterTanggal = document.getElementById('filterTanggalAbsen');
    const filterStatus = document.getElementById('filterStatusAbsen');
    const btnReset = document.getElementById('btnResetFilter');

    if (filterTanggal) filterTanggal.addEventListener('change', applyFilter);
    if (filterStatus) filterStatus.addEventListener('change', applyFilter);
    if (btnReset) btnReset.addEventListener('click', resetFilter);

    // 5. Load Data Absensi
    await loadAbsensi(currentUser);

    // 6. Auto-refresh setiap 30 detik (biar panel absen update)
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
            
            // ✅ Render panel absen hari ini (FOKUS UTAMA)
            renderPanelAbsenHariIni(dataAbsensiGlobal);
            
            // ✅ Update statistik
            updateStatistik(dataAbsensiGlobal);
            
            // ✅ Render tabel riwayat
            renderTabel(dataAbsensiGlobal);
        } else {
            showErrorState(result.message || 'Gagal memuat data.');
        }
    } catch (err) {
        console.error("Error load absensi:", err);
        
        if (retryCount < MAX_RETRY) {
            console.log(`>>> Retry ${retryCount + 1}/${MAX_RETRY}...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            return loadAbsensi(user, retryCount + 1);
        }
        
        showErrorState('Gagal terhubung ke server. Coba lagi nanti.');
    }
}

function showErrorState(message) {
    const panel = document.getElementById('panelAbsenHariIni');
    if (panel) {
        panel.innerHTML = `
            <div class="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
                <i class="fa-solid fa-circle-exclamation text-red-500 text-3xl mb-2"></i>
                <p class="text-red-600 font-bold mb-1">Gagal memuat data</p>
                <p class="text-red-500 text-xs mb-3">${message}</p>
                <button onclick="loadAbsensi(currentUser)" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition">
                    <i class="fa-solid fa-rotate mr-1"></i> Coba Lagi
                </button>
            </div>
        `;
    }
    
    const tbody = document.getElementById('tabelAbsensiBody');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-10 text-red-400">
                    <i class="fa-solid fa-circle-exclamation text-3xl mb-2 block"></i>
                    ${message}
                </td>
            </tr>
        `;
    }
}

// ==========================================
// ✅ RENDER PANEL ABSEN HARI INI (FOKUS UTAMA)
// ==========================================
function renderPanelAbsenHariIni(data) {
    const panel = document.getElementById('panelAbsenHariIni');
    if (!panel) return;
    
    // ✅ Cari pertemuan yang BISA absen (masuk atau keluar)
    const pertemuanAktif = data.filter(item => 
        item.bisa_absen_masuk || item.bisa_absen_keluar
    );
    
    // ✅ Kalau tidak ada yang bisa absen, cari pertemuan yang belum selesai (untuk info)
    const pertemuanHariIni = data.filter(item => {
        if (!item.tanggal) return false;
        // Cek apakah hari ini
        const now = new Date();
        const todayStr = now.toLocaleDateString('id-ID', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
        });
        return item.tanggal === todayStr;
    });
    
    // ==========================================
    // KASUS 1: ADA PERTEMUAN YANG BISA ABSEN
    // ==========================================
    if (pertemuanAktif.length > 0) {
        let html = `
            <div class="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden">
                <div class="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                <div class="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                
                <div class="relative">
                    <div class="flex items-center gap-2 mb-4">
                        <span class="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                            <span class="w-2 h-2 bg-green-300 rounded-full animate-pulse"></span>
                            ABSEN TERSEDIA
                        </span>
                    </div>
                    <h3 class="text-lg font-bold mb-1">🎯 Waktunya Absen!</h3>
                    <p class="text-sm text-teal-100 mb-4">
                        ${pertemuanAktif.length} pertemuan bisa diabsen sekarang.
                    </p>
        `;
        
        // Loop setiap pertemuan yang bisa diabsen
        pertemuanAktif.forEach((item, index) => {
            const bisaMasuk = item.bisa_absen_masuk;
            const bisaKeluar = item.bisa_absen_keluar;
            
            html += `
                <div class="bg-white/15 backdrop-blur-sm rounded-xl p-4 mb-3 border border-white/20">
                    <div class="mb-3">
                        <p class="font-bold text-sm">${item.nama_pertemuan || '-'}</p>
                        <p class="text-xs text-teal-100 mt-0.5">
                            <i class="fa-regular fa-clock mr-1"></i>${item.tanggal} • ${item.jam_mulai} - ${item.jam_selesai}
                        </p>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-3">
                        ${bisaMasuk ? `
                            <button onclick="kirimAbsen('MASUK', '${item.id_pertemuan}')" 
                                class="bg-white hover:bg-teal-50 text-teal-700 font-bold py-3 px-4 rounded-xl shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 pulse-active">
                                <i class="fa-solid fa-right-to-bracket text-lg"></i>
                                <span class="text-sm">ABSEN MASUK</span>
                            </button>
                        ` : `
                            <button disabled 
                                class="bg-white/10 text-white/50 font-bold py-3 px-4 rounded-xl cursor-not-allowed flex items-center justify-center gap-2">
                                <i class="fa-solid fa-lock text-lg"></i>
                                <span class="text-xs">MASUK</span>
                            </button>
                        `}
                        
                        ${bisaKeluar ? `
                            <button onclick="kirimAbsen('KELUAR', '${item.id_pertemuan}')" 
                                class="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2">
                                <i class="fa-solid fa-right-from-bracket text-lg"></i>
                                <span class="text-sm">ABSEN KELUAR</span>
                            </button>
                        ` : `
                            <button disabled 
                                class="bg-white/10 text-white/50 font-bold py-3 px-4 rounded-xl cursor-not-allowed flex items-center justify-center gap-2">
                                <i class="fa-solid fa-lock text-lg"></i>
                                <span class="text-xs">KELUAR</span>
                            </button>
                        `}
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
        
        panel.innerHTML = html;
        return;
    }
    
    // ==========================================
    // KASUS 2: TIDAK ADA YANG BISA ABSEN SEKARANG
    // ==========================================
    let message = 'Tidak ada jadwal kuliah hari ini.';
    let subMessage = 'Cek riwayat absensi di bawah atau tunggu jadwal berikutnya.';
    let icon = 'fa-mug-hot';
    let colorClass = 'from-slate-100 to-slate-200';
    let textClass = 'text-slate-600';
    let iconBg = 'bg-slate-200 text-slate-500';
    
    if (pertemuanHariIni.length > 0) {
        message = 'Tidak ada absen yang tersedia saat ini.';
        subMessage = 'Jadwal kuliah hari ini sudah lewat atau belum dibuka.';
        icon = 'fa-clock';
        colorClass = 'from-amber-50 to-orange-50';
        textClass = 'text-amber-700';
        iconBg = 'bg-amber-100 text-amber-600';
    }
    
    panel.innerHTML = `
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
            <div class="${iconBg} w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i class="fa-solid ${icon} text-2xl"></i>
            </div>
            <h3 class="text-lg font-bold text-slate-800 mb-2">${message}</h3>
            <p class="text-sm text-slate-500 mb-4">${subMessage}</p>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-2xl mx-auto mt-6 text-left">
                <div class="bg-blue-50 border border-blue-100 rounded-lg p-3">
                    <div class="flex items-center gap-2 mb-1">
                        <i class="fa-solid fa-right-to-bracket text-blue-600 text-sm"></i>
                        <span class="text-xs font-bold text-blue-700">Absen Masuk</span>
                    </div>
                    <p class="text-[10px] text-blue-600">15 menit setelah jam mulai</p>
                </div>
                <div class="bg-red-50 border border-red-100 rounded-lg p-3">
                    <div class="flex items-center gap-2 mb-1">
                        <i class="fa-solid fa-right-from-bracket text-red-600 text-sm"></i>
                        <span class="text-xs font-bold text-red-700">Absen Keluar</span>
                    </div>
                    <p class="text-[10px] text-red-600">15 menit setelah jam selesai</p>
                </div>
                <div class="bg-amber-50 border border-amber-100 rounded-lg p-3">
                    <div class="flex items-center gap-2 mb-1">
                        <i class="fa-solid fa-triangle-exclamation text-amber-600 text-sm"></i>
                        <span class="text-xs font-bold text-amber-700">Lewat Waktu</span>
                    </div>
                    <p class="text-[10px] text-amber-600">Tidak bisa absen (telat)</p>
                </div>
            </div>
        </div>
    `;
}

// ==========================================
// ✅ UPDATE STATISTIK KEHADIRAN
// ==========================================
function updateStatistik(data) {
    const total = data.length;
    let hadir = 0, terlambat = 0, alpha = 0;
    
    data.forEach(item => {
        if (item.status === 'Hadir') hadir++;
        else if (item.status === 'Terlambat') terlambat++;
        else if (item.status === 'Alpha') alpha++;
    });
    
    const persen = total > 0 ? Math.round((hadir / total) * 100) : 0;
    
    const elHadir = document.getElementById('statHadir');
    const elTerlambat = document.getElementById('statTerlambat');
    const elAlpha = document.getElementById('statAlpha');
    const elPersen = document.getElementById('statPersen');
    const elTotal = document.getElementById('totalRiwayat');
    
    if (elHadir) elHadir.innerText = hadir;
    if (elTerlambat) elTerlambat.innerText = terlambat;
    if (elAlpha) elAlpha.innerText = alpha;
    if (elPersen) elPersen.innerText = persen + '%';
    if (elTotal) elTotal.innerText = total;
}

// ==========================================
// RENDER TABEL RIWAYAT (HANYA HISTORY)
// ==========================================
function renderTabel(data) {
    const tbody = document.getElementById('tabelAbsensiBody');
    if (!tbody) return;
    
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
        
        // ✅ Absen Masuk (hanya tampil status)
        let kolomMasuk = '';
        if (item.waktu_masuk && item.waktu_masuk !== '-' && item.waktu_masuk !== '') {
            kolomMasuk = `
                <div class="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-1 rounded-lg text-[10px] font-bold">
                    <i class="fa-solid fa-check-circle"></i> ${item.waktu_masuk}
                </div>
            `;
        } else {
            kolomMasuk = `<span class="text-slate-400 text-[10px] italic">Belum absen</span>`;
        }
        
        // ✅ Absen Keluar (hanya tampil status)
        let kolomKeluar = '';
        if (item.waktu_keluar && item.waktu_keluar !== '-' && item.waktu_keluar !== '') {
            kolomKeluar = `
                <div class="inline-flex items-center gap-1 bg-red-50 text-red-600 border border-red-200 px-2 py-1 rounded-lg text-[10px] font-bold">
                    <i class="fa-solid fa-check-circle"></i> ${item.waktu_keluar}
                </div>
            `;
        } else {
            kolomKeluar = `<span class="text-slate-400 text-[10px] italic">Belum absen</span>`;
        }
        
        tbody.innerHTML += `
            <tr class="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                <td class="px-4 py-4">
                    <div class="font-bold text-slate-800 text-sm">${item.nama_pertemuan || '-'}</div>
                    <div class="text-[10px] text-slate-500 mt-0.5">${item.judul_materi || '-'}</div>
                </td>
                <td class="px-4 py-4">
                    <div class="font-semibold text-slate-700 text-sm">${item.tanggal || '-'}</div>
                </td>
                <td class="px-4 py-4">
                    <div class="text-xs text-slate-600">
                        <i class="fa-regular fa-clock text-slate-400 mr-1"></i>
                        ${item.jam_mulai || '-'} - ${item.jam_selesai || '-'}
                    </div>
                </td>
                <td class="px-4 py-4 text-center">${kolomMasuk}</td>
                <td class="px-4 py-4 text-center">${kolomKeluar}</td>
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
    
    // Update total di header tabel
    const elTotal = document.getElementById('totalRiwayat');
    if (elTotal) elTotal.innerText = filtered.length;
}

function resetFilter() {
    const filterTanggal = document.getElementById('filterTanggalAbsen');
    const filterStatus = document.getElementById('filterStatusAbsen');
    
    if (filterTanggal) filterTanggal.value = '';
    if (filterStatus) filterStatus.value = '';
    
    renderTabel(dataAbsensiGlobal);
    
    const elTotal = document.getElementById('totalRiwayat');
    if (elTotal) elTotal.innerText = dataAbsensiGlobal.length;
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
