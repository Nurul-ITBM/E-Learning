// ==========================================
// js/absensi.js
// Halaman Absensi Mahasiswa — Panel Absen + Riwayat
// Versi: 4.0 — Single Absen (tanpa masuk/keluar)
//
// ALUR:
//   1. Validasi sesi dari localStorage
//   2. Render jam realtime WITA
//   3. Load data absensi dari GAS API
//   4. Render: Panel Absen → Statistik → Tabel Riwayat
//   5. Auto-refresh tiap 30 detik
//
// DEPENDENSI GLOBAL (dari file lain):
//   - CONFIG.API_URL   → endpoint Google Apps Script
//   - currentUser      → objek sesi (id_mahasiswa / id_user)
// ==========================================

// ==========================================
// STATE GLOBAL
// ==========================================
let dataAbsensiGlobal = [];   // Cache data absensi dari server
let currentUser = null;       // Sesi user yang sedang login

// ==========================================
// KONFIGURASI
// ==========================================
const TOLERANSI_MENIT   = 30;      // Toleransi absen (menit) — sinkron dengan GAS
const AUTO_REFRESH_MS   = 30000;   // Interval auto-refresh panel (30 detik)
const MAX_RETRY_LOAD    = 2;       // Retry saat fetch gagal
const RETRY_DELAY_MS    = 2000;    // Jeda antar retry (2 detik)

// Mapping status → styling badge
const STATUS_BADGE_STYLE = {
    'Hadir':     'text-emerald-600 bg-emerald-50 border-emerald-200',
    'Terlambat': 'text-orange-600 bg-orange-50 border-orange-200',
    'Izin':      'text-amber-600 bg-amber-50 border-amber-200',
    'Sakit':     'text-amber-600 bg-amber-50 border-amber-200',
    'Alpha':     'text-red-600 bg-red-50 border-red-200',
    'Belum':     'text-slate-600 bg-slate-50 border-slate-200'
};

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

    try {
        currentUser = JSON.parse(sessionData);
    } catch (e) {
        console.error('Session tidak valid:', e);
        window.location.href = '../login.html';
        return;
    }

    console.log(">>> User session:", currentUser);

    // 2. Set Jam Sekarang (update tiap detik)
    updateJamSekarang();
    setInterval(updateJamSekarang, 1000);

    // 3. Tunggu DOM siap
    await new Promise(resolve => setTimeout(resolve, 100));

    // 4. Setup Filter
    const filterTanggal = document.getElementById('filterTanggalAbsen');
    const filterStatus  = document.getElementById('filterStatusAbsen');
    const btnReset      = document.getElementById('btnResetFilter');

    if (filterTanggal) filterTanggal.addEventListener('change', applyFilter);
    if (filterStatus)  filterStatus.addEventListener('change', applyFilter);
    if (btnReset)      btnReset.addEventListener('click', resetFilter);

    // 5. Load Data Absensi Pertama Kali
    await loadAbsensi(currentUser);

    // 6. Auto-refresh setiap 30 detik (update panel absen)
    setInterval(() => {
        console.log(">>> Auto-refresh absensi...");
        loadAbsensi(currentUser);
    }, AUTO_REFRESH_MS);
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
// HTML BUILDERS — Pecah HTML jadi potongan kecil
// Tujuan: render function tinggal rangkai
// ==========================================

/**
 * Badge status kehadiran (Hadir/Terlambat/Alpha/Izin/Sakit/Belum)
 */
function buildStatusBadge(status) {
    const label = status || 'Belum';
    const style = STATUS_BADGE_STYLE[label] || STATUS_BADGE_STYLE['Belum'];
    return `<span class="px-3 py-1 rounded-full text-[10px] font-bold border ${style}">${label}</span>`;
}

/**
 * Cell waktu absen (1 kolom saja)
 */
function buildWaktuAbsenCell(waktu) {
    const valid = waktu && waktu !== '-' && waktu !== '';
    if (!valid) {
        return `<span class="text-slate-400 text-[10px] italic">Belum absen</span>`;
    }
    return `
        <div class="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-1 rounded-lg text-[10px] font-bold">
            <i class="fa-solid fa-check-circle"></i> ${waktu}
        </div>
    `;
}

/**
 * Tombol absen (aktif / disabled-lock)
 */
function buildTombolAbsen(idPertemuan, enabled) {
    if (!enabled) {
        return `
            <button disabled
                class="w-full bg-white/10 text-white/50 font-bold py-3 px-4 rounded-xl cursor-not-allowed flex items-center justify-center gap-2">
                <i class="fa-solid fa-lock text-lg"></i>
                <span class="text-sm">BELUM BISA ABSEN</span>
            </button>
        `;
    }
    return `
        <button onclick="kirimAbsen('${idPertemuan}')"
            class="w-full bg-white hover:bg-teal-50 text-teal-700 font-bold py-3 px-4 rounded-xl shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 pulse-active">
            <i class="fa-solid fa-fingerprint text-lg"></i>
            <span class="text-sm">ABSEN SEKARANG</span>
        </button>
    `;
}

/**
 * Satu kartu pertemuan di dalam panel absen
 */
function buildKartuPertemuanAktif(item) {
    return `
        <div class="bg-white/15 backdrop-blur-sm rounded-xl p-4 mb-3 border border-white/20">

            <!-- --- Info Pertemuan --- -->
            <div class="mb-3">
                <p class="font-bold text-sm">${item.nama_pertemuan || '-'}</p>
                <p class="text-xs text-teal-100 mt-0.5">
                    <i class="fa-regular fa-clock mr-1"></i>${item.tanggal} • ${item.jam_mulai} - ${item.jam_selesai}
                </p>
            </div>

            <!-- --- Tombol Absen (full-width) --- -->
            ${buildTombolAbsen(item.id_pertemuan, item.bisa_absen)}
        </div>
    `;
}

/**
 * Kartu info skenario 3 (tidak ada absen tersedia) — 2 kartu
 */
function buildKartuInfoSkenario3() {
    return `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-xl mx-auto text-left">

            <!-- === Kartu 1: Waktu Absen === -->
            <div class="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <div class="flex items-center gap-2 mb-2">
                    <div class="bg-blue-100 text-blue-600 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">
                        <i class="fa-solid fa-fingerprint text-sm"></i>
                    </div>
                    <span class="text-xs font-bold text-blue-700">Waktu Absen</span>
                </div>
                <p class="text-[10px] text-blue-600 leading-relaxed">
                    Tersedia <strong>mulai jam kuliah</strong> hingga <strong>${TOLERANSI_MENIT} menit</strong> setelahnya.
                </p>
            </div>

            <!-- === Kartu 2: Lewat Waktu === -->
            <div class="bg-amber-50 border border-amber-100 rounded-xl p-4">
                <div class="flex items-center gap-2 mb-2">
                    <div class="bg-amber-100 text-amber-600 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">
                        <i class="fa-solid fa-triangle-exclamation text-sm"></i>
                    </div>
                    <span class="text-xs font-bold text-amber-700">Lewat Waktu</span>
                </div>
                <p class="text-[10px] text-amber-600 leading-relaxed">
                    Jika lewat dari <strong>${TOLERANSI_MENIT} menit</strong>, tidak bisa absen (status: Alpha).
                </p>
            </div>
        </div>
    `;
}

// ==========================================
// LOAD DATA ABSENSI (dengan retry otomatis)
//
// Parameter:
//   user       → objek sesi (butuh id_mahasiswa / id_user)
//   retryCount → counter internal (jangan diisi manual)
// ==========================================
async function loadAbsensi(user, retryCount = 0) {
    try {
        const res = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action: 'get_absensi',
                id_mahasiswa: user.id_mahasiswa || user.id_user
            })
        });

        if (!res.ok) throw new Error(`HTTP Error ${res.status}`);

        const result = await res.json();
        console.log(">>> Data absensi:", result);

        if (result.status === 'success') {
            dataAbsensiGlobal = result.data || [];

            renderPanelAbsenHariIni(dataAbsensiGlobal);  // Panel atas
            updateStatistik(dataAbsensiGlobal);          // Kartu statistik
            renderTabel(dataAbsensiGlobal);              // Tabel riwayat
        } else {
            showErrorState(result.message || 'Gagal memuat data.');
        }

    } catch (err) {
        console.error("Error load absensi:", err);

        // Retry logic
        if (retryCount < MAX_RETRY_LOAD) {
            console.log(`>>> Retry ${retryCount + 1}/${MAX_RETRY_LOAD}...`);
            await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
            return loadAbsensi(user, retryCount + 1);
        }

        showErrorState('Gagal terhubung ke server. Coba lagi nanti.');
    }
}

// ==========================================
// RENDER: ERROR STATE
// Ditampilkan saat fetch gagal (setelah retry habis)
// ==========================================
function showErrorState(message) {

    // Panel atas
    const panel = document.getElementById('panelAbsenHariIni');
    if (panel) {
        panel.innerHTML = `
            <div class="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
                <i class="fa-solid fa-circle-exclamation text-red-500 text-3xl mb-2"></i>
                <p class="text-red-600 font-bold mb-1">Gagal memuat data</p>
                <p class="text-red-500 text-xs mb-3">${message}</p>
                <button onclick="loadAbsensi(currentUser)"
                    class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition">
                    <i class="fa-solid fa-rotate mr-1"></i> Coba Lagi
                </button>
            </div>
        `;
    }

    // Tabel riwayat
    const tbody = document.getElementById('tabelAbsensiBody');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-10 text-red-400">
                    <i class="fa-solid fa-circle-exclamation text-3xl mb-2 block"></i>
                    ${message}
                </td>
            </tr>
        `;
    }
}

// ==========================================
// RENDER: PANEL ABSEN HARI INI
// Menentukan 1 dari 2 kondisi:
//   A. Ada pertemuan bisa diabsen → tampilkan tombol
//   B. Tidak ada → tampilkan info skenario 3
// ==========================================
function renderPanelAbsenHariIni(data) {
    const panel = document.getElementById('panelAbsenHariIni');
    if (!panel) return;

    // Filter: pertemuan yang tombolnya aktif
    const pertemuanAktif = data.filter(item => item.bisa_absen);

    // ------------------------------------------
    // KONDISI A: Ada absen tersedia
    // ------------------------------------------
    if (pertemuanAktif.length > 0) {
        const kartuList = pertemuanAktif.map(buildKartuPertemuanAktif).join('');

        panel.innerHTML = `
            <div class="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden">

                <!-- === Dekorasi Background === -->
                <div class="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                <div class="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>

                <!-- === Konten Utama === -->
                <div class="relative">

                    <!-- --- Badge Status --- -->
                    <div class="flex items-center gap-2 mb-4">
                        <span class="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                            <span class="w-2 h-2 bg-green-300 rounded-full animate-pulse"></span>
                            ABSEN TERSEDIA
                        </span>
                    </div>

                    <!-- --- Judul & Deskripsi --- -->
                    <h3 class="text-lg font-bold mb-1">🎯 Waktunya Absen!</h3>
                    <p class="text-sm text-teal-100 mb-4">
                        ${pertemuanAktif.length} pertemuan bisa diabsen sekarang.
                    </p>

                    <!-- --- Daftar Kartu Pertemuan --- -->
                    ${kartuList}
                </div>
            </div>
        `;
        return;
    }

    // ------------------------------------------
    // KONDISI B: Tidak ada absen (Skenario 3)
    // ------------------------------------------
    panel.innerHTML = `
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">

            <!-- === Ikon Utama === -->
            <div class="bg-amber-100 text-amber-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <i class="fa-solid fa-clock text-4xl"></i>
            </div>

            <!-- === Pesan Utama === -->
            <h3 class="text-xl font-bold text-slate-800 mb-2">
                Tidak Ada Absen yang Tersedia
            </h3>
            <p class="text-sm text-slate-500 mb-6 max-w-md mx-auto">
                Jadwal kuliah hari ini sudah <strong>lewat</strong> atau <strong>belum dibuka</strong>.
                Silakan cek kembali sesuai jadwal.
            </p>

            <!-- === Kartu Info === -->
            ${buildKartuInfoSkenario3()}

            <!-- === Footer Info === -->
            <div class="mt-6 pt-4 border-t border-slate-100">
                <p class="text-[10px] text-slate-400">
                    <i class="fa-solid fa-info-circle mr-1"></i>
                    Jika jadwal sudah dibuka tapi Anda tidak bisa absen, hubungi dosen pengampu.
                </p>
            </div>
        </div>
    `;
}

// ==========================================
// UPDATE STATISTIK KEHADIRAN
// ==========================================
function updateStatistik(data) {
    const total = data.length;
    let hadir = 0, terlambat = 0, alpha = 0;

    data.forEach(item => {
        if (item.status === 'Hadir') hadir++;
        else if (item.status === 'Terlambat') terlambat++;
        else if (item.status === 'Alpha') alpha++;
    });

    // Persentase kehadiran = (Hadir + Terlambat) / Total
    const totalHadirEfektif = hadir + terlambat;
    const persen = total > 0 ? Math.round((totalHadirEfektif / total) * 100) : 0;

    const elHadir     = document.getElementById('statHadir');
    const elTerlambat = document.getElementById('statTerlambat');
    const elAlpha     = document.getElementById('statAlpha');
    const elPersen    = document.getElementById('statPersen');
    const elTotal     = document.getElementById('totalRiwayat');

    if (elHadir)     elHadir.innerText = hadir;
    if (elTerlambat) elTerlambat.innerText = terlambat;
    if (elAlpha)     elAlpha.innerText = alpha;
    if (elPersen)    elPersen.innerText = persen + '%';
    if (elTotal)     elTotal.innerText = total;
}

// ==========================================
// RENDER: TABEL RIWAYAT
// Kolom: Pertemuan | Tanggal | Jam | Absen | Status
// ==========================================
function renderTabel(data) {
    const tbody = document.getElementById('tabelAbsensiBody');
    if (!tbody) return;

    // Empty state
    if (data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-10 text-slate-400 italic">
                    <i class="fa-regular fa-folder-open text-3xl mb-2 block"></i>
                    Belum ada data absensi.
                </td>
            </tr>
        `;
        return;
    }

    // Build setiap baris
    tbody.innerHTML = data.map(item => `
        <tr class="border-b border-slate-50 hover:bg-slate-50 transition-colors">

            <!-- --- Kolom: Pertemuan --- -->
            <td class="px-4 py-4">
                <div class="font-bold text-slate-800 text-sm">${item.nama_pertemuan || '-'}</div>
                <div class="text-[10px] text-slate-500 mt-0.5">${item.judul_materi || '-'}</div>
            </td>

            <!-- --- Kolom: Tanggal --- -->
            <td class="px-4 py-4">
                <div class="font-semibold text-slate-700 text-sm">${item.tanggal || '-'}</div>
            </td>

            <!-- --- Kolom: Jam Kuliah --- -->
            <td class="px-4 py-4">
                <div class="text-xs text-slate-600">
                    <i class="fa-regular fa-clock text-slate-400 mr-1"></i>
                    ${item.jam_mulai || '-'} - ${item.jam_selesai || '-'}
                </div>
            </td>

            <!-- --- Kolom: Waktu Absen --- -->
            <td class="px-4 py-4 text-center">
                ${buildWaktuAbsenCell(item.waktu_absen)}
            </td>

            <!-- --- Kolom: Status --- -->
            <td class="px-4 py-4 text-center">
                ${buildStatusBadge(item.status)}
            </td>

        </tr>
    `).join('');
}

// ==========================================
// FILTER DATA
// ==========================================
function applyFilter() {
    const tanggal = document.getElementById('filterTanggalAbsen')?.value || '';
    const status  = document.getElementById('filterStatusAbsen')?.value || '';

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
                return !item.waktu_absen || item.waktu_absen === '-';
            }
            return item.status === status;
        });
    }

    renderTabel(filtered);

    // Update total di header tabel
    const elTotal = document.getElementById('totalRiwayat');
    if (elTotal) elTotal.innerText = filtered.length;
}

// ==========================================
// RESET FILTER
// ==========================================
function resetFilter() {
    const filterTanggal = document.getElementById('filterTanggalAbsen');
    const filterStatus  = document.getElementById('filterStatusAbsen');

    if (filterTanggal) filterTanggal.value = '';
    if (filterStatus)  filterStatus.value = '';

    renderTabel(dataAbsensiGlobal);

    const elTotal = document.getElementById('totalRiwayat');
    if (elTotal) elTotal.innerText = dataAbsensiGlobal.length;
}

// ==========================================
// KIRIM ABSEN (1× saja — tanpa masuk/keluar)
// ==========================================
async function kirimAbsen(id_pertemuan) {
    if (!currentUser) {
        alert('Sesi tidak valid. Silakan login ulang.');
        return;
    }

    if (!confirm('Apakah Anda yakin ingin melakukan absen sekarang?')) return;

    // Loading state
    const btn = event.target.closest('button');
    const originalHtml = btn ? btn.innerHTML : '';
    if (btn) {
        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin text-lg"></i>';
        btn.disabled = true;
    }

    try {
        const res = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action: 'proses_absen',
                id_mahasiswa: currentUser.id_mahasiswa || currentUser.id_user,
                id_pertemuan: id_pertemuan
            })
        });

        const result = await res.json();
        console.log(">>> Response absen:", result);
        alert(result.message);

        if (result.status === 'success') {
            // Reload data absensi
            await loadAbsensi(currentUser);
        } else {
            // Kembalikan tombol
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
