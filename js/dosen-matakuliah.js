// ==========================================
// js/dosen-matakuliah.js
// Version: 3.1 - API helper + robust error handling
// ==========================================

document.addEventListener('DOMContentLoaded', async () => {
    const sessionData = localStorage.getItem('user_session');
    if (!sessionData) {
        window.location.href = '../login.html';
        return;
    }
    const user = JSON.parse(sessionData);
    if (user.role !== 'dosen') {
        alert('Anda bukan dosen!');
        window.location.href = '../login.html';
        return;
    }

    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) pageTitle.innerText = 'Mata Kuliah Ampuan';

    if (user.id_dosen) {
        await loadKelasDosen(user.id_dosen);
    } else {
        const container = document.getElementById('containerMatkulDosen');
        if (container) container.innerHTML = '<p class="text-red-500 col-span-3 text-center py-10">Error: ID Dosen tidak ditemukan.</p>';
    }
});

// ==========================================
// 🌐 API HELPER — TERPUSAT, AMAN
// ==========================================
async function callAPI(action, payload, options) {
    options = options || {};
    const timeoutMs = options.timeoutMs || 60000;
    const logLabel = options.logLabel || action;

    // Log ringkas (SENSOR base64)
    if (payload && (payload.materi_base64 || payload.lampiran_base64 || payload.file_base64)) {
        console.log('📤 [' + logLabel + '] payload (base64 hidden)');
    } else {
        console.log('📤 [' + logLabel + '] payload:', payload);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    const t0 = Date.now();

    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            mode: 'cors',
            redirect: 'follow',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(Object.assign({ action: action }, payload || {})),
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        const elapsed = Date.now() - t0;

        if (!response.ok) {
            throw new Error('HTTP ' + response.status + ' (' + elapsed + 'ms)');
        }

        const text = await response.text();
        const trimmed = text.trim();

        if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html')) {
            console.error('❌ [' + logLabel + '] Server balas HTML:', trimmed.substring(0, 300));
            throw new Error(
                'Server mengembalikan HTML, bukan JSON. ' +
                'Cek: (1) Deployment "Who has access" = Anyone, ' +
                '(2) URL di config.js valid.'
            );
        }

        let result;
        try {
            result = JSON.parse(trimmed);
        } catch (parseErr) {
            console.error('❌ [' + logLabel + '] Response bukan JSON:', trimmed.substring(0, 300));
            throw new Error('Response bukan JSON: ' + trimmed.substring(0, 100));
        }

        console.log('📥 [' + logLabel + '] OK (' + elapsed + 'ms):', result.status);
        return result;

    } catch (err) {
        clearTimeout(timeoutId);
        const elapsed = Date.now() - t0;

        if (err.name === 'AbortError') {
            console.error('⏱️ [' + logLabel + '] TIMEOUT ' + timeoutMs + 'ms');
            throw new Error('Timeout setelah ' + (timeoutMs / 1000) + ' detik.');
        }

        console.error('❌ [' + logLabel + '] GAGAL (' + elapsed + 'ms):', err.message);
        throw err;
    }
}

// ==========================================
// LOGOUT
// ==========================================
document.addEventListener('click', function (e) {
    const logoutBtn = e.target.closest('#btnLogout');
    if (logoutBtn) {
        localStorage.removeItem('user_session');
        window.location.href = '../login.html';
    }
});

// ==========================================
// 1. LOAD KELAS DOSEN
// ==========================================
async function loadKelasDosen(id_dosen) {
    const container = document.getElementById('containerMatkulDosen');

    container.innerHTML = Array(4).fill(`
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-pulse">
            <div class="flex justify-between items-start mb-3">
                <div class="h-5 bg-slate-200 rounded w-20"></div>
                <div class="h-4 bg-slate-200 rounded w-24"></div>
            </div>
            <div class="h-5 bg-slate-200 rounded w-3/4 mb-2"></div>
            <div class="h-4 bg-slate-200 rounded w-1/2 mb-4"></div>
            <div class="h-12 bg-slate-200 rounded w-full mb-4"></div>
            <div class="flex gap-3">
                <div class="h-10 bg-slate-200 rounded flex-1"></div>
                <div class="h-10 bg-slate-200 rounded flex-1"></div>
            </div>
        </div>
    `).join('');

    try {
        const result = await callAPI('get_matakuliah_ampuan',
            { id_dosen: id_dosen },
            { logLabel: 'get_matakuliah_ampuan', timeoutMs: 30000 });

        if (result.status === 'success') {
            container.innerHTML = '';

            if (!result.data || result.data.length === 0) {
                container.innerHTML = `
                    <div class="col-span-full bg-amber-50 border border-amber-200 text-amber-700 p-4 rounded-lg text-center">
                        <i class="fa-solid fa-circle-exclamation mr-2"></i>
                        Belum ada kelas yang diampu oleh dosen dengan ID <b>${id_dosen}</b>.<br>
                        <span class="text-xs">Pastikan di sheet <b>Kelas</b> sudah ada baris dengan id_dosen ini.</span>
                    </div>
                `;
                return;
            }

            result.data.forEach(item => {
                const card = document.createElement('div');
                card.className = "bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-teal-200 hover:shadow-md transition-all flex flex-col justify-between";

                card.innerHTML = `
                    <div>
                        <div class="flex justify-between items-start mb-3">
                            <span class="bg-teal-50 text-teal-600 text-xs font-bold px-2.5 py-1 rounded-md border border-teal-100">
                                Semester ${item.semester || '-'}
                            </span>
                            <span class="text-xs font-semibold text-slate-400">${item.kode_mk || '-'} - ${item.sks || '-'} SKS</span>
                        </div>
                        <h3 class="text-lg font-bold text-slate-800 leading-tight mb-1">${item.mata_kuliah || 'Mata Kuliah'}</h3>
                        <p class="text-sm text-slate-500 mb-4 flex items-center">
                            <i class="fa-solid fa-chalkboard-user mr-2 text-slate-400"></i> ${item.dosen_pengampu || 'Dosen Pengampu'}
                        </p>
                        <div class="bg-teal-50 p-3 rounded-lg border border-teal-100 flex items-center justify-between">
                            <span class="text-xs font-bold text-teal-700">
                                <i class="fa-solid fa-list-check mr-2"></i> Rekap Kelas
                            </span>
                            <span class="text-xs font-bold text-teal-700 bg-white px-3 py-1 rounded-full border border-teal-200">
                                ${item.total_pertemuan || 0} Pertemuan
                            </span>
                        </div>
                    </div>
                    
                    <div class="mt-5 flex gap-3">
                        <button onclick="bukaModalDetail('${item.id_kelas}', '${(item.mata_kuliah || '').replace(/'/g, "\\'")}')" 
                            class="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2.5 rounded-lg text-xs font-bold transition-colors flex items-center justify-center shadow-sm">
                            <i class="fa-solid fa-door-open mr-1.5"></i> Lihat Kelas
                        </button>
                        <button onclick="bukaModalEditMatkul('${item.id_kelas}')" 
                            class="flex-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 py-2.5 rounded-lg text-xs font-bold transition-colors flex items-center justify-center shadow-sm">
                            <i class="fa-solid fa-pen-to-square mr-1.5"></i> Edit
                        </button>
                    </div>
                `;
                container.appendChild(card);
            });
        } else {
            container.innerHTML = `
                <div class="col-span-full bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                    <i class="fa-solid fa-circle-exclamation text-red-500 text-3xl mb-2"></i>
                    <p class="text-red-600 font-medium">Server Error: ${result.message || 'Terjadi kesalahan'}</p>
                </div>
            `;
        }
    } catch (error) {
        console.error("ERROR loadKelasDosen:", error);
        container.innerHTML = `
            <div class="col-span-full bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg text-center">
                <i class="fa-solid fa-triangle-exclamation mr-2"></i>
                Gagal memuat data: ${error.message}
                <button onclick="loadKelasDosen('${id_dosen}')" 
                    class="mt-3 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                    <i class="fa-solid fa-rotate mr-1"></i> Coba Lagi
                </button>
            </div>
        `;
    }
}

// ==========================================
// 2. FORMAT HELPER
// ==========================================
function formatTanggal(isoString) {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatJam(isoString) {
    if (!isoString || typeof isoString !== 'string') return '';
    if (!isoString.includes('T')) return isoString;
    const parts = isoString.split('T');
    if (parts.length < 2) return '';
    return parts[1].slice(0, 5);
}

// ==========================================
// 3. MODAL DETAIL PERTEMUAN
// ==========================================
async function bukaModalDetail(id_kelas, nama_matkul) {
    const modal = document.getElementById('modalDetailKelas');
    const judul = document.getElementById('modalJudulKelas');
    const container = document.getElementById('modalContainerPertemuan');

    judul.innerText = nama_matkul;

    container.innerHTML = `
        <div class="animate-pulse space-y-3">
            <div class="h-10 bg-slate-200 rounded"></div>
            <div class="h-24 bg-slate-200 rounded"></div>
            <div class="h-24 bg-slate-200 rounded"></div>
            <div class="h-24 bg-slate-200 rounded"></div>
        </div>
    `;
    modal.classList.remove('hidden');

    try {
        const result = await callAPI('get_jadwal_pertemuan',
            { id_kelas: id_kelas },
            { logLabel: 'get_jadwal_pertemuan', timeoutMs: 30000 });

        if (result.status === 'success' && result.data.length > 0) {
            let html = `
                <div class="flex justify-end mb-4">
                    <button onclick="bukaModalTambahPertemuan('${id_kelas}')" 
                        class="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow flex items-center gap-2">
                        <i class="fa-solid fa-plus"></i> Tambah Pertemuan Baru
                    </button>
                </div>
            `;

            result.data.forEach(pert => {
                const isOnline = pert.ruang_atau_link && pert.ruang_atau_link.toLowerCase().includes('http');
                const judulMateri = pert.judul_materi && pert.judul_materi.toString().trim() !== ''
                    ? pert.judul_materi
                    : 'Judul Materi';

                let jamTampil = '';
                if (pert.jam_mulai && pert.jam_selesai) {
                    const jamMulai = formatJam(pert.jam_mulai);
                    const jamSelesai = formatJam(pert.jam_selesai);
                    jamTampil = ` · ${jamMulai} - ${jamSelesai}`;
                }

                html += `
                    <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div class="flex-1">
                            <div class="flex flex-wrap items-center gap-2 mb-1">
                                <span class="bg-teal-100 text-teal-700 text-xs font-bold px-2 py-1 rounded-full">Pertemuan ke-${pert.pertemuan_ke}</span>
                                <span class="text-sm text-slate-700 font-medium">${formatTanggal(pert.tanggal)}${jamTampil}</span>
                            </div>
                            <p class="text-sm font-bold text-slate-800 mb-1">${judulMateri}</p>
                            <p class="text-sm text-slate-500">Jenis: <span class="font-semibold text-slate-700">${pert.jenis_kuliah || '-'}</span></p>
                        </div>
                        
                        <div class="flex flex-col md:flex-row items-start md:items-center gap-2 w-full md:w-auto">
                            ${isOnline
                        ? `<a href="${pert.ruang_atau_link}" target="_blank" class="w-full md:w-auto bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold text-center"><i class="fa-solid fa-video mr-2"></i> Masuk Zoom</a>`
                        : `<span class="w-full md:w-auto text-slate-500 text-sm bg-slate-100 px-4 py-2 rounded-lg text-center border border-slate-200"><i class="fa-solid fa-building mr-2"></i> Offline</span>`
                    }
                            
                            <div class="flex gap-2 w-full md:w-auto">
                                ${pert.link_materi ? `
                                    <a href="${pert.link_materi}" target="_blank" class="flex-1 md:w-auto bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-600 px-3 py-2 rounded-lg text-xs font-bold text-center flex items-center justify-center gap-1">
                                        <i class="fa-solid fa-file-arrow-down"></i> Materi
                                    </a>
                                ` : ''}
                        
                                <button onclick="bukaModalEditPertemuan('${pert.id_pertemuan}')" 
                                    class="flex-1 md:w-auto bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 px-3 py-2 rounded-lg text-xs font-bold text-center">
                                    <i class="fa-solid fa-pen"></i>
                                </button>
                        
                                <button onclick="hapusPertemuan('${pert.id_pertemuan}')" 
                                    class="flex-1 md:w-auto bg-red-50 hover:bg-red-100 border border-red-200 text-red-500 px-3 py-2 rounded-lg text-xs font-bold text-center">
                                    <i class="fa-solid fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            });

            container.innerHTML = html;
        } else {
            container.innerHTML = `
                <div class="flex justify-end mb-4">
                    <button onclick="bukaModalTambahPertemuan('${id_kelas}')" 
                        class="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow flex items-center gap-2">
                        <i class="fa-solid fa-plus"></i> Tambah Pertemuan Baru
                    </button>
                </div>
                <div class="text-center py-10">
                    <i class="fa-solid fa-inbox text-slate-300 text-5xl mb-3"></i>
                    <p class="text-slate-500">Belum ada data pertemuan untuk kelas ini.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error(error);
        container.innerHTML = `
            <div class="text-center py-10">
                <i class="fa-solid fa-circle-xmark text-red-500 text-3xl mb-2"></i>
                <p class="text-red-500">Gagal memuat data pertemuan.</p>
                <p class="text-red-400 text-xs mt-1">${error.message}</p>
            </div>
        `;
    }
}

function tutupModalDetail() {
    document.getElementById('modalDetailKelas').classList.add('hidden');
    document.getElementById('modalContainerPertemuan').innerHTML = '';
}

// ==========================================
// 4. MODAL TAMBAH MATKUL
// ==========================================
async function bukaModalTambahMatkul() {
    const modal = document.getElementById('modalTambahMatkul');
    modal.classList.remove('hidden');

    const container = document.getElementById('mahasiswaContainer');
    const searchInput = document.getElementById('searchMahasiswa');

    if (searchInput) {
        searchInput.value = '';
        searchInput.style.display = 'block';
    }

    container.innerHTML = `
        <div class="space-y-2 animate-pulse">
            <div class="h-12 bg-slate-200 rounded"></div>
            <div class="h-12 bg-slate-200 rounded"></div>
            <div class="h-12 bg-slate-200 rounded"></div>
        </div>
    `;

    try {
        const result = await callAPI('get_list_mahasiswa', {},
            { logLabel: 'get_list_mahasiswa', timeoutMs: 30000 });

        if (result.status === 'success') {
            if (result.data && Array.isArray(result.data) && result.data.length > 0) {
                let html = '';
                result.data.forEach(mhs => {
                    html += `
                        <label class="flex items-center space-x-3 p-2 hover:bg-white rounded-lg cursor-pointer transition border border-transparent hover:border-slate-200 search-item">
                            <input type="checkbox" value="${mhs.id_mahasiswa}" class="h-4 w-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500">
                            <span class="text-sm text-slate-700 flex-1">
                                <span class="font-semibold">${mhs.nim || '-'}</span> - ${mhs.nama_mahasiswa || '-'}
                                <span class="block text-xs text-slate-400">${mhs.program_studi || '-'} | Angkatan ${mhs.angkatan || '-'}</span>
                            </span>
                        </label>
                    `;
                });
                container.innerHTML = html;

                if (searchInput) {
                    searchInput.oninput = function () {
                        const keyword = this.value.toLowerCase().trim();
                        const items = container.querySelectorAll('.search-item');
                        if (keyword === '') {
                            items.forEach(el => el.style.display = 'flex');
                            return;
                        }
                        items.forEach(item => {
                            item.style.display = item.textContent.toLowerCase().includes(keyword) ? 'flex' : 'none';
                        });
                    };
                }
            } else {
                container.innerHTML = `<p class="text-center text-sm text-yellow-600 py-4 italic">Tidak ada mahasiswa yang terdaftar di sistem.</p>`;
                if (searchInput) searchInput.style.display = 'none';
            }
        } else {
            container.innerHTML = `<p class="text-center text-sm text-red-500 py-4">Error dari server: ${result.message || 'Terjadi kesalahan'}</p>`;
            if (searchInput) searchInput.style.display = 'none';
        }
    } catch (error) {
        console.error("ERROR bukaModalTambahMatkul:", error);
        container.innerHTML = `
            <p class="text-center text-sm text-red-500 py-4">
                Gagal memuat mahasiswa.<br>
                <span class="text-xs block mt-1">${error.message}</span>
            </p>
        `;
        if (searchInput) searchInput.style.display = 'none';
    }
}

// ==========================================
// 5. MODAL TAMBAH PERTEMUAN
// ==========================================
function bukaModalTambahPertemuan(id_kelas) {
    document.getElementById('modalTambahPertemuan').classList.remove('hidden');
    document.getElementById('formTambahPertemuan').dataset.idKelas = id_kelas;
}

function tutupModal(id) {
    document.getElementById(id).classList.add('hidden');
}

// ==========================================
// 6. MODAL EDIT MATKUL
// ==========================================
async function bukaModalEditMatkul(id_kelas) {
    console.log(">>> Tombol Edit diklik! ID Kelas:", id_kelas);

    const modal = document.getElementById('modalEditMatkul');
    const container = document.getElementById('editMahasiswaContainer');

    if (!modal) {
        alert("Error: Modal Edit tidak ditemukan di HTML!");
        return;
    }

    modal.classList.remove('hidden');
    container.innerHTML = `
        <div class="space-y-2 animate-pulse">
            <div class="h-12 bg-slate-200 rounded"></div>
            <div class="h-12 bg-slate-200 rounded"></div>
            <div class="h-12 bg-slate-200 rounded"></div>
        </div>
    `;

    try {
        const result = await callAPI('get_detail_kelas',
            { id_kelas: id_kelas },
            { logLabel: 'get_detail_kelas', timeoutMs: 30000 });

        if (result.status === 'success') {
            const data = result.data;

            document.getElementById('edit_id_kelas').value = id_kelas;
            document.getElementById('edit_id_matkul').value = data.kelas.id_matkul;
            document.getElementById('edit_mk_kode').value = data.matkul.kode_mk;
            document.getElementById('edit_mk_nama').value = data.matkul.nama_mk;
            document.getElementById('edit_mk_sks').value = data.matkul.sks;

            const semesterRaw = String(data.matkul.semester || '').trim();
            const semesterDropdown = document.getElementById('edit_mk_semester');

            if (semesterRaw === 'Ganjil' || semesterRaw === 'Genap') {
                semesterDropdown.value = semesterRaw;
            } else if (semesterRaw && !isNaN(semesterRaw)) {
                const semesterNum = parseInt(semesterRaw);
                semesterDropdown.value = (semesterNum % 2 === 1) ? 'Ganjil' : 'Genap';
            } else {
                semesterDropdown.value = '';
            }

            // Load list mahasiswa
            const listMhs = await callAPI('get_list_mahasiswa', {},
                { logLabel: 'get_list_mahasiswa_edit', timeoutMs: 30000 });

            if (listMhs.status === 'success' && listMhs.data.length > 0) {
                let html = '';
                listMhs.data.forEach(mhs => {
                    const isChecked = data.mahasiswa_terdaftar.includes(mhs.id_mahasiswa) ? 'checked' : '';
                    html += `
                        <label class="flex items-center space-x-3 p-2 hover:bg-white rounded-lg cursor-pointer transition border border-transparent hover:border-slate-200 search-item-edit">
                            <input type="checkbox" value="${mhs.id_mahasiswa}" class="h-4 w-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500" ${isChecked}>
                            <span class="text-sm text-slate-700 flex-1">
                                <span class="font-semibold">${mhs.nim || '-'}</span> - ${mhs.nama_mahasiswa || '-'}
                                <span class="block text-xs text-slate-400">${mhs.program_studi || '-'} | Angkatan ${mhs.angkatan || '-'}</span>
                            </span>
                        </label>
                    `;
                });
                container.innerHTML = html;

                const searchInput = document.getElementById('edit_searchMahasiswa');
                if (searchInput) {
                    searchInput.oninput = function () {
                        const keyword = this.value.toLowerCase().trim();
                        const items = container.querySelectorAll('.search-item-edit');
                        if (keyword === '') {
                            items.forEach(el => el.style.display = 'flex');
                            return;
                        }
                        items.forEach(item => {
                            item.style.display = item.textContent.toLowerCase().includes(keyword) ? 'flex' : 'none';
                        });
                    };
                }
            } else {
                container.innerHTML = `<p class="text-center text-sm text-yellow-600 py-4 italic">Tidak ada mahasiswa di sistem.</p>`;
            }
        } else {
            container.innerHTML = `<p class="text-center text-sm text-red-500 py-4">Error: ${result.message || 'Terjadi kesalahan'}</p>`;
        }
    } catch (error) {
        console.error("ERROR bukaModalEditMatkul:", error);
        container.innerHTML = `
            <p class="text-center text-sm text-red-500 py-4">
                Gagal memuat data edit.<br>
                <span class="text-xs block mt-1">${error.message}</span>
            </p>
        `;
    }
}

// ==========================================
// 7. SUBMIT: SIMPAN PERUBAHAN EDIT MATKUL
// ==========================================
document.getElementById('formEditMatkul').addEventListener('submit', async function (e) {
    e.preventDefault();
    const btn = this.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;

    const checkedBoxes = document.querySelectorAll('#editMahasiswaContainer input[type="checkbox"]:checked');
    const mahasiswaTerpilih = Array.from(checkedBoxes).map(cb => cb.value);

    if (mahasiswaTerpilih.length === 0) {
        alert('Minimal 1 mahasiswa harus dipilih!');
        return;
    }

    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Menyimpan...';
    btn.disabled = true;

    try {
        const result = await callAPI('update_matakuliah', {
            id_kelas: document.getElementById('edit_id_kelas').value,
            id_matkul: document.getElementById('edit_id_matkul').value,
            kode_mk: document.getElementById('edit_mk_kode').value,
            nama_mk: document.getElementById('edit_mk_nama').value,
            sks: document.getElementById('edit_mk_sks').value,
            semester: document.getElementById('edit_mk_semester').value,
            mahasiswa_terpilih: mahasiswaTerpilih
        }, { logLabel: 'update_matakuliah' });

        if (result.status === 'success') {
            alert(result.message);
            tutupModal('modalEditMatkul');
            location.reload();
        } else {
            alert('Gagal: ' + result.message);
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    } catch (error) {
        console.error(error);
        alert('Gagal menyimpan:\n' + error.message);
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
});

// ==========================================
// 8. SUBMIT: SIMPAN MATKUL BARU
// ==========================================
document.getElementById('formTambahMatkul').addEventListener('submit', async function (e) {
    e.preventDefault();

    const btn = this.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    const session = JSON.parse(localStorage.getItem('user_session'));

    const checkedBoxes = document.querySelectorAll('#mahasiswaContainer input[type="checkbox"]:checked');
    const mahasiswaTerpilih = Array.from(checkedBoxes).map(cb => cb.value);

    if (mahasiswaTerpilih.length === 0) {
        alert('Anda harus memilih minimal 1 mahasiswa untuk kelas ini!');
        return;
    }

    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Menyimpan Data...';
    btn.disabled = true;

    try {
        const result = await callAPI('tambah_matakuliah', {
            kode_mk: document.getElementById('mk_kode').value,
            nama_mk: document.getElementById('mk_nama').value,
            sks: document.getElementById('mk_sks').value,
            semester: document.getElementById('mk_semester').value,
            id_dosen: session.id_dosen,
            mahasiswa_terpilih: mahasiswaTerpilih
        }, { logLabel: 'tambah_matakuliah' });

        if (result.status === 'success') {
            alert(result.message);
            location.reload();
        } else {
            alert('Gagal: ' + result.message);
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    } catch (error) {
        console.error("Error simpan matkul:", error);
        alert('Gagal menyimpan:\n' + error.message);
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
});

// ==========================================
// 9. SUBMIT: SIMPAN PERTEMUAN BARU
// ==========================================
document.getElementById('formTambahPertemuan').addEventListener('submit', async function (e) {
    e.preventDefault();

    const btn = this.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    const idKelas = this.dataset.idKelas;

    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Menyimpan Pertemuan...';
    btn.disabled = true;

    const fileInput = document.getElementById('pt_file_materi');
    let base64File = null, fileName = null;

    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        if (file.size > 10 * 1024 * 1024) {
            alert('Ukuran file terlalu besar! Maksimal 10MB.');
            btn.innerHTML = originalText;
            btn.disabled = false;
            return;
        }
        fileName = file.name.replace(/\s+/g, '_');
        base64File = await fileToBase64(file);
    }

    // ⚠️ JANGAN log data mentah (base64 besar)
    console.log('>>> Kirim tambah_pertemuan untuk kelas:', idKelas,
        '| materi:', fileName || 'tidak ada');

    function _normalizeJamInput(v) {
        if (!v) return '';
        const s = String(v).trim().replace(',', '.').replace('.', ':');
        const m = s.match(/^(\d{1,2}):(\d{2})/);
        if (m) {
            return String(m[1]).padStart(2, '0') + ':' + m[2];
        }
        return s.substring(0, 5);
    }
    
    try {
        const result = await callAPI('tambah_pertemuan', {
            id_kelas: idKelas,
            tanggal: document.getElementById('pt_tanggal').value,
            jam_mulai: _normalizeJamInput(document.getElementById('pt_jam_mulai').value),
            jam_selesai: _normalizeJamInput(document.getElementById('pt_jam_selesai').value),
            judul_materi: document.getElementById('pt_judul').value,
            ruang_atau_link: document.getElementById('pt_link').value,
            materi_base64: base64File,
            materi_nama_file: fileName
        }, { logLabel: 'tambah_pertemuan', timeoutMs: 90000 }); // 90s kalau ada upload

        if (result.status === 'success') {
            alert('Pertemuan berhasil ditambahkan!');
            tutupModal('modalTambahPertemuan');
            location.reload();
        } else {
            alert('Gagal: ' + result.message);
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    } catch (error) {
        console.error("Error simpan pertemuan:", error);
        alert('Gagal menyimpan pertemuan:\n' + error.message);
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
});

// ==========================================
// 10. MODAL EDIT PERTEMUAN
// ==========================================
async function bukaModalEditPertemuan(id_pertemuan) {
    const modal = document.getElementById('modalEditPertemuan');
    modal.classList.remove('hidden');

    try {
        const result = await callAPI('get_detail_pertemuan',
            { id_pertemuan: id_pertemuan },
            { logLabel: 'get_detail_pertemuan', timeoutMs: 30000 });

        if (result.status === 'success') {
            const p = result.data;
            document.getElementById('edit_pt_id_pertemuan').value = p.id_pertemuan;
            document.getElementById('edit_pt_tanggal').value = p.tanggal;
            document.getElementById('edit_pt_jam_mulai').value = p.jam_mulai;
            document.getElementById('edit_pt_jam_selesai').value = p.jam_selesai;
            document.getElementById('edit_pt_judul').value = p.judul_materi;
            document.getElementById('edit_pt_link').value = p.ruang_atau_link;

            const linkMateriWrapper = document.getElementById('edit_existing_materi_wrapper');
            const linkMateriAnchor = document.getElementById('edit_existing_materi_link');

            linkMateriWrapper.classList.add('hidden');
            linkMateriAnchor.href = '#';

            if (p.link_materi && p.link_materi.trim() !== '') {
                linkMateriWrapper.classList.remove('hidden');
                linkMateriAnchor.href = p.link_materi;
                linkMateriAnchor.innerText = 'Download Materi Saat Ini';
            }
        } else {
            alert('Gagal mengambil data pertemuan: ' + result.message);
        }
    } catch (error) {
        console.error(error);
        alert('Gagal memuat: ' + error.message);
    }
}

// ==========================================
// 11. SUBMIT: UPDATE PERTEMUAN
// ==========================================
document.getElementById('formEditPertemuan').addEventListener('submit', async function (e) {
    e.preventDefault();
    const btn = this.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Menyimpan...';
    btn.disabled = true;

    try {
        const result = await callAPI('update_pertemuan', {
            id_pertemuan: document.getElementById('edit_pt_id_pertemuan').value,
            tanggal: document.getElementById('edit_pt_tanggal').value,
            jam_mulai: document.getElementById('edit_pt_jam_mulai').value,
            jam_selesai: document.getElementById('edit_pt_jam_selesai').value,
            judul_materi: document.getElementById('edit_pt_judul').value,
            ruang_atau_link: document.getElementById('edit_pt_link').value,
            jenis_kuliah: 'Online'
        }, { logLabel: 'update_pertemuan' });

        if (result.status === 'success') {
            alert(result.message);
            tutupModal('modalEditPertemuan');
            location.reload();
        } else {
            alert('Gagal: ' + result.message);
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    } catch (error) {
        console.error(error);
        alert('Gagal menyimpan:\n' + error.message);
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
});

// ==========================================
// 12. HAPUS PERTEMUAN
// ==========================================
async function hapusPertemuan(id_pertemuan) {
    if (!confirm('Apakah Anda yakin ingin menghapus pertemuan ini?')) return;

    try {
        const result = await callAPI('delete_pertemuan',
            { id_pertemuan: id_pertemuan },
            { logLabel: 'delete_pertemuan', timeoutMs: 30000 });

        if (result.status === 'success') {
            alert(result.message);
            location.reload();
        } else {
            alert('Gagal hapus: ' + result.message);
        }
    } catch (error) {
        console.error(error);
        alert('Gagal menghapus:\n' + error.message);
    }
}

// ==========================================
// 13. HELPER: FILE TO BASE64
// ==========================================
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            console.log(">>> fileToBase64 sukses:", reader.result.substring(0, 50) + "...");
            resolve(reader.result);
        };
        reader.onerror = error => {
            console.error(">>> fileToBase64 error:", error);
            reject(error);
        };
    });
}
