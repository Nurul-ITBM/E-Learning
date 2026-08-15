// js/matakuliah.js - Menarik dan menampilkan data Kelas Gabungan dengan 2 Tombol

document.addEventListener('DOMContentLoaded', async () => {
    const sessionData = localStorage.getItem('user_session');
    
    // 1. Cek apakah ada sesi login
    if (!sessionData) {
        window.location.href = '../login.html';
        return;
    }

    const user = JSON.parse(sessionData);

    // 2. Logika Logout
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            localStorage.removeItem('user_session');
            window.location.href = '../login.html';
        });
    }

    // 3. Panggil data kelas mahasiswa
    // Pastikan user.id_mahasiswa ada (nilainya harus M001, dst berdasarkan template Excel)
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
        console.log('Loading kelas untuk ID:', id_user); // DEBUG
        
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            body: JSON.stringify({ 
                action: 'get_kelas_mahasiswa', 
                id_mahasiswa: id_user 
            })
        });

        console.log('Response Status:', response.status); // DEBUG
        
        const result = await response.json();
        console.log('API Response:', result); // DEBUG

        if (result.status === 'success') {
            container.innerHTML = ''; 
            
            if (!result.data || result.data.length === 0) {
                container.innerHTML = '<p class="text-slate-500 col-span-3 text-center py-10">Belum ada kelas yang didaftarkan pada KRS.</p>';
                return;
            }

            result.data.forEach(item => {
                
                // LOGIKA TOMBOL 1 (CEK ONLINE/OFFLINE BERDASARKAN KOLOM RUANGAN)
                // Jika kolom ruangan mengandung "http", kita anggap itu link Zoom/Gmeet
                let isOnline = item.ruangan && item.ruangan.toLowerCase().includes('http');
                let namaRuangan = isOnline ? "Kelas Online (Virtual)" : (item.ruangan || 'Ruangan Tidak Ditentukan');
                
                let tombolSatuHTML = '';
                if (isOnline) {
                    tombolSatuHTML = `
                        <button onclick="window.open('${item.ruangan}', '_blank')" class="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center">
                            <i class="fa-solid fa-video mr-1.5"></i> Masuk Zoom
                        </button>
                    `;
                } else {
                    tombolSatuHTML = `
                        <button disabled class="flex-1 bg-slate-100 text-slate-500 py-2 rounded-lg text-xs font-bold flex items-center justify-center cursor-not-allowed border border-slate-200">
                            <i class="fa-solid fa-building mr-1.5"></i> Kelas Offline
                        </button>
                    `;
                }

                // PEMBUATAN KARTU
                const card = document.createElement('div');
                card.className = "bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all flex flex-col justify-between";
                
                card.innerHTML = `
                    <div>
                        <!-- Header Kartu: Semester & Kode -->
                        <div class="flex justify-between items-start mb-3">
                            <span class="bg-indigo-50 text-indigo-600 text-xs font-bold px-2.5 py-1 rounded-md border border-indigo-100">Semester ${item.semester || '-'}</span>
                            <span class="text-xs font-semibold text-slate-400">${item.kode_mk || '-'} - ${item.sks || '-'} SKS</span>
                        </div>
                        
                        <!-- Nama Mata Kuliah -->
                        <h3 class="text-lg font-bold text-slate-800 leading-tight mb-1">${item.mata_kuliah || 'Mata Kuliah'}</h3>
                        <p class="text-sm text-slate-500 mb-4 flex items-center"><i class="fa-solid fa-chalkboard-user mr-2 text-slate-400"></i> ${item.dosen_pengampu || 'Dosen Tidak Ditentukan'}</p>
                        
                        <!-- Info Jadwal & Ruangan -->
                        <div class="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2">
                            <div class="flex items-center text-xs text-slate-600 font-medium">
                                <i class="fa-regular fa-clock w-5 text-blue-500"></i>
                                <span>${item.hari || '-'}, ${item.jam || '-'}</span>
                            </div>
                            <div class="flex items-center text-xs text-slate-600 font-medium">
                                <i class="fa-solid fa-location-dot w-5 text-red-500"></i>
                                <span>${namaRuangan}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- DUA TOMBOL AKSI -->
                    <div class="mt-5 flex space-x-3">
                        <!-- Tombol 1: Zoom / Offline -->
                        ${tombolSatuHTML}
                        
                        <!-- Tombol 2: Lihat Materi -->
                        <button onclick="bukaModalDetail('${item.id_kelas}', '${item.mata_kuliah}')" class="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center">
                            <i class="fa-solid fa-folder-open mr-1.5"></i> Lihat Materi
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

// --- FUNGSI MODAL DETAIL PERTEMUAN ---

// 1. Membuka Modal dan Memuat Data
async function bukaModalDetail(id_kelas, nama_matkul) {
    const modal = document.getElementById('modalDetailKelas');
    const judul = document.getElementById('modalJudulKelas');
    const container = document.getElementById('modalContainerPertemuan');

    // Reset dan tampilkan loading
    judul.innerText = nama_matkul;
    container.innerHTML = `
        <div class="text-center py-10 text-slate-400">
            <i class="fa-solid fa-circle-notch fa-spin text-2xl mb-2"></i>
            <p>Memuat jadwal pertemuan...</p>
        </div>
    `;
    modal.classList.remove('hidden');

    // Fetch data dari backend
    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            body: JSON.stringify({ 
                action: 'get_jadwal_pertemuan', // Pastikan fungsi ini ada di Apps Script Anda
                id_kelas: id_kelas 
            })
        });
        const result = await response.json();

        if (result.status === 'success' && result.data.length > 0) {
            let html = '';
            result.data.forEach(pert => {
                const isOnline = pert.ruang_atau_link && pert.ruang_atau_link.toLowerCase().includes('http');
                html += `
                    <div class="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow">
                        <div>
                            <div class="flex items-center gap-3 mb-1">
                                <span class="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded-full">Pertemuan ke-${pert.pertemuan_ke}</span>
                                <span class="text-sm text-slate-500">${pert.tanggal}</span>
                            </div>
                            <p class="text-sm font-semibold text-slate-700">Jenis: ${pert.jenis_kuliah}</p>
                        </div>
                        <div>
                            ${isOnline ? 
                                `<a href="${pert.ruang_atau_link}" target="_blank" class="inline-block bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold"><i class="fa-solid fa-video mr-2"></i> Masuk Zoom</a>` 
                                : 
                                `<span class="text-slate-400 text-sm bg-slate-100 px-4 py-2 rounded-lg">${pert.ruang_atau_link || 'Kelas Offline'}</span>`
                            }
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

// 2. Menutup Modal
function tutupModalDetail() {
    const modal = document.getElementById('modalDetailKelas');
    modal.classList.add('hidden');
    // Bersihkan konten agar tidak menumpuk saat dibuka kembali
    document.getElementById('modalContainerPertemuan').innerHTML = '';
}

