// js/dosen-matakuliah.js - Data Kelas Ampuan Dosen (Lengkap dengan CRUD)

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

    // Logout
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            localStorage.removeItem('user_session');
            window.location.href = '../login.html';
        });
    }

    // --- PERBAIKAN DIMULAI DI SINI ---
    // Tampilkan nama dan spesialisasi dosen di header (Sama persis dengan dashboard)
    const namaDosen = user.nama_dosen || 'Dosen EduLearn';
    const spesialisasiDosen = user.spesialisasi || 'Dosen Pengajar';
    
    const userNameDisplay = document.getElementById('dosenNameDisplay');
    if (userNameDisplay) {
        userNameDisplay.innerText = namaDosen;
    }

    const userSpesialisasi = document.getElementById('dosenSpesialisasiDisplay');
    if (userSpesialisasi) {
        userSpesialisasi.innerText = spesialisasiDosen;
    }
    // --- PERBAIKAN SELESAI DI SINI ---
    
    if (user.id_dosen) {
        await loadKelasDosen(user.id_dosen);
    } else {
        const container = document.getElementById('containerMatkulDosen');
        if (container) container.innerHTML = '<p class="text-red-500 col-span-3 text-center py-10">Error: ID Dosen tidak ditemukan.</p>';
    }
});

async function loadKelasDosen(id_dosen) {
    const container = document.getElementById('containerMatkulDosen');
    // Tampilkan loading
    container.innerHTML = '<p class="text-center text-slate-400 py-10"><i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Sedang memuat data...</p>';

    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            body: JSON.stringify({ 
                action: 'get_matakuliah_ampuan',
                id_dosen: id_dosen 
            })
        });
        
        // Cek apakah response HTTP berhasil (200)
        if (!response.ok) {
            throw new Error(`HTTP Error ${response.status}`);
        }

        const result = await response.json();
        console.log("DATA DARI SERVER:", result); // Lihat di Console (F12)

        if (result.status === 'success') {
            container.innerHTML = ''; 
            if (!result.data || result.data.length === 0) {
                container.innerHTML = `
                    <div class="col-span-full bg-amber-50 border border-amber-200 text-amber-700 p-4 rounded-lg text-center">
                        <i class="fa-solid fa-circle-exclamation mr-2"></i>
                        Belum ada kelas yang diampu oleh dosen dengan ID <b>${id_dosen}</b>.<br>
                        <span class="text-xs">Pastikan di sheet <b>Kelas</b> di Google Sheets sudah ada baris dengan id_dosen ini.</span>
                    </div>
                `;
                return;
            }

            // RENDER KARTU (Kode kartu Anda yang sudah ada)
            result.data.forEach(item => {
                const card = document.createElement('div');
                card.className = "bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-teal-200 hover:shadow-md transition-all flex flex-col justify-between";
                
                card.innerHTML = `
                    <div>
                        <div class="flex justify-between items-start mb-3">
                            <span class="bg-teal-50 text-teal-600 text-xs font-bold px-2.5 py-1 rounded-md border border-teal-100">Semester ${item.semester || '-'}</span>
                            <span class="text-xs font-semibold text-slate-400">${item.kode_mk || '-'} - ${item.sks || '-'} SKS</span>
                        </div>
                        <h3 class="text-lg font-bold text-slate-800 leading-tight mb-1">${item.mata_kuliah || 'Mata Kuliah'}</h3>
                        <p class="text-sm text-slate-500 mb-4 flex items-center"><i class="fa-solid fa-chalkboard-user mr-2 text-slate-400"></i> ${item.dosen_pengampu || 'Dosen Pengampu'}</p>
                        <div class="bg-teal-50 p-3 rounded-lg border border-teal-100 flex items-center justify-between">
                            <span class="text-xs font-bold text-teal-700"><i class="fa-solid fa-list-check mr-2"></i> Rekap Kelas</span>
                            <span class="text-xs font-bold text-teal-700 bg-white px-3 py-1 rounded-full border border-teal-200">${item.total_pertemuan || 0} Pertemuan</span>
                        </div>
                    </div>
                    <div class="mt-5">
                        <button onclick="bukaModalDetail('${item.id_kelas}', '${item.mata_kuliah}')" class="w-full bg-teal-600 hover:bg-teal-700 text-white py-2.5 rounded-lg text-xs font-bold transition-colors flex items-center justify-center shadow-sm">
                            <i class="fa-solid fa-door-open mr-1.5"></i> Lihat / Kelola Kelas
                        </button>
                    </div>
                `;
                container.appendChild(card);
            });
        } else {
            container.innerHTML = `<p class="text-red-500 text-center">Server Error: ${result.message || 'Terjadi kesalahan'}</p>`;
        }
    } catch (error) {
        console.error("ERROR FETCH:", error);
        container.innerHTML = `
            <div class="col-span-full bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg text-center">
                <i class="fa-solid fa-triangle-exclamation mr-2"></i>
                Gagal memuat data. Kemungkinan:<br>
                1. URL API di js/config.js salah.<br>
                2. Apps Script belum di-deploy ulang.<br>
                3. Backend crash (Cek Logs Apps Script).<br>
                <span class="text-xs block mt-1">Detail error: ${error.message}</span>
            </div>
        `;
    }
}

// --- FUNGSI MODAL DETAIL PERTEMUAN ---
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

async function bukaModalDetail(id_kelas, nama_matkul) {
    const modal = document.getElementById('modalDetailKelas');
    const judul = document.getElementById('modalJudulKelas');
    const container = document.getElementById('modalContainerPertemuan');

    judul.innerText = nama_matkul;
    container.innerHTML = `<div class="text-center py-10 text-slate-400"><i class="fa-solid fa-circle-notch fa-spin text-2xl mb-2"></i><p>Memuat jadwal pertemuan...</p></div>`;
    modal.classList.remove('hidden');

    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            body: JSON.stringify({ 
                action: 'get_jadwal_pertemuan',
                id_kelas: id_kelas 
            })
        });
        const result = await response.json();

        if (result.status === 'success' && result.data.length > 0) {
            let html = `
                <div class="flex justify-end mb-4">
                    <button onclick="bukaModalTambahPertemuan('${id_kelas}')" class="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow flex items-center gap-2">
                        <i class="fa-solid fa-plus"></i> Tambah Pertemuan Baru
                    </button>
                </div>
            `;
            result.data.forEach(pert => {
                const isOnline = pert.ruang_atau_link && pert.ruang_atau_link.toLowerCase().includes('http');
                const judulMateri = pert.judul_materi && pert.judul_materi.toString().trim() !== '' ? pert.judul_materi : 'Judul Materi';
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
                            ${isOnline ? `<a href="${pert.ruang_atau_link}" target="_blank" class="w-full md:w-auto bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold text-center"><i class="fa-solid fa-video mr-2"></i> Masuk Zoom</a>` : `<span class="w-full md:w-auto text-slate-500 text-sm bg-slate-100 px-4 py-2 rounded-lg text-center border border-slate-200"><i class="fa-solid fa-building mr-2"></i> Offline</span>`}
                        </div>
                    </div>
                `;
            });
            container.innerHTML = html;
        } else {
            container.innerHTML = `
                <div class="flex justify-end mb-4">
                    <button onclick="bukaModalTambahPertemuan('${id_kelas}')" class="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow flex items-center gap-2">
                        <i class="fa-solid fa-plus"></i> Tambah Pertemuan Baru
                    </button>
                </div>
                <p class="text-center text-slate-500 py-10">Belum ada data pertemuan untuk kelas ini.</p>
            `;
        }
    } catch (error) {
        console.error(error);
        container.innerHTML = `<p class="text-center text-red-500 py-10">Gagal memuat data pertemuan.</p>`;
    }
}

function tutupModalDetail() {
    document.getElementById('modalDetailKelas').classList.add('hidden');
    document.getElementById('modalContainerPertemuan').innerHTML = '';
}

// Membuka Modal Tambah Matkul + Load Data Mahasiswa (GANTI DENGAN INI)
async function bukaModalTambahMatkul() {
    const modal = document.getElementById('modalTambahMatkul');
    modal.classList.remove('hidden');

    const container = document.getElementById('mahasiswaContainer');
    const searchInput = document.getElementById('searchMahasiswa');

    // Reset pencarian saat modal dibuka
    if (searchInput) {
        searchInput.value = '';
        searchInput.style.display = 'block';
    }

    container.innerHTML = '<p class="text-center text-sm text-slate-400 py-4 italic">Memuat daftar mahasiswa...</p>';

    try {
        console.log(">>> Mengambil data mahasiswa dari server...");
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'get_list_mahasiswa' })
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const result = await response.json();
        console.log(">>> Response dari Backend:", result);

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

                // --- FITUR SEARCH BAR DINAMIS (DIPERBAIKI) ---
                if (searchInput) {
                    searchInput.oninput = function() {
                        const keyword = this.value.toLowerCase().trim();
                        const items = container.querySelectorAll('.search-item');
                        
                        if (keyword === '') {
                            items.forEach(el => el.style.display = 'flex');
                            return;
                        }

                        items.forEach(item => {
                            const textContent = item.textContent.toLowerCase();
                            // Jika teks di dalam label mengandung keyword, tampilkan. Jika tidak, sembunyikan.
                            item.style.display = textContent.includes(keyword) ? 'flex' : 'none';
                        });
                    };
                } else {
                    // Jika elemen searchInput tidak ditemukan di HTML, beri peringatan di console
                    console.warn("Peringatan: Elemen input dengan id 'searchMahasiswa' tidak ditemukan di HTML. Fitur pencarian tidak aktif.");
                }
                // --- AKHIR FITUR SEARCH ---

            } else {
                container.innerHTML = `<p class="text-center text-sm text-yellow-600 py-4 italic">Tidak ada mahasiswa yang terdaftar di sistem.</p>`;
                if (searchInput) searchInput.style.display = 'none';
            }
        } else {
            container.innerHTML = `<p class="text-center text-sm text-red-500 py-4">Error dari server: ${result.message || 'Terjadi kesalahan'}</p>`;
            if (searchInput) searchInput.style.display = 'none';
        }
    } catch (error) {
        console.error("ERROR di bukaModalTambahMatkul:", error);
        container.innerHTML = `
            <p class="text-center text-sm text-red-500 py-4">
                Gagal memuat mahasiswa. <br>
                <span class="text-xs block mt-1">Cek Console (F12) untuk detail: ${error.message}</span>
            </p>
        `;
        if (searchInput) searchInput.style.display = 'none';
    }
}
function bukaModalTambahPertemuan(id_kelas) {
    document.getElementById('modalTambahPertemuan').classList.remove('hidden');
    document.getElementById('formTambahPertemuan').dataset.idKelas = id_kelas;
}
function tutupModal(id) {
    document.getElementById(id).classList.add('hidden');
}

// Logic Simpan Mata Kuliah (GANTI DENGAN INI)
// =========================================================
// Logic Simpan Mata Kuliah (Dengan Animasi Loading & Anti-Double Click)
// =========================================================
document.getElementById('formTambahMatkul').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const btn = this.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML; // Simpan teks asli tombol
    const session = JSON.parse(localStorage.getItem('user_session'));
    
    // Ambil data mahasiswa yang dicentang
    const checkedBoxes = document.querySelectorAll('#mahasiswaContainer input[type="checkbox"]:checked');
    const mahasiswaTerpilih = Array.from(checkedBoxes).map(cb => cb.value);

    if (mahasiswaTerpilih.length === 0) {
        alert('Anda harus memilih minimal 1 mahasiswa untuk kelas ini!');
        return;
    }

    // 1. Tampilkan animasi loading & Nonaktifkan tombol
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Menyimpan Data...';
    btn.disabled = true;

    const data = {
        action: 'tambah_matakuliah',
        kode_mk: document.getElementById('mk_kode').value,
        nama_mk: document.getElementById('mk_nama').value,
        sks: document.getElementById('mk_sks').value,
        semester: document.getElementById('mk_semester').value,
        id_dosen: session.id_dosen,
        mahasiswa_terpilih: mahasiswaTerpilih
    };
    
    try {
        const res = await fetch(CONFIG.API_URL, { method: 'POST', body: JSON.stringify(data) });
        const result = await res.json();
        
        if(result.status === 'success') {
            alert(result.message);
            // Sukses: reload halaman agar kartu baru muncul. (Tidak perlu mengembalikan tombol karena page berganti)
            location.reload(); 
        } else {
            alert('Gagal: ' + result.message);
            // 2. Jika gagal, kembalikan tombol ke semula agar bisa klik lagi
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    } catch (error) {
        console.error("Error simpan matkul:", error);
        alert('Terjadi kesalahan jaringan.');
        // 3. Jika error jaringan, kembalikan tombol ke semula
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
});

// =========================================================
// Logic Simpan Pertemuan (Dengan Animasi Loading & Anti-Double Click)
// =========================================================
document.getElementById('formTambahPertemuan').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const btn = this.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    const idKelas = this.dataset.idKelas;

    // 1. Tampilkan animasi loading & Nonaktifkan tombol
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Menyimpan Pertemuan...';
    btn.disabled = true;

    const data = {
        action: 'tambah_pertemuan',
        id_kelas: idKelas,
        tanggal: document.getElementById('pt_tanggal').value,
        jam_mulai: document.getElementById('pt_jam_mulai').value,
        jam_selesai: document.getElementById('pt_jam_selesai').value,
        judul_materi: document.getElementById('pt_judul').value,
        ruang_atau_link: document.getElementById('pt_link').value
    };

    try {
        const res = await fetch(CONFIG.API_URL, { method: 'POST', body: JSON.stringify(data) });
        const result = await res.json();
        
        if(result.status === 'success') {
            alert('Pertemuan berhasil ditambahkan!');
            tutupModal('modalTambahPertemuan');
            // Sukses: reload halaman agar daftar pertemuan terbaru muncul
            location.reload();
        } else {
            alert('Gagal: ' + result.message);
            // 2. Jika gagal, kembalikan tombol
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    } catch (error) {
        console.error("Error simpan pertemuan:", error);
        alert('Terjadi kesalahan jaringan.');
        // 3. Jika error, kembalikan tombol
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
});
