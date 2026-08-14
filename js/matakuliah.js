// js/matakuliah.js - Menarik dan menampilkan data dari Sheet MataKuliah

document.addEventListener('DOMContentLoaded', async () => {
    const sessionData = localStorage.getItem('user_session');
    if (!sessionData) {
        window.location.href = '../login.html';
        return;
    }

    const user = JSON.parse(sessionData);
    
    // Tampilkan Nama User di Header
    const namaAwal = user.username.split('@')[0];
    const CapitalizedName = namaAwal.charAt(0).toUpperCase() + namaAwal.slice(1);
    if(document.getElementById('userNameDisplay')) document.getElementById('userNameDisplay').innerText = CapitalizedName;

    // Logout
    document.getElementById('btnLogout').addEventListener('click', () => {
        localStorage.removeItem('user_session');
        window.location.href = '../login.html';
    });

    // Panggil fungsi untuk mengambil data mata kuliah
    await loadMataKuliah();
});

async function loadMataKuliah() {
    const container = document.getElementById('containerMataKuliah');
    
    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'get_mata_kuliah' })
        });

        const result = await response.json();

        if (result.status === 'success') {
            container.innerHTML = ''; // Kosongkan animasi loading
            
            // Looping data dari Google Sheets
            result.data.forEach(mk => {
                // Membuat elemen kartu HTML untuk tiap mata kuliah
                const card = document.createElement('div');
                card.className = "bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow flex flex-col justify-between";
                
                card.innerHTML = `
                    <div>
                        <div class="flex justify-between items-start mb-4">
                            <div class="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl">
                                <i class="fa-solid fa-book-bookmark"></i>
                            </div>
                            <span class="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded">Semester ${mk.semester}</span>
                        </div>
                        <h3 class="text-lg font-bold text-slate-800 mb-1">${mk.nama_mk}</h3>
                        <p class="text-sm text-slate-500 font-medium">Kode: ${mk.kode_mk}</p>
                    </div>
                    
                    <div class="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
                        <div class="flex items-center space-x-2">
                            <i class="fa-solid fa-layer-group text-slate-400 text-sm"></i>
                            <span class="text-sm font-semibold text-slate-700">${mk.sks} SKS</span>
                        </div>
                        <button class="text-indigo-600 hover:text-white border border-indigo-600 hover:bg-indigo-600 px-4 py-1.5 rounded-lg text-xs font-bold transition-colors">
                            Lihat Modul
                        </button>
                    </div>
                `;
                container.appendChild(card);
            });
        } else {
            container.innerHTML = `<p class="text-red-500 col-span-3 text-center py-10"><i class="fa-solid fa-triangle-exclamation mr-2"></i> ${result.message}</p>`;
        }
    } catch (error) {
        container.innerHTML = `<p class="text-red-500 col-span-3 text-center py-10"><i class="fa-solid fa-triangle-exclamation mr-2"></i> Gagal terhubung ke server.</p>`;
    }
}
