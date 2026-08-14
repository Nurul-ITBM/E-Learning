// js/matakuliah.js - Menarik dan menampilkan data Kelas Gabungan dengan 2 Tombol

document.addEventListener('DOMContentLoaded', async () => {
    const sessionData = localStorage.getItem('user_session');
    if (!sessionData) {
        window.location.href = '../login.html';
        return;
    }

    const user = JSON.parse(sessionData);
    const namaAwal = user.username.split('@')[0];
    const CapitalizedName = namaAwal.charAt(0).toUpperCase() + namaAwal.slice(1);
    if(document.getElementById('userNameDisplay')) document.getElementById('userNameDisplay').innerText = CapitalizedName;

    document.getElementById('btnLogout').addEventListener('click', () => {
        localStorage.removeItem('user_session');
        window.location.href = '../login.html';
    });

    await loadKelasGabungan(user.id_user);
});

async function loadKelasGabungan(id_user) {
    const container = document.getElementById('containerMataKuliah');
    
    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            body: JSON.stringify({ 
                action: 'get_kelas_mahasiswa', 
                id_mahasiswa: id_user 
            })
        });

        const result = await response.json();

        if (result.status === 'success') {
            container.innerHTML = ''; 
            
            if (result.data.length === 0) {
                container.innerHTML = '<p class="text-slate-500 col-span-3 text-center py-10">Belum ada kelas yang didaftarkan pada KRS.</p>';
                return;
            }

            result.data.forEach(item => {
                
                // LOGIKA TOMBOL 1 (CEK ONLINE/OFFLINE BERDASARKAN KOLOM RUANGAN)
                // Jika kolom ruangan mengandung "http", kita anggap itu link Zoom/Gmeet
                let isOnline = item.ruangan.toLowerCase().includes('http');
                let namaRuangan = isOnline ? "Kelas Online (Virtual)" : item.ruangan;
                
                let tombolSatuHTML = '';
                if (isOnline) {
                    tombolSatuHTML = `
                        <button onclick="window.open('${item.ruangan}', '_blank')" class="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center shadow-sm">
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
                            <span class="bg-indigo-50 text-indigo-600 text-xs font-bold px-2.5 py-1 rounded-md border border-indigo-100">Semester ${item.semester}</span>
                            <span class="text-xs font-semibold text-slate-400">${item.kode_mk} - ${item.sks} SKS</span>
                        </div>
                        
                        <!-- Nama Mata Kuliah -->
                        <h3 class="text-lg font-bold text-slate-800 leading-tight mb-1">${item.mata_kuliah}</h3>
                        <p class="text-sm text-slate-500 mb-4 flex items-center"><i class="fa-solid fa-chalkboard-user mr-2 text-slate-400"></i> ${item.dosen_pengampu}</p>
                        
                        <!-- Info Jadwal & Ruangan -->
                        <div class="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2">
                            <div class="flex items-center text-xs text-slate-600 font-medium">
                                <i class="fa-regular fa-clock w-5 text-blue-500"></i>
                                <span>${item.hari}, ${item.jam}</span>
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
                        <button onclick="window.location.href='detail_kelas.html?id_kelas=${item.id_kelas}&tab=materi'" class="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center shadow-sm">
                            <i class="fa-solid fa-folder-open mr-1.5"></i> Lihat Materi
                        </button>
                    </div>
                `;
                container.appendChild(card);
            });
        } else {
            container.innerHTML = `<p class="text-red-500 col-span-3 text-center py-10">${result.message}</p>`;
        }
    } catch (error) {
        container.innerHTML = `<p class="text-red-500 col-span-3 text-center py-10">Gagal terhubung ke server. Pastikan Anda sudah deploy ulang Apps Script.</p>`;
    }
}
