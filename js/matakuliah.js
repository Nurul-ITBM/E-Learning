// js/matakuliah.js - Menarik dan menampilkan data Kelas Gabungan

document.addEventListener('DOMContentLoaded', async () => {
    const sessionData = localStorage.getItem('user_session');
    if (!sessionData) {
        window.location.href = '../login.html';
        return;
    }
    const user = JSON.parse(sessionData);
    
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            localStorage.removeItem('user_session');
            window.location.href = '../login.html';
        });
    }
    
    if (user.id_mahasiswa) {
        await loadKelasGabungan(user.id_mahasiswa);
    } else {
        const container = document.getElementById('containerMataKuliah');
        if (container) container.innerHTML = '<p class="text-red-500 col-span-3 text-center py-10">Error: ID Mahasiswa tidak ditemukan di sesi Anda. Silakan login ulang.</p>';
    }
});

async function loadKelasGabungan(id_user) {
    const container = document.getElementById('containerMataKuliah');
    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'get_kelas_mahasiswa', id_mahasiswa: id_user })
        });
        const result = await response.json();

        if (result.status === 'success') {
            container.innerHTML = ''; 
            if (!result.data || result.data.length === 0) {
                container.innerHTML = '<p class="text-slate-500 col-span-3 text-center py-10">Belum ada kelas yang didaftarkan pada KRS.</p>';
                return;
            }

            result.data.forEach(item => {
                const card = document.createElement('div');
                card.className = "bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all flex flex-col justify-between";
                
                // KARTU UTAMA BARU: Hapus Jam & Ruangan, tambahkan Total Pertemuan
                card.innerHTML = `
                    <div>
                        <div class="flex justify-between items-start mb-3">
                            <span class="bg-indigo-50 text-indigo-600 text-xs font-bold px-2.5 py-1 rounded-md border border-indigo-100">Semester ${item.semester || '-'}</span>
                            <span class="text-xs font-semibold text-slate-400">${item.kode_mk || '-'} - ${item.sks || '-'} SKS</span>
                        </div>
                        
                        <h3 class="text-lg font-bold text-slate-800 leading-tight mb-1">${item.mata_kuliah || 'Mata Kuliah'}</h3>
                        <p class="text-sm text-slate-500 mb-4 flex items-center"><i class="fa-solid fa-chalkboard-user mr-2 text-slate-400"></i> ${item.dosen_pengampu || 'Dosen Tidak Ditentukan'}</p>
                        
                        <div class="bg-indigo-50 p-3 rounded-lg border border-indigo-100 flex items-center justify-between">
                            <span class="text-xs font-bold text-indigo-700"><i class="fa-solid fa-list-check mr-2"></i> Rekap Kelas</span>
                            <span class="text-xs font-bold text-indigo-700 bg-white px-3 py-1 rounded-full border border-indigo-200">${item.total_pertemuan || 0} Pertemuan</span>
                        </div>
                    </div>
                    
                    <!-- SATU TOMBOL SAJA: Lihat Kelas -->
                    <div class="mt-5">
                        <button onclick="bukaModalDetail('${item.id_kelas}', '${item.mata_kuliah}')" class="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-2.5 rounded-lg text-xs font-bold transition-colors flex items-center justify-center shadow-sm">
                            <i class="fa-solid fa-door-open mr-1.5"></i> Lihat Kelas
                        </button>
                    </div>
                `;
                container.appendChild(card);
            });
        } else {
            container.innerHTML = `<p class="text-red-500 col-span-3 text-center py-10">Error: ${result.message || 'Data tidak dapat dimuat'}</p>`;
        }
    } catch (error) {
        console.error('Error loading kelas:', error); // DEBUG
        container.innerHTML = `<p class="text-red-500 col-span-3 text-center py-10">❌ Gagal terhubung ke server.<br><small>${error.message}</small></p>`;
    }
}

// --- FUNGSI MODAL DETAIL PERTEMUAN (VERSI TERBARU) ---

// === PERBAIKAN 1: Ganti fungsi formatJam menjadi aman ===
function formatJam(isoString) {
    // Jika string kosong, null, atau undefined, langsung return kosong
    if (!isoString || typeof isoString !== 'string') return '';
    
    // Jika sudah berupa "08:00" (tanpa tanggal), langsung kembalikan
    if (!isoString.includes('T')) return isoString;

    // Potong string ISO (misal: "1899-12-30T16:00:00.000Z" menjadi "16:00")
    const parts = isoString.split('T');
    if (parts.length < 2) return '';
    return parts[1].slice(0, 5);
}

async function bukaModalDetail(id_kelas, nama_matkul) {
    const modal = document.getElementById('modalDetailKelas');
    const judul = document.getElementById('modalJudulKelas');
    const container = document.getElementById('modalContainerPertemuan');

    judul.innerText = nama_matkul;
    container.innerHTML = `
        <div class="text-center py-10 text-slate-400">
            <i class="fa-solid fa-circle-notch fa-spin text-2xl mb-2"></i>
            <p>Memuat jadwal pertemuan...</p>
        </div>
    `;
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
            let html = '';
            result.data.forEach(pert => {
                const isOnline = pert.ruang_atau_link && pert.ruang_atau_link.toLowerCase().includes('http');
                
                const judulMateri = pert.judul_materi && pert.judul_materi.toString().trim() !== '' 
                                    ? pert.judul_materi 
                                    : 'Judul Materi (Belum diisi)';

                // 2. Gunakan formatJam() untuk membersihkan string jam
                let jamTampil = '';
                if (pert.jam_mulai && pert.jam_selesai) {
                    const jamMulai = formatJam(pert.jam_mulai);
                    const jamSelesai = formatJam(pert.jam_selesai);
                    jamTampil = ` · ${jamMulai} - ${jamSelesai}`;
                }

                html += `
                    <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div class="flex-1">
                            <!-- Tanggal & Jam (Sekarang bersih!) -->
                            <div class="flex flex-wrap items-center gap-2 mb-1">
                                <span class="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded-full">Pertemuan ke-${pert.pertemuan_ke}</span>
                                <span class="text-sm text-slate-700 font-medium">
                                    ${formatTanggal(pert.tanggal)}${jamTampil}
                                </span>
                            </div>
                            
                            <!-- Judul Materi -->
                            <p class="text-sm font-bold text-slate-800 mb-1">${judulMateri}</p>
                            
                            <!-- Jenis Kuliah -->
                            <p class="text-sm text-slate-500">Jenis: <span class="font-semibold text-slate-700">${pert.jenis_kuliah || 'Belum ditentukan'}</span></p>
                        </div>
                        
                        <!-- Tombol Aksi Kanan -->
                        <div class="flex flex-col md:flex-row items-start md:items-center gap-2 w-full md:w-auto">
                            ${isOnline ? 
                                `<a href="${pert.ruang_atau_link}" target="_blank" class="w-full md:w-auto bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold text-center"><i class="fa-solid fa-video mr-2"></i> Masuk Zoom</a>` 
                                : 
                                `<span class="w-full md:w-auto text-slate-500 text-sm bg-slate-100 px-4 py-2 rounded-lg text-center border border-slate-200"><i class="fa-solid fa-building mr-2"></i> Offline</span>`
                            }
                            <button onclick="alert('Fitur Lihat Materi per pertemuan belum diatur')" class="w-full md:w-auto bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 px-4 py-2 rounded-lg text-sm font-bold text-center">
                                <i class="fa-regular fa-folder-open mr-1.5"></i> Lihat Materi
                            </button>
                        </div>
                    </div>
                `;
            });
            container.innerHTML = html;
        } else {
            container.innerHTML = `<p class="text-center text-slate-500 py-10">Belum ada data pertemuan untuk kelas ini.</p>`;
        }
    } catch (error) {
        console.error(error);
        container.innerHTML = `<p class="text-center text-red-500 py-10">Gagal memuat data pertemuan.</p>`;
    }
}

// 3. Menutup Modal
function tutupModalDetail() {
    const modal = document.getElementById('modalDetailKelas');
    modal.classList.add('hidden');
    document.getElementById('modalContainerPertemuan').innerHTML = '';
}
