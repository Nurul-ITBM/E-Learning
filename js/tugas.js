// ==========================================
// js/tugas.js - Halaman Tugas Mahasiswa
// Version: 3.1 - Fix Deadline + Optimized Loading
// ✅ Parse tanggal Indonesia
// ✅ Frontend cache 60s
// ✅ DocumentFragment render
// ✅ Timeout 90s untuk upload
// ==========================================

// ==========================================
// STATE GLOBAL
// ==========================================
let allTugasData = [];
let currentFilter = 'Semua'; // 'Semua' | 'Tugas' | 'Praktikum'
let currentMatkulFilter = '';

// ==========================================
// HELPER: PARSE TANGGAL FORMAT INDONESIA
// Input : "19/08/2026 13:36" atau "2026-08-19 13:36"
// Output: Date object atau null
// ==========================================
function parseTanggalIndonesia(str) {
    if (!str) return null;

    try {
        const s = String(str).trim();

        // ISO: 2026-08-19T13:36 atau 2026-08-19 13:36
        if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
            const d = new Date(s.replace(' ', 'T'));
            return isNaN(d.getTime()) ? null : d;
        }

        // Format Indonesia: DD/MM/YYYY HH:mm
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
        console.warn('parseTanggalIndonesia error:', str, e.message);
        return null;
    }
}

// ==========================================
// HELPER: FETCH DENGAN CACHE (dari config.js)
// Fallback ke fetchJSON kalau fetchCached tidak ada
// ==========================================
async function callAPI(action, data, options) {
    options = options || {};
    const label = options.logLabel || action;

    // Pakai fetchCached dari config.js kalau tersedia
    if (typeof fetchCached === 'function' && !options.skipCache) {
        try {
            return await fetchCached(action, data, {
                ttl: options.ttl || 60000,
                forceRefresh: options.forceRefresh || false
            });
        } catch (e) {
            console.warn('[' + label + '] fetchCached gagal, fallback ke fetchJSON:', e.message);
        }
    }

    // Fallback: fetchJSON dari config.js
    if (typeof fetchJSON === 'function') {
        return await fetchJSON(action, data, options);
    }

    // Last resort: fetch manual
    const response = await fetch(CONFIG.API_URL, {
        method: 'POST',
        mode: 'cors',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(Object.assign({ action: action }, data || {}))
    });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const text = await response.text();
    return JSON.parse(text);
}

function invalidateAPI(prefix) {
    if (typeof invalidateCache === 'function') {
        invalidateCache(prefix);
    }
}

// ==========================================
// INIT — DOMContentLoaded
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Set judul
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) pageTitle.innerText = 'Tugas & Praktikum';

    // 2. Ambil session
    const sessionData = localStorage.getItem('user') || localStorage.getItem('user_session');
    if (!sessionData) {
        window.location.href = '../login.html';
        return;
    }

    let user;
    try {
        user = JSON.parse(sessionData);
    } catch (e) {
        console.error('Session tidak valid:', e);
        window.location.href = '../login.html';
        return;
    }

    // 3. Event logout
    document.addEventListener('click', function (e) {
        const logoutBtn = e.target.closest('#btnLogout');
        if (logoutBtn) {
            localStorage.removeItem('user');
            localStorage.removeItem('user_session');
            window.location.href = '../login.html';
        }
    });

    // 4. Setup filter
    setupFilterTab();
    setupMatkulFilter();

    // 5. Load data tugas
    const identifier = user.id_user || user.id_mahasiswa;

    if (identifier) {
        await loadTugas(identifier);
    } else {
        const c = document.getElementById('containerTugas');
        if (c) c.innerHTML = '<p class="text-red-500 col-span-full text-center py-10">Error: Data user tidak lengkap.</p>';
    }
});

// ==========================================
// SETUP FILTER TAB
// ==========================================
function setupFilterTab() {
    const filterButtons = document.querySelectorAll('[data-filter]');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function () {
            currentFilter = this.dataset.filter;

            filterButtons.forEach(b => {
                b.classList.remove('bg-indigo-500', 'text-white');
                b.classList.add('bg-white', 'text-slate-600', 'border', 'border-slate-200');
            });
            this.classList.add('bg-indigo-500', 'text-white');
            this.classList.remove('bg-white', 'text-slate-600', 'border', 'border-slate-200');

            renderTugas();
        });
    });
}

// ==========================================
// SETUP FILTER MATA KULIAH
// ==========================================
function setupMatkulFilter() {
    const dropdown = document.getElementById('filterMatkul');
    if (dropdown) {
        dropdown.addEventListener('change', function () {
            currentMatkulFilter = this.value;
            renderTugas();
        });
    }
}

// ==========================================
// LOAD TUGAS (dengan cache + skeleton)
// ==========================================
async function loadTugas(identifier) {
    const container = document.getElementById('containerTugas');
    if (!container) return;

    // Skeleton 6 kartu
    container.innerHTML = Array(6).fill(`
        <div class="bg-white p-6 rounded-2xl border border-slate-100 animate-pulse">
            <div class="flex justify-between mb-3">
                <div class="h-5 bg-slate-200 rounded w-20"></div>
                <div class="h-4 bg-slate-200 rounded w-12"></div>
            </div>
            <div class="h-3 bg-slate-200 rounded w-24 mb-3"></div>
            <div class="h-5 bg-slate-200 rounded w-3/4 mb-2"></div>
            <div class="h-3 bg-slate-200 rounded w-full mb-1"></div>
            <div class="h-3 bg-slate-200 rounded w-2/3 mb-4"></div>
            <div class="h-10 bg-slate-200 rounded w-full"></div>
        </div>
    `).join('');

    const t0 = Date.now();
    try {
        console.log('📤 Load tugas untuk:', identifier);

        const result = await callAPI('get_tugas',
            { id_user: identifier },
            { logLabel: 'get_tugas', ttl: 60000, timeout: 30000 }
        );

        console.log('📥 Response (' + (Date.now() - t0) + 'ms):', result.status);

        if (result.status === 'success') {
            allTugasData = result.data || [];
            updateStatistik(allTugasData);
            renderTugas();
        } else {
            container.innerHTML = `
                <div class="col-span-full bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                    <i class="fa-solid fa-circle-exclamation text-red-500 text-3xl mb-2"></i>
                    <p class="text-red-600 font-medium">Error: ${result.message}</p>
                </div>
            `;
        }
    } catch (error) {
        console.error("Error loading tugas:", error);
        container.innerHTML = `
            <div class="col-span-full bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                <i class="fa-solid fa-circle-xmark text-red-500 text-3xl mb-2"></i>
                <p class="text-red-600 font-medium">❌ Gagal terhubung ke server.</p>
                <p class="text-red-400 text-sm mt-1">${error.message}</p>
                <button onclick="loadTugas('${identifier}')" class="mt-3 bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600 transition-colors">
                    <i class="fa-solid fa-rotate mr-1"></i> Coba Lagi
                </button>
            </div>
        `;
    }
}

// ==========================================
// RENDER TUGAS (dengan filter + DocumentFragment)
// ==========================================
function renderTugas() {
    const container = document.getElementById('containerTugas');
    if (!container) return;

    // Filter by jenis
    let filteredData = allTugasData;
    if (currentFilter === 'Tugas') {
        filteredData = filteredData.filter(t => (t.jenis_tugas || 'Tugas').toLowerCase() === 'tugas');
    } else if (currentFilter === 'Praktikum') {
        filteredData = filteredData.filter(t => (t.jenis_tugas || 'Tugas').toLowerCase() === 'praktikum');
    }

    // Filter by mata kuliah
    if (currentMatkulFilter) {
        filteredData = filteredData.filter(t => t.mata_kuliah === currentMatkulFilter);
    }

    // Clear container
    container.innerHTML = '';

    // Empty state
    if (filteredData.length === 0) {
        const msg = currentFilter === 'Semua' && !currentMatkulFilter
            ? 'Belum ada tugas untuk mata kuliah Anda.'
            : `Belum ada ${currentFilter.toLowerCase()}${currentMatkulFilter ? ' untuk ' + currentMatkulFilter : ''}.`;
        container.innerHTML = `
            <div class="col-span-full text-center py-10">
                <i class="fa-solid fa-inbox text-slate-300 text-5xl mb-3"></i>
                <p class="text-slate-500">${msg}</p>
            </div>
        `;
        return;
    }

    // ✅ DocumentFragment — 1 render pass, lebih cepat dari appendChild loop
    const fragment = document.createDocumentFragment();
    const now = new Date();

    filteredData.forEach(t => {
        // ---- Tentukan jenis tugas ----
        const isPraktikum = (t.jenis_tugas || 'Tugas').toLowerCase() === 'praktikum';

        // ---- Cek deadline (PAKAI PARSER YANG BENAR) ----
        let isDeadlineLewat = false;
        let deadlineDate = null;

        if (t.tenggat_waktu) {
            deadlineDate = parseTanggalIndonesia(t.tenggat_waktu);
            if (deadlineDate) {
                isDeadlineLewat = now > deadlineDate;
            } else {
                console.warn('⚠️ Deadline tidak bisa di-parse:', t.id_tugas, t.tenggat_waktu);
            }
        }

        // ---- Warna & ikon badge ----
        const badgeColor = isPraktikum
            ? 'bg-purple-100 text-purple-700 border-purple-200'
            : 'bg-indigo-50 text-indigo-600 border-indigo-100';
        const badgeIcon = isPraktikum ? 'fa-flask-vial' : 'fa-file-pen';
        const badgeText = isPraktikum ? 'Praktikum' : 'Tugas';
        const hoverBorder = isPraktikum ? 'hover:border-purple-300' : 'hover:border-indigo-300';
        const btnColor = isPraktikum
            ? 'bg-purple-500 hover:bg-purple-600'
            : 'bg-indigo-500 hover:bg-indigo-600';

        // ---- Card element ----
        const card = document.createElement('div');
        card.className = `bg-white p-6 rounded-2xl shadow-sm border border-slate-100 ${hoverBorder} hover:shadow-md transition-all flex flex-col justify-between ${isDeadlineLewat && !t.sudah_kumpul ? 'opacity-90' : ''}`;

        // ---- Action HTML ----
        let actionHTML = '';
        if (t.sudah_kumpul) {
            const nilaiHTML = t.nilai ? `<br><span class="font-bold text-slate-800">Nilai: ${t.nilai}</span>` : '';
            const komentarHTML = t.komentar_dosen ? `<br><span class="text-slate-500 text-[10px] italic">"${t.komentar_dosen}"</span>` : '';

            actionHTML = `
                <div class="text-center text-xs text-green-600 bg-green-50 p-3 rounded-lg border border-green-100">
                    <i class="fa-solid fa-circle-check mr-1"></i> <span class="font-semibold">Sudah Dikumpulkan</span>
                    ${nilaiHTML}
                    ${komentarHTML}
                </div>
            `;
        } else if (isDeadlineLewat) {
            // ✅ Terkunci — tampilkan badge merah, tanpa tombol upload
            actionHTML = `
                <div class="text-center text-xs text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                    <i class="fa-solid fa-lock mr-1"></i>
                    <span class="font-semibold">Terkunci</span>
                    <br>
                    <span class="text-[10px] text-red-500">Deadline telah berakhir</span>
                </div>
            `;
        } else {
            actionHTML = `
                <button onclick="bukaModalUploadTugas('${t.id_tugas}', '${String(t.judul_tugas || '').replace(/'/g, "\\'")}')" class="w-full ${btnColor} text-white py-2 rounded-lg text-sm font-bold transition-colors">
                    <i class="fa-solid fa-cloud-arrow-up mr-2"></i> Upload ${isPraktikum ? 'Laporan' : 'Tugas'}
                </button>
            `;
        }

        // ---- Deadline HTML ----
        let deadlineHTML = '';
        if (t.tenggat_waktu) {
            const label = isDeadlineLewat ? 'Lewat: ' : 'Deadline: ';
            const color = isDeadlineLewat ? 'text-red-500 font-semibold' : 'text-slate-500';
            deadlineHTML = `
                <span class="${color}">
                    <i class="fa-regular fa-clock mr-1"></i>
                    ${label}${t.tenggat_waktu}
                </span>
            `;
        } else {
            deadlineHTML = `<span class="text-slate-500"><i class="fa-regular fa-clock mr-1"></i> Tidak ditentukan</span>`;
        }

        // ---- Isi card ----
        card.innerHTML = `
            <div>
                <div class="flex justify-between items-start mb-3 gap-2">
                    <div class="flex items-center gap-1 flex-wrap">
                        <span class="${badgeColor} text-xs font-bold px-2.5 py-1 rounded-md border flex items-center gap-1 flex-shrink-0">
                            <i class="fa-solid ${badgeIcon}"></i> ${badgeText}
                        </span>
                        ${isDeadlineLewat && !t.sudah_kumpul ? `
                            <span class="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-md border border-red-200 flex items-center gap-1">
                                <i class="fa-solid fa-lock"></i> Terkunci
                            </span>
                        ` : ''}
                    </div>
                    <span class="text-xs font-semibold text-slate-400 flex-shrink-0">Bobot: ${t.bobot_nilai}</span>
                </div>
                <div class="mb-2">
                    <p class="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">${t.mata_kuliah || '-'}</p>
                </div>
                <h3 class="text-lg font-bold text-slate-800 leading-tight mb-2">${t.judul_tugas || '-'}</h3>
                <p class="text-sm text-slate-500 line-clamp-2 mb-3">${t.deskripsi_instruksi || 'Tidak ada deskripsi.'}</p>
                <div class="text-xs flex items-center mb-2">
                    ${deadlineHTML}
                </div>
                ${t.link_lampiran ? `<div class="text-xs mb-2"><a href="${t.link_lampiran}" target="_blank" class="text-indigo-600 hover:underline"><i class="fa-solid fa-paperclip mr-1"></i>Lihat Lampiran</a></div>` : ''}
            </div>
            <div class="mt-4 pt-4 border-t border-slate-100">
                ${actionHTML}
            </div>
        `;

        fragment.appendChild(card);
    });

    // ✅ 1x append ke DOM
    container.appendChild(fragment);
}

// ==========================================
// UPDATE STATISTIK + ISI DROPDOWN MATKUL
// ==========================================
function updateStatistik(data) {
    let totalPraktikum = 0;
    let belumKumpul = 0;
    const matkulSet = new Set();

    data.forEach(t => {
        const jenis = (t.jenis_tugas || 'Tugas').toLowerCase();
        if (jenis === 'praktikum') totalPraktikum++;
        if (!t.sudah_kumpul) belumKumpul++;
        if (t.mata_kuliah) matkulSet.add(t.mata_kuliah);
    });

    const totalTugas = data.length;
    const totalTugasBiasa = totalTugas - totalPraktikum;

    // Update elemen statistik
    const elTotal = document.getElementById('statTotal');
    const elTugas = document.getElementById('statTugas');
    const elPraktikum = document.getElementById('statPraktikum');
    const elBelum = document.getElementById('statBelum');

    if (elTotal) elTotal.innerText = totalTugas;
    if (elTugas) elTugas.innerText = totalTugasBiasa;
    if (elPraktikum) elPraktikum.innerText = totalPraktikum;
    if (elBelum) elBelum.innerText = belumKumpul;

    // Update badge filter
    const filterTugasBadge = document.getElementById('filterTugasCount');
    const filterPraktikumBadge = document.getElementById('filterPraktikumCount');
    if (filterTugasBadge) filterTugasBadge.innerText = totalTugasBiasa;
    if (filterPraktikumBadge) filterPraktikumBadge.innerText = totalPraktikum;

    // Isi dropdown matkul
    const dropdown = document.getElementById('filterMatkul');
    if (dropdown) {
        const uniqueMatkul = Array.from(matkulSet).sort();
        const currentValue = dropdown.value;

        dropdown.innerHTML = '<option value="">Semua Mata Kuliah</option>' +
            uniqueMatkul.map(m => `<option value="${m}">${m}</option>`).join('');

        dropdown.value = currentValue;
    }
}

// ==========================================
// MODAL UPLOAD TUGAS
// ==========================================
function bukaModalUploadTugas(id_tugas, judul_tugas) {
    document.getElementById('upload_id_tugas').value = id_tugas;
    document.getElementById('modalUploadTugasTitle').innerText = `Upload: ${judul_tugas}`;
    document.getElementById('formUploadTugas').reset();
    document.getElementById('modalUploadTugas').classList.remove('hidden');
}

function tutupModal(id) {
    document.getElementById(id).classList.add('hidden');
}

// ==========================================
// HELPER: FILE TO BASE64
// ==========================================
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// ==========================================
// VALIDASI UKURAN FILE
// ==========================================
document.addEventListener('DOMContentLoaded', function () {
    const fileInput = document.getElementById('upload_file');
    if (fileInput) {
        fileInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (file && file.size > 10 * 1024 * 1024) {
                alert('File terlalu besar! Maksimal 10MB.');
                this.value = '';
            }
        });
    }
});

// ==========================================
// SUBMIT UPLOAD TUGAS
// ==========================================
document.getElementById('formUploadTugas').addEventListener('submit', async function (e) {
    e.preventDefault();

    const sessionData = localStorage.getItem('user') || localStorage.getItem('user_session');
    if (!sessionData) {
        alert('Sesi tidak valid. Silakan login ulang.');
        window.location.href = '../login.html';
        return;
    }

    const user = JSON.parse(sessionData);
    const btn = this.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Mengirim...';
    btn.disabled = true;

    try {
        const fileInput = document.getElementById('upload_file');
        let base64File = null, fileName = null;

        if (fileInput.files.length === 0) {
            alert('Silakan pilih file terlebih dahulu!');
            btn.innerHTML = originalText;
            btn.disabled = false;
            return;
        }

        const file = fileInput.files[0];

        if (file.size > 10 * 1024 * 1024) {
            alert('Ukuran file terlalu besar! Maksimal 10MB.');
            btn.innerHTML = originalText;
            btn.disabled = false;
            return;
        }

        fileName = file.name;
        base64File = await fileToBase64(file);

        const idMahasiswa = user.id_mahasiswa || user.id_user;
        if (!idMahasiswa) {
            alert('Data mahasiswa tidak ditemukan. Silakan login ulang.');
            btn.innerHTML = originalText;
            btn.disabled = false;
            return;
        }

        const idTugas = document.getElementById('upload_id_tugas').value;

        console.log('📤 Upload tugas:', idTugas, '| file:', fileName,
                    '| size:', (file.size / 1024).toFixed(1) + 'KB');

        // ⚠️ JANGAN pakai cache untuk upload
        const result = await callAPI('tambah_pengumpulan_tugas', {
            id_tugas: idTugas,
            id_mahasiswa: idMahasiswa,
            file_base64: base64File,
            file_nama: fileName
        }, {
            logLabel: 'tambah_pengumpulan_tugas',
            skipCache: true,           // ← WAJIB
            timeout: 90000             // ← 90 detik untuk upload file
        });

        console.log('📥 Upload response:', result.status);

        if (result.status === 'success') {
            alert('✅ ' + result.message);
            tutupModal('modalUploadTugas');

            // ✅ Invalidate cache tugas karena sudah berubah
            invalidateAPI('get_tugas');
            invalidateAPI('get_dashboard_mahasiswa');

            setTimeout(() => location.reload(), 1000);
        } else {
            alert('❌ Gagal: ' + result.message);
            btn.innerHTML = originalText;
            btn.disabled = false;
        }

    } catch (error) {
        console.error('Error upload:', error);
        alert('❌ Gagal mengunggah:\n' + error.message);
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
});
