// js/tugas.js - Menampilkan Daftar Tugas

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
                const card = document.createElement('div');
                card.className = "bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow";
                
                card.innerHTML = `
                    <div>
                        <div class="flex justify-between items-start mb-3">
                            <span class="bg-orange-50 text-orange-600 text-[10px] font-bold px-2 py-1 rounded border border-orange-100 uppercase tracking-wider">
                                <i class="fa-regular fa-clock mr-1"></i> Tenggat: ${item.tenggat_waktu}
                            </span>
                        </div>
                        <h3 class="text-base font-bold text-slate-800 mb-1">${item.judul_tugas}</h3>
                        <p class="text-xs text-indigo-600 font-semibold mb-3">${item.mata_kuliah}</p>
                        <p class="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">${item.deskripsi}</p>
                    </div>
                    <button class="w-full bg-slate-50 hover:bg-indigo-500 text-slate-600 hover:text-white border border-slate-200 hover:border-indigo-500 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center">
                        <i class="fa-solid fa-upload mr-1.5"></i> Kumpulkan Tugas
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
