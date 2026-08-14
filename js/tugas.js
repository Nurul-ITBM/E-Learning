// js/tugas.js - Menampilkan Daftar Tugas & Status Upload & Nilai

document.addEventListener('DOMContentLoaded', async () => {
    const sessionData = localStorage.getItem('user_session');
    if (!sessionData) {
        window.location.href = '../login.html';
        return;
    }

    const user = JSON.parse(sessionData);
    const namaAwal = user.username.split('@')[0];
    document.getElementById('userNameDisplay').innerText = namaAwal.charAt(0).toUpperCase() + namaAwal.slice(1);

    document.getElementById('btnLogout').addEventListener('click', () => {
        localStorage.removeItem('user_session');
        window.location.href = '../login.html';
    });

    await loadTugas(user.id_user);
});

async function loadTugas(id_user) {
    const container = document.getElementById('containerTugas');
    
    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'get_tugas', id_mahasiswa: id_user })
        });

        const result = await response.json();

        if (result.status === 'success') {
            container.innerHTML = ''; 
            
            if (result.data.length === 0) {
                container.innerHTML = '<div class="col-span-full text-center py-10 text-slate-500">Hore! Tidak ada tugas yang tertunda.</div>';
                return;
            }

            result.data.forEach(item => {
                
                let tombolLampiran = '';
                if (item.link_lampiran && item.link_lampiran.trim() !== '') {
                    tombolLampiran = `
                        <button onclick="window.open('${item.link_lampiran}', '_blank')" class="text-xs text-indigo-600 hover:text-indigo-800 font-semibold mt-2 flex items-center">
                            <i class="fa-solid fa-paperclip mr-1"></i> File Lampiran Dosen
                        </button>
                    `;
                }

                let statusUploadHTML = '';
                let nilaiHTML = '';
                let btnUploadText = '<i class="fa-solid fa-upload mr-1.5"></i> Kumpulkan Tugas';
                let btnUploadClass = 'bg-slate-50 hover:bg-indigo-500 text-slate-600 hover:text-white border border-slate-200 hover:border-indigo-500';
                
                if (item.sudah_kumpul) {
                    // Cek apakah sudah dinilai
                    if (item.nilai && item.nilai.toString().trim() !== '') {
                        // Jika sudah dinilai, tidak bisa upload ulang
                        btnUploadText = '<i class="fa-solid fa-lock mr-1.5"></i> Tugas Sudah Dinilai';
                        btnUploadClass = 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed';
                        
                        nilaiHTML = `
                            <div class="mt-2 p-2 bg-indigo-50 border border-indigo-100 rounded-lg">
                                <div class="flex justify-between items-center border-b border-indigo-100 pb-1 mb-1">
                                    <span class="text-[10px] font-bold text-indigo-800 uppercase tracking-wider">Nilai Anda:</span>
                                    <span class="text-sm font-black text-indigo-600">${item.nilai}/100</span>
                                </div>
                                <p class="text-[10px] text-indigo-600 italic">"${item.komentar_dosen || 'Tidak ada catatan dosen'}"</p>
                            </div>
                        `;
                    } else {
                        // Belum dinilai, masih bisa ditimpa
                        btnUploadText = '<i class="fa-solid fa-rotate mr-1.5"></i> Upload Ulang / Timpa';
                        btnUploadClass = 'bg-white hover:bg-orange-50 text-orange-500 hover:text-orange-600 border border-orange-200';
                    }

                    statusUploadHTML = `
                        <div class="mt-3 mb-2 p-2.5 bg-green-50 border border-green-200 rounded-lg flex flex-col space-y-1">
                            <div class="flex items-center">
                                <i class="fa-solid fa-circle-check text-green-500 mr-2 text-sm"></i>
                                <span class="text-xs font-semibold text-green-700 truncate w-40" title="${item.nama_file}">${item.nama_file}</span>
                            </div>
                            <span class="text-[9px] text-green-600 ml-5">Dikumpul: ${item.waktu_kumpul}</span>
                        </div>
                        ${nilaiHTML}
                    `;
                }

                const card = document.createElement('div');
                card.className = "bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden";
                
                card.innerHTML = `
                    <div>
                        <div class="flex justify-between items-start mb-3">
                            <span class="bg-orange-50 text-orange-600 text-[10px] font-bold px-2 py-1 rounded border border-orange-100 uppercase tracking-wider">
                                <i class="fa-regular fa-clock mr-1"></i> Tenggat: ${item.tenggat_waktu}
                            </span>
                            <span class="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded">Bobot: ${item.bobot_nilai}</span>
                        </div>
                        <h3 class="text-base font-bold text-slate-800 mb-1">${item.judul_tugas}</h3>
                        <p class="text-xs text-indigo-600 font-semibold mb-3">${item.mata_kuliah}</p>
                        
                        <p class="text-xs text-slate-500 line-clamp-3 leading-relaxed mb-1">${item.deskripsi_instruksi}</p>
                        
                        ${tombolLampiran}
                        ${statusUploadHTML}
                    </div>
                    
                    <button class="w-full mt-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center ${btnUploadClass}">
                        ${btnUploadText}
                    </button>
                `;
                container.appendChild(card);
            });
        } else {
            container.innerHTML = `<p class="text-red-500 col-span-full text-center py-10">${result.message}</p>`;
        }
    } catch (error) {
        container.innerHTML = `<p class="text-red-500 col-span-full text-center py-10">Gagal terhubung ke server.</p>`;
    }
}
