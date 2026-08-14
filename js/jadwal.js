// js/jadwal.js - Menarik dan menampilkan data Jadwal

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

    document.getElementById('btnLogout').addEventListener('click', () => {
        localStorage.removeItem('user_session');
        window.location.href = '../login.html';
    });

    // Panggil fungsi mengambil jadwal
    await loadJadwal(user.id_user);
});

async function loadJadwal(id_user) {
    const container = document.getElementById('containerJadwal');
    
    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            body: JSON.stringify({ 
                action: 'get_kelas_mahasiswa',
                id_mahasiswa: id_user // API.gs menangkap ini lalu melemparnya ke Kelas.gs
            })
        });

        const result = await response.json();

        if (result.status === 'success') {
            container.innerHTML = ''; 
            
            if (result.data.length === 0) {
                container.innerHTML = '<p class="text-slate-500 col-span-2 text-center py-10">Belum ada jadwal kelas yang diambil.</p>';
                return;
            }

            result.data.forEach(kelas => {
                const card = document.createElement('div');
                card.className = "bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow flex flex-col justify-between";
                
                // Menentukan warna berdasarkan hari (untuk UI agar menarik)
                let color = "blue";
                if(kelas.hari === "Senin") color = "blue";
                else if(kelas.hari === "Selasa") color = "green";
                else if(kelas.hari === "Rabu") color = "purple";
                else if(kelas.hari === "Kamis") color = "orange";
                else color = "indigo";

                card.innerHTML = `
                    <div class="flex justify-between items-start mb-4 border-b border-slate-100 pb-4">
                        <div>
                            <span class="bg-${color}-50 text-${color}-600 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center inline-flex">
                                <i class="fa-regular fa-clock mr-1.5"></i> ${kelas.hari}, ${kelas.jam}
                            </span>
                        </div>
                        <span class="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded">${kelas.nama_kelas}</span>
                    </div>
                    <div>
                        <h3 class="text-lg font-bold text-slate-800 mb-1">${kelas.mata_kuliah}</h3>
                        <p class="text-sm text-slate-500 flex items-center"><i class="fa-solid fa-chalkboard-user mr-2 text-slate-400"></i> ${kelas.dosen_pengampu}</p>
                    </div>
                    
                    <div class="mt-6 pt-4 flex space-x-3">
                        <button class="flex-1 bg-${color}-500 hover:bg-${color}-600 text-white py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center">
                            <i class="fa-solid fa-video mr-1.5"></i> Masuk Kelas
                        </button>
                        <button class="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 py-2 rounded-lg text-xs font-bold transition-colors">
                            Lihat Modul
                        </button>
                    </div>
                `;
                container.appendChild(card);
            });
        } else {
            container.innerHTML = `<p class="text-red-500 col-span-2 text-center py-10"><i class="fa-solid fa-triangle-exclamation mr-2"></i> ${result.message}</p>`;
        }
    } catch (error) {
        container.innerHTML = `<p class="text-red-500 col-span-2 text-center py-10"><i class="fa-solid fa-triangle-exclamation mr-2"></i> Gagal terhubung ke server.</p>`;
    }
}
