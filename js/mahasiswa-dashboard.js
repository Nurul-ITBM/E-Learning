// ==========================================
// js/mahasiswa-dashboard.js - Logika Dashboard Mahasiswa
// ✅ Fix: Update 3 kartu info bawah (Kehadiran, Tugas, Ujian)
// ==========================================

// ==========================================
// VARIABEL GLOBAL
// ==========================================
let currentUser = null;
let dashboardData = null;

// ==========================================
// KONFIGURASI WARNA GRADE
// ==========================================
const GRADE_CONFIG = {
    'A': 'bg-emerald-50 text-emerald-600 border-emerald-200',
    'B': 'bg-blue-50 text-blue-600 border-blue-200',
    'C': 'bg-amber-50 text-amber-600 border-amber-200',
    'D': 'bg-orange-50 text-orange-600 border-orange-200',
    'E': 'bg-red-50 text-red-600 border-red-200',
    '-': 'bg-slate-100 text-slate-500 border-slate-200'
};

// ==========================================
// INISIALISASI
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    const sessionData = localStorage.getItem('user_session');
    if (!sessionData) {
        window.location.href = '../login.html';
        return;
    }
    
    currentUser = JSON.parse(sessionData);
    console.log(">>> User session:", currentUser);

    if (currentUser.role !== 'mahasiswa') {
        alert('Akses ditolak. Anda bukan mahasiswa.');
        window.location.href = '../login.html';
        return;
    }

    await new Promise(resolve => setTimeout(resolve, 100));

    await loadDashboard(currentUser.id_user || currentUser.id_mahasiswa);
});

// ==========================================
// LOAD DASHBOARD
// ==========================================
async function loadDashboard(id_user) {
    try {
        console.log(">>> Loading dashboard untuk:", id_user);
        
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ 
                action: 'get_dashboard_mahasiswa', 
                id_user: id_user 
            })
        });
        const result = await response.json();
        console.log(">>> Dashboard data:", result);

        if (result.status === 'success' && result.data) {
            dashboardData = result.data;
            
            // Render semua section
            renderWelcome(result.data.mahasiswa);
            renderStatCards(result.data.statistik);
            renderStatCardsBawah(result.data.statistik);   // ✅ TAMBAHAN
            renderJadwalHariIni(result.data.jadwal_hari_ini, result.data.hari_ini);
            renderTugasMendatang(result.data.tugas_mendatang);
            renderUjianTersedia(result.data.ujian_tersedia);
            renderNilaiTerkini(result.data.nilai_terkini);
            
        } else {
            showError(result.message || 'Gagal memuat data dashboard.');
        }
    } catch (error) {
        console.error("Error load dashboard:", error);
        showError('Gagal terhubung ke server.');
    }
}

// ==========================================
// SHOW ERROR
// ==========================================
function showError(message) {
    const container = document.querySelector('main .p-8');
    if (container) {
        container.innerHTML = `
            <div class="text-center py-16 text-red-400">
                <i class="fa-solid fa-circle-exclamation text-5xl mb-4 block"></i>
                <p class="text-sm font-medium">${message}</p>
                <button onclick="loadDashboard(currentUser.id_user || currentUser.id_mahasiswa)" 
                    class="mt-4 bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-600">
                    <i class="fa-solid fa-rotate mr-1"></i> Coba Lagi
                </button>
            </div>
        `;
    }
}

// ==========================================
// RENDER WELCOME (HERO BANNER)
// ==========================================
function renderWelcome(mhs) {
    const nameDisplay = document.getElementById('bannerNameDisplay');
    if (nameDisplay) {
        nameDisplay.innerText = mhs.nama || 'Mahasiswa';
    }
    
    const headerName = document.getElementById('mahasiswaNameDisplay');
    if (headerName) {
        headerName.innerText = mhs.nama || 'Mahasiswa';
    }
    
    const prodiDisplay = document.getElementById('mahasiswaProdiDisplay');
    if (prodiDisplay) {
        prodiDisplay.innerText = mhs.program_studi || 'Mahasiswa';
    }
}

// ==========================================
// RENDER STAT CARDS (5 KARTU ATAS)
// ==========================================
function renderStatCards(stat) {
    const container = document.getElementById('statCards');
    if (!container) return;
    
    container.innerHTML = `
        <!-- Mata Kuliah -->
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4 hover:shadow-md transition">
            <div class="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center flex-shrink-0">
                <i class="fa-solid fa-book-open text-xl"></i>
            </div>
            <div>
                <h3 class="text-2xl font-bold text-slate-800 leading-none">${stat.total_matakuliah || 0}</h3>
                <p class="text-xs text-slate-500 mt-1.5 font-medium">Mata Kuliah</p>
            </div>
        </div>
        
        <!-- Tugas Aktif -->
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4 hover:shadow-md transition">
            <div class="w-12 h-12 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center flex-shrink-0">
                <i class="fa-solid fa-file-pen text-xl"></i>
            </div>
            <div>
                <h3 class="text-2xl font-bold text-slate-800 leading-none">${stat.tugas_belum_kumpul || 0}</h3>
                <p class="text-xs text-slate-500 mt-1.5 font-medium">Tugas Aktif</p>
            </div>
        </div>
        
        <!-- Ujian Aktif -->
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4 hover:shadow-md transition">
            <div class="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center flex-shrink-0">
                <i class="fa-regular fa-file-lines text-xl"></i>
            </div>
            <div>
                <h3 class="text-2xl font-bold text-slate-800 leading-none">${stat.ujian_aktif || 0}</h3>
                <p class="text-xs text-slate-500 mt-1.5 font-medium">Ujian Aktif</p>
            </div>
        </div>
        
        <!-- Kehadiran -->
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4 hover:shadow-md transition">
            <div class="w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center flex-shrink-0">
                <i class="fa-solid fa-user-check text-xl"></i>
            </div>
            <div>
                <h3 class="text-2xl font-bold text-slate-800 leading-none">${stat.persen_kehadiran || 0}%</h3>
                <p class="text-xs text-slate-500 mt-1.5 font-medium">Kehadiran</p>
            </div>
        </div>
        
        <!-- IPK -->
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4 hover:shadow-md transition">
            <div class="w-12 h-12 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center flex-shrink-0">
                <i class="fa-solid fa-award text-xl"></i>
            </div>
            <div>
                <h3 class="text-2xl font-bold text-slate-800 leading-none">${stat.ipk || '0.00'}</h3>
                <p class="text-xs text-slate-500 mt-1.5 font-medium">IPK</p>
            </div>
        </div>
    `;
}

// ==========================================
// ✅ RENDER STAT CARDS BAWAH (3 KARTU INFO)
// ==========================================
function renderStatCardsBawah(stat) {
    // Kehadiran Bawah
    const elKehadiran = document.getElementById('statKehadiranBawah');
    if (elKehadiran) {
        elKehadiran.innerText = stat.persen_kehadiran || 0;
    }
    
    // Total Tugas Bawah
    const elTugas = document.getElementById('statTotalTugasBawah');
    if (elTugas) {
        elTugas.innerText = stat.total_tugas || 0;
    }
    
    // Total Ujian Bawah
    const elUjian = document.getElementById('statTotalUjianBawah');
    if (elUjian) {
        elUjian.innerText = stat.total_ujian || 0;
    }
    
    console.log('✅ Stat cards bawah updated:', {
        kehadiran: stat.persen_kehadiran,
        tugas: stat.total_tugas,
        ujian: stat.total_ujian
    });
}

// ==========================================
// RENDER JADWAL HARI INI
// ==========================================
function renderJadwalHariIni(jadwal, hariIni) {
    const container = document.getElementById('jadwalHariIni');
    if (!container) return;
    
    if (!jadwal || jadwal.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-slate-400">
                <i class="fa-regular fa-calendar-check text-4xl mb-2 block opacity-30"></i>
                <p class="text-sm">Tidak ada jadwal kuliah hari ${hariIni}.</p>
                <p class="text-xs text-slate-400 mt-1">Nikmati waktu luang Anda! 🎉</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    jadwal.forEach(item => {
        html += `
            <div class="bg-slate-50 border border-slate-100 rounded-lg p-3 hover:bg-indigo-50/30 transition">
                <div class="flex justify-between items-start mb-2">
                    <div class="flex-1">
                        <p class="font-bold text-slate-800 text-sm">${item.nama_matkul || '-'}</p>
                        <p class="text-xs text-slate-500 mt-0.5">${item.kode_mk || '-'} • ${item.nama_kelas || '-'}</p>
                    </div>
                    <span class="bg-indigo-50 text-indigo-600 border border-indigo-100 text-[10px] font-bold px-2 py-0.5 rounded-md">
                        ${item.jam_mulai} - ${item.jam_selesai}
                    </span>
                </div>
                <div class="flex items-center text-xs text-slate-500">
                    <i class="fa-regular fa-user mr-1.5"></i>
                    ${item.nama_dosen || '-'}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    const titleHariIni = document.getElementById('titleHariIni');
    if (titleHariIni) {
        titleHariIni.innerText = `Jadwal Kuliah Hari ${hariIni}`;
    }
}

// ==========================================
// RENDER TUGAS MENDATANG (FIXED)
// ==========================================
function renderTugasMendatang(tugas) {
    const container = document.getElementById('tugasMendatang');
    if (!container) return;

    if (!tugas || tugas.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-slate-400">
                <i class="fa-regular fa-circle-check text-4xl mb-2 block opacity-30"></i>
                <p class="text-sm">Tidak ada tugas mendatang.</p>
                <p class="text-xs text-slate-400 mt-1">Semua tugas sudah dikumpulkan! ✅</p>
            </div>
        `;
        return;
    }

    let html = '';
    tugas.forEach(item => {
        // ✅ Pakai tenggat_waktu_fmt (string dari backend)
        const rawDeadline = item.tenggat_waktu_fmt || item.tenggat_waktu || '';
        const deadline = parseTanggalIndonesia(rawDeadline);

        let deadlineBadge = '';
        let deadlineText = '-';

        if (deadline) {
            const sekarang = new Date();
            const diffMs = deadline - sekarang;
            const diffHari = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

            if (diffHari < 0) {
                deadlineBadge = `<span class="bg-red-50 text-red-600 border border-red-100 text-[10px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap"><i class="fa-solid fa-triangle-exclamation mr-0.5"></i> TERLAMBAT</span>`;
            } else if (diffHari === 0) {
                deadlineBadge = `<span class="bg-amber-50 text-amber-600 border border-amber-100 text-[10px] font-bold px-2 py-0.5 rounded-md animate-pulse whitespace-nowrap"><i class="fa-solid fa-bell mr-0.5"></i> HARI INI</span>`;
            } else if (diffHari <= 3) {
                deadlineBadge = `<span class="bg-amber-50 text-amber-600 border border-amber-100 text-[10px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap"><i class="fa-regular fa-clock mr-0.5"></i> ${diffHari} hari lagi</span>`;
            } else {
                deadlineBadge = `<span class="bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap">${diffHari} hari lagi</span>`;
            }

            // Format tampilan ringkas: 19 Agu, 13:36
            const opt = {
                day: 'numeric', month: 'short',
                hour: '2-digit', minute: '2-digit',
                timeZone: 'Asia/Makassar', hour12: false
            };
            deadlineText = deadline.toLocaleString('id-ID', opt).replace('.', ':');
        }

        html += `
            <div class="bg-slate-50 border border-slate-100 rounded-lg p-3 hover:bg-purple-50/30 transition">
                <div class="flex justify-between items-start mb-2 gap-2">
                    <div class="flex-1 min-w-0">
                        <p class="font-bold text-slate-800 text-sm truncate">${item.judul_tugas || '-'}</p>
                        <p class="text-xs text-slate-500 mt-0.5">${item.nama_matkul || '-'}</p>
                    </div>
                    ${deadlineBadge}
                </div>
                <div class="flex items-center justify-between text-xs">
                    <span class="text-slate-500">
                        <i class="fa-regular fa-clock mr-1"></i>
                        ${deadlineText}
                    </span>
                    <a href="tugas.html" class="text-purple-600 font-bold hover:underline">
                        Kerjakan <i class="fa-solid fa-arrow-right ml-0.5"></i>
                    </a>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// ==========================================
// RENDER UJIAN TERSEDIA
// ==========================================
function renderUjianTersedia(ujian) {
    const container = document.getElementById('ujianTersedia');
    if (!container) return;
    
    if (!ujian || ujian.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-slate-400">
                <i class="fa-regular fa-file-lines text-4xl mb-2 block opacity-30"></i>
                <p class="text-sm">Tidak ada ujian yang tersedia.</p>
                <p class="text-xs text-slate-400 mt-1">Belum ada ujian yang dibuka. 📄</p>
            </div>
        `;
        return;
    }
    
    const jenisColors = {
        'UTS': 'bg-blue-50 text-blue-600 border-blue-100',
        'UAS': 'bg-purple-50 text-purple-600 border-purple-100',
        'Quiz': 'bg-amber-50 text-amber-600 border-amber-100',
        'Tugas Besar': 'bg-rose-50 text-rose-600 border-rose-100'
    };
    
    let html = '';
    ujian.forEach(item => {
        const jenisClass = jenisColors[item.jenis_ujian] || jenisColors['UTS'];
        
        html += `
            <div class="bg-slate-50 border border-slate-100 rounded-lg p-3 hover:bg-rose-50/30 transition">
                <div class="flex justify-between items-start mb-2 gap-2">
                    <div class="flex-1 min-w-0">
                        <p class="font-bold text-slate-800 text-sm truncate">${item.judul || '-'}</p>
                        <p class="text-xs text-slate-500 mt-0.5">${item.nama_matkul || '-'}</p>
                    </div>
                    <span class="${jenisClass} text-[10px] font-bold px-2 py-0.5 rounded-md border">${item.jenis_ujian || 'UTS'}</span>
                </div>
                <div class="flex items-center justify-between text-xs">
                    <span class="text-slate-500">
                        <i class="fa-regular fa-clock mr-1"></i>
                        ${item.durasi_menit || 60} menit
                    </span>
                    <a href="ujian.html" class="text-rose-600 font-bold hover:underline">
                        Mulai <i class="fa-solid fa-arrow-right ml-0.5"></i>
                    </a>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// ==========================================
// RENDER NILAI TERKINI
// ==========================================
function renderNilaiTerkini(nilai) {
    const container = document.getElementById('nilaiTerkini');
    if (!container) return;
    
    if (!nilai || nilai.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-slate-400">
                <i class="fa-solid fa-chart-simple text-4xl mb-2 block opacity-30"></i>
                <p class="text-sm">Belum ada nilai.</p>
                <p class="text-xs text-slate-400 mt-1">Nilai akan muncul setelah dosen menilai. 📊</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    nilai.forEach(item => {
        const gradeClass = GRADE_CONFIG[item.grade] || GRADE_CONFIG['-'];
        
        html += `
            <div class="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg hover:bg-emerald-50/30 transition">
                <div class="flex-1 min-w-0">
                    <p class="font-bold text-slate-800 text-sm truncate">${item.nama_matkul || '-'}</p>
                    <p class="text-xs text-slate-500 mt-0.5">${item.kode_mk || '-'} • ${item.sks || 0} SKS</p>
                </div>
                <div class="flex items-center gap-2 ml-2">
                    <span class="text-sm font-bold text-slate-700">${item.nilai_akhir || 0}</span>
                    <span class="px-2.5 py-1 rounded-lg text-xs font-bold border ${gradeClass}">${item.grade || '-'}</span>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// ==========================================
// HELPER: PARSE TANGGAL INDONESIA (DD/MM/YYYY HH:mm)
// ==========================================
function parseTanggalIndonesia(str) {
    if (!str) return null;
    try {
        const s = String(str).trim();

        // ISO: 2026-08-19T13:36
        if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
            const d = new Date(s.replace(' ', 'T'));
            return isNaN(d.getTime()) ? null : d;
        }

        // DD/MM/YYYY HH:mm
        const parts = s.split(/[\sT]+/);
        const tgl = (parts[0] || '').split('/');
        const jam = (parts[1] || '00:00').split(':');
        if (tgl.length !== 3) return null;

        const day   = parseInt(tgl[0], 10);
        const month = parseInt(tgl[1], 10) - 1;
        const year  = parseInt(tgl[2], 10);
        const hour  = parseInt(jam[0] || '0', 10);
        const min   = parseInt(jam[1] || '0', 10);

        if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
        const d = new Date(year, month, day, hour, min);
        return isNaN(d.getTime()) ? null : d;
    } catch (e) {
        return null;
    }
}

// ==========================================
// HELPER: FORMAT TANGGAL SINGKAT
// ==========================================
function formatTanggalShort(tanggalISO) {
    if (!tanggalISO) return '-';
    
    try {
        const date = new Date(String(tanggalISO).replace(' ', 'T') + '+08:00');
        if (isNaN(date.getTime())) return String(tanggalISO);
        
        const options = {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Makassar',
            hour12: false
        };
        
        return date.toLocaleString('id-ID', options);
    } catch (e) {
        return String(tanggalISO);
    }
}
