// js/nilai.js - Logika Frontend Nilai Mahasiswa
// ✅ Skema: 6 Komponen
// Kehadiran 20% + Keaktifan 20% + Tugas 20% + Praktikum 20% + UTS 10% + UAS 10%
// ==========================================

document.addEventListener('DOMContentLoaded', async () => {
    // ==========================================
    // 1. VALIDASI SESI LOGIN
    // ==========================================
    const sessionData = localStorage.getItem('user_session') || localStorage.getItem('user');
    if (!sessionData) { 
        window.location.href = '../login.html'; 
        return; 
    }
    
    let user;
    try {
        user = JSON.parse(sessionData);
    } catch (e) {
        console.error('Session tidak valid:', e);
        window.location.href = '../login.html';
        return;
    }
    
    console.log(">>> User session:", user);

    // ==========================================
    // 2. FETCH DATA NILAI DARI SERVER
    // ==========================================
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
        if (!tbody) {
            console.error('Element tabelNilaiBody tidak ditemukan!');
            return;
        }
        tbody.innerHTML = '';
        
        // ==========================================
        // 3. HANDLE RESPONSE
        // ==========================================
        if (result.status === 'success' && result.data && result.data.length > 0) {
            let totalSKS = 0;
            let totalBobotSKS = 0;
            let totalMataKuliah = 0;
            let jumlahGradeE = 0;
            let totalNilaiAkhir = 0;

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
                totalNilaiAkhir += parseFloat(item.akhir) || 0;

                // Badge warna per grade
                let badgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
                if (g === 'A') badgeColor = 'bg-emerald-50 text-emerald-600 border-emerald-200';
                else if (g === 'B') badgeColor = 'bg-blue-50 text-blue-600 border-blue-200';
                else if (g === 'C') badgeColor = 'bg-amber-50 text-amber-600 border-amber-200';
                else if (g === 'D' || g === 'E') badgeColor = 'bg-red-50 text-red-600 border-red-200';

                // ✅ 6 komponen nilai
                const kehadiran = item.kehadiran || 0;
                const keaktifan = item.keaktifan || 0;
                const tugas = item.tugas || 0;
                const praktikum = item.praktikum || 0;
                const uts = item.uts || 0;
                const uas = item.uas || 0;

                tbody.innerHTML += `
                    <tr class="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td class="px-4 py-4 font-bold text-slate-800">${index + 1}</td>
                        <td class="px-4 py-4 font-medium text-slate-800">
                            <div class="font-bold text-sm">${item.nama_matkul || '-'}</div>
                            <div class="text-[10px] text-slate-400">${item.kode_matkul || '-'}</div>
                        </td>
                        <td class="px-4 py-4 text-center font-semibold text-slate-700">${item.sks || '-'}</td>
                        
                        <!-- ✅ 6 Kolom Nilai -->
                        <td class="px-3 py-4 text-center">
                            <span class="inline-block px-2 py-1 rounded font-semibold text-amber-700 bg-amber-50 text-xs">
                                ${kehadiran}
                            </span>
                        </td>
                        <td class="px-3 py-4 text-center">
                            <span class="inline-block px-2 py-1 rounded font-semibold text-orange-700 bg-orange-50 text-xs">
                                ${keaktifan}
                            </span>
                        </td>
                        <td class="px-3 py-4 text-center">
                            <span class="inline-block px-2 py-1 rounded font-semibold text-blue-700 bg-blue-50 text-xs">
                                ${tugas}
                            </span>
                        </td>
                        <td class="px-3 py-4 text-center">
                            <span class="inline-block px-2 py-1 rounded font-semibold text-purple-700 bg-purple-50 text-xs">
                                ${praktikum}
                            </span>
                        </td>
                        <td class="px-3 py-4 text-center">
                            <span class="inline-block px-2 py-1 rounded font-semibold text-cyan-700 bg-cyan-50 text-xs">
                                ${uts}
                            </span>
                        </td>
                        <td class="px-3 py-4 text-center">
                            <span class="inline-block px-2 py-1 rounded font-semibold text-rose-700 bg-rose-50 text-xs">
                                ${uas}
                            </span>
                        </td>
                        
                        <!-- Nilai Akhir -->
                        <td class="px-4 py-4 text-center">
                            <span class="inline-block px-3 py-1 rounded font-bold text-teal-700 bg-teal-100">
                                ${item.akhir || 0}
                            </span>
                        </td>
                        
                        <!-- Grade -->
                        <td class="px-4 py-4 text-center">
                            <span class="px-3 py-1 rounded-full text-xs font-bold border ${badgeColor}">
                                ${item.grade || '-'}
                            </span>
                        </td>
                    </tr>
                `;
            });

            // ==========================================
            // 4. HITUNG IPK
            // ==========================================
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
                
                // ✅ Update total MK label
                const totalMkLabel = document.getElementById('totalMkLabel');
                if (totalMkLabel) {
                    totalMkLabel.innerText = totalMataKuliah;
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
            // ==========================================
            // 5. EMPTY STATE (Belum ada nilai)
            // ==========================================
            tbody.innerHTML = `
                <tr>
                    <td colspan="11" class="text-center py-10 text-slate-400 italic">
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
            
            const ipkInfo = document.getElementById('ipkInfo');
            if (ipkInfo) {
                ipkInfo.innerText = 'Belum ada nilai';
            }
            
            const totalMkLabel = document.getElementById('totalMkLabel');
            if (totalMkLabel) {
                totalMkLabel.innerText = '0';
            }
        }
    } catch (err) {
        // ==========================================
        // 6. ERROR HANDLING
        // ==========================================
        console.error("Error load nilai:", err);
        const tbody = document.getElementById('tabelNilaiBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="11" class="text-center py-10 text-red-400">
                        <i class="fa-solid fa-circle-exclamation text-3xl mb-2 block"></i>
                        <p class="font-bold">Gagal memuat data nilai dari server.</p>
                        <p class="text-xs mt-1">${err.message}</p>
                        <button onclick="location.reload()" class="mt-3 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-semibold transition">
                            <i class="fa-solid fa-rotate mr-1"></i> Coba Lagi
                        </button>
                    </td>
                </tr>
            `;
        }
    }
});

// ==========================================
// 7. HELPER: FORMAT ANGKA (Opsional)
// ==========================================
function formatNilai(nilai) {
    if (nilai === null || nilai === undefined || nilai === '') return '0';
    const num = parseFloat(nilai);
    if (isNaN(num)) return '0';
    return Math.round(num * 100) / 100;
}
