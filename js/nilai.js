// ==========================================
// js/nilai.js - Logika Frontend Nilai Mahasiswa
// ==========================================

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Validasi Sesi Login
    const sessionData = localStorage.getItem('user_session');
    if (!sessionData) { 
        window.location.href = '../login.html'; 
        return; 
    }
    
    const user = JSON.parse(sessionData);
    console.log(">>> User session:", user);

    // 2. Fetch Data Nilai dari Server
    try {
        const res = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify({ 
                action: 'get_nilai', 
                id_mahasiswa: user.id_mahasiswa || user.id_user
            })
        });
        const result = await res.json();
        console.log(">>> Data nilai:", result);
        
        const tbody = document.getElementById('tabelNilaiBody');
        tbody.innerHTML = '';
        
        if (result.status === 'success' && result.data.length > 0) {
            let totalSKS = 0;
            let totalBobotSKS = 0;
            let totalMataKuliah = 0;
            let jumlahGradeE = 0;

            result.data.forEach((item, index) => {
                const sks = parseInt(item.sks) || 3; 
                
                // Konversi Grade ke Angka Mutu
                let bobot = 0;
                const g = String(item.grade || '').trim().toUpperCase();
                
                if (g === 'A') bobot = 4;
                else if (g === 'B') bobot = 3;
                else if (g === 'C') bobot = 2;
                else if (g === 'D') bobot = 1;
                else if (g === 'E') {
                    bobot = 0;
                    jumlahGradeE++;
                }

                totalSKS += sks;
                totalBobotSKS += (sks * bobot);
                totalMataKuliah++;

                let badgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
                if (g === 'A') badgeColor = 'bg-emerald-50 text-emerald-600 border-emerald-200';
                else if (g === 'B') badgeColor = 'bg-blue-50 text-blue-600 border-blue-200';
                else if (g === 'C') badgeColor = 'bg-amber-50 text-amber-600 border-amber-200';
                else if (g === 'D' || g === 'E') badgeColor = 'bg-red-50 text-red-600 border-red-200';

                tbody.innerHTML += `
                    <tr class="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td class="px-6 py-4 font-bold text-slate-800">${index + 1}</td>
                        <td class="px-6 py-4 font-medium text-slate-800">${item.nama_matkul || '-'}</td>
                        <td class="px-6 py-4 text-center">${item.sks || '-'}</td>
                        <td class="px-6 py-4 text-center">${item.tugas || 0}</td>
                        <td class="px-6 py-4 text-center">${item.uts || 0}</td>
                        <td class="px-6 py-4 text-center">${item.uas || 0}</td>
                        <td class="px-6 py-4 text-center">${item.kehadiran || 0}</td>
                        <td class="px-6 py-4 text-center font-bold text-slate-700">${item.akhir || 0}</td>
                        <td class="px-6 py-4 text-center">
                            <span class="px-3 py-1 rounded-full text-xs font-bold border ${badgeColor}">${item.grade || '-'}</span>
                        </td>
                    </tr>
                `;
            });

            // ✅ Hitung IPK
            console.log('>>> Total SKS:', totalSKS);
            console.log('>>> Total Bobot SKS:', totalBobotSKS);
            console.log('>>> Total MK:', totalMataKuliah);
            
            const ipkDisplay = document.getElementById('ipkDisplay');
            const ipkInfo = document.getElementById('ipkInfo');
            
            if (totalSKS > 0) {
                const ipk = (totalBobotSKS / totalSKS).toFixed(2);
                console.log('>>> IPK:', ipk);
                
                if (ipkDisplay) {
                    ipkDisplay.innerText = ipk;
                    
                    // Hapus class warna lama
                    ipkDisplay.classList.remove(
                        'text-indigo-600', 
                        'text-emerald-600', 
                        'text-blue-600',
                        'text-amber-600', 
                        'text-red-600',
                        'text-slate-400'
                    );
                    
                    // Beri warna berdasarkan IPK
                    const ipkNum = parseFloat(ipk);
                    if (ipkNum >= 3.5) {
                        ipkDisplay.classList.add('text-emerald-600');
                    } else if (ipkNum >= 3.0) {
                        ipkDisplay.classList.add('text-indigo-600');
                    } else if (ipkNum >= 2.5) {
                        ipkDisplay.classList.add('text-blue-600');
                    } else if (ipkNum >= 2.0) {
                        ipkDisplay.classList.add('text-amber-600');
                    } else {
                        ipkDisplay.classList.add('text-red-600');
                    }
                }
                
                // ✅ Info tambahan
                if (ipkInfo) {
                    ipkInfo.innerText = `${totalMataKuliah} MK • ${totalSKS} SKS`;
                }
                
                // ✅ Alert jika semua Grade E
                if (jumlahGradeE === totalMataKuliah && totalMataKuliah > 0) {
                    const alertContainer = document.getElementById('alertIpk');
                    if (alertContainer) {
                        alertContainer.classList.remove('hidden');
                        alertContainer.innerHTML = `
                            <div class="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-3">
                                <div class="bg-red-100 text-red-600 p-2 rounded-lg flex-shrink-0">
                                    <i class="fa-solid fa-triangle-exclamation"></i>
                                </div>
                                <div class="text-xs">
                                    <p class="font-bold text-red-700">IPK Anda 0.00</p>
                                    <p class="text-red-600 mt-0.5">Semua mata kuliah memiliki Grade E. Silakan mengulang mata kuliah untuk memperbaiki nilai.</p>
                                </div>
                            </div>
                        `;
                    }
                }
                
            } else {
                if (ipkDisplay) {
                    ipkDisplay.innerText = '-';
                    ipkDisplay.classList.add('text-slate-400');
                }
                if (ipkInfo) {
                    ipkInfo.innerText = 'Belum ada nilai';
                }
            }

        } else {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center py-10 text-slate-400 italic">
                        <i class="fa-regular fa-folder-open text-3xl mb-2 block"></i>
                        Belum ada data nilai akademik.
                    </td>
                </tr>
            `;
            
            const ipkDisplay = document.getElementById('ipkDisplay');
            if (ipkDisplay) {
                ipkDisplay.innerText = '-';
                ipkDisplay.classList.add('text-slate-400');
            }
        }
    } catch (err) {
        console.error("Error load nilai:", err);
        document.getElementById('tabelNilaiBody').innerHTML = `
            <tr>
                <td colspan="9" class="text-center py-10 text-red-400">
                    <i class="fa-solid fa-circle-exclamation text-3xl mb-2 block"></i>
                    Gagal memuat data nilai dari server.
                </td>
            </tr>
        `;
    }
});
