// js/nilai.js

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Validasi Sesi Login
    const sessionData = localStorage.getItem('user_session');
    if (!sessionData) { 
        window.location.href = '../login.html'; 
        return; 
    }
    
    const user = JSON.parse(sessionData);
    const namaUser = user.username ? user.username.split('@')[0] : 'Mahasiswa';
    document.getElementById('userNameDisplay').innerText = namaUser;

    // 2. Fetch Data Nilai dari Server (Google Apps Script)
    try {
        const res = await fetch(CONFIG.API_URL, {
            method: 'POST',
            body: JSON.stringify({ 
                action: 'get_nilai', 
                id_mahasiswa: user.id_mahasiswa 
            })
        });
        const result = await res.json();
        
        const tbody = document.getElementById('tabelNilaiBody');
        tbody.innerHTML = '';
        
        if (result.status === 'success' && result.data.length > 0) {
            let totalSKS = 0;
            let totalBobotSKS = 0;

            result.data.forEach((item, index) => {
                const sks = parseInt(item.sks) || 0;
                totalSKS += sks;

                // Konversi Grade ke Angka Mutu (A=4, B=3, C=2, D=1, E=0)
                let bobot = 0;
                const g = String(item.grade).toUpperCase();
                if (g === 'A') bobot = 4;
                else if (g === 'B') bobot = 3;
                else if (g === 'C') bobot = 2;
                else if (g === 'D') bobot = 1;

                totalBobotSKS += (sks * bobot);

                let badgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
                if (g === 'A') badgeColor = 'bg-emerald-50 text-emerald-600 border-emerald-200';
                else if (g === 'B') badgeColor = 'bg-blue-50 text-blue-600 border-blue-200';
                else if (g === 'C') badgeColor = 'bg-amber-50 text-amber-600 border-amber-200';
                else if (g === 'D' || g === 'E') badgeColor = 'bg-red-50 text-red-600 border-red-200';

                tbody.innerHTML += `
                    <tr class="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td class="px-6 py-4 font-bold text-slate-800">${index + 1}</td>
                        <td class="px-6 py-4 font-medium text-slate-800">${item.nama_matkul}</td>
                        <td class="px-6 py-4 text-center">${item.sks}</td>
                        <td class="px-6 py-4 text-center">${item.tugas}</td>
                        <td class="px-6 py-4 text-center">${item.uts}</td>
                        <td class="px-6 py-4 text-center">${item.uas}</td>
                        <td class="px-6 py-4 text-center font-bold text-slate-700">${item.akhir}</td>
                        <td class="px-6 py-4 text-center">
                            <span class="px-3 py-1 rounded-full text-xs font-bold border ${badgeColor}">${item.grade}</span>
                        </td>
                    </tr>
                `;
            });

            // Hitung dan tampilkan IPK / IPS ringkas jika diperlukan
            if (totalSKS > 0) {
                const ipk = (totalBobotSKS / totalSKS).toFixed(2);
                const ipkDisplay = document.getElementById('ipkDisplay');
                if (ipkDisplay) ipkDisplay.innerText = ipk;
            }

        } else {
            tbody.innerHTML = `<tr><td colspan="8" class="text-center py-10 text-slate-400 italic">Belum ada data nilai akademik.</td></tr>`;
        }
    } catch (err) {
        console.error(err);
        document.getElementById('tabelNilaiBody').innerHTML = `<tr><td colspan="8" class="text-center py-10 text-red-400">Gagal memuat data nilai dari server.</td></tr>`;
    }

    // 3. Tombol Logout
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            localStorage.removeItem('user_session');
            window.location.href = '../login.html';
        });
    }
});
