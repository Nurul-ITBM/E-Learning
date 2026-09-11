// ==========================================
// js/dosen-nilai.js - Logika Rekap Nilai Dosen
// Fitur: Filter Kelas, Tabel Nilai, Koreksi, Hitung Ulang, Export
// ==========================================

// ==========================================
// VARIABEL GLOBAL
// ==========================================
let currentIdKelas = null;
let currentRekapData = null;
let currentUser = null;

// ==========================================
// KONFIGURASI GRADE
// ==========================================
const GRADE_CONFIG = {
    'A': { class: 'grade-A', label: 'A' },
    'B': { class: 'grade-B', label: 'B' },
    'C': { class: 'grade-C', label: 'C' },
    'D': { class: 'grade-D', label: 'D' },
    'E': { class: 'grade-E', label: 'E' },
    '-': { class: 'grade-dash', label: '-' }
};

// ==========================================
// INISIALISASI
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Validasi Sesi
    const sessionData = localStorage.getItem('user_session');
    if (!sessionData) {
        window.location.href = '../login.html';
        return;
    }
    
    currentUser = JSON.parse(sessionData);
    console.log(">>> User session:", currentUser);

    // 2. Tunggu DOM siap
    await new Promise(resolve => setTimeout(resolve, 100));

    // 3. Cek elemen
    const filterKelas = document.getElementById('filterKelasNilai');
    const btnRefresh = document.getElementById('btnRefreshNilai');
    const btnHitungUlang = document.getElementById('btnHitungUlang');
    const btnExport = document.getElementById('btnExportNilai');
    
    if (!filterKelas || !btnRefresh || !btnHitungUlang || !btnExport) {
        console.error('❌ Elemen HTML tidak ditemukan!');
        return;
    }

    // 4. Load Dropdown Kelas
    if (currentUser.id_dosen) {
        await loadKelasDosen(currentUser.id_dosen);
    }

    // 5. Event Listener Dropdown
    filterKelas.addEventListener('change', async (e) => {
        currentIdKelas = e.target.value;
        
        if (!currentIdKelas) {
            document.getElementById('containerRekapNilai').innerHTML = `
                <div class="text-center py-16 text-slate-400">
                    <i class="fa-solid fa-square-poll-vertical text-5xl mb-4 block opacity-30"></i>
                    <p class="text-sm font-medium">Silakan pilih mata kuliah di dropdown atas untuk melihat rekap nilai.</p>
                </div>
            `;
            document.getElementById('infoCard').classList.add('hidden');
            document.getElementById('distribusiGrade').classList.add('hidden');
            btnRefresh.disabled = true;
            btnHitungUlang.disabled = true;
            btnExport.disabled = true;
            return;
        }
        
        await loadRekapNilai(currentIdKelas);
        btnRefresh.disabled = false;
        btnHitungUlang.disabled = false;
        btnExport.disabled = false;
    });

    // 6. Tombol Refresh
    btnRefresh.addEventListener('click', async () => {
        if (currentIdKelas) await loadRekapNilai(currentIdKelas);
    });

    // 7. Tombol Hitung Ulang
    btnHitungUlang.addEventListener('click', hitungUlangNilai);

    // 8. Tombol Export
    btnExport.addEventListener('click', exportCSV);
});

// ==========================================
// LOAD DROPDOWN KELAS DOSEN
// ==========================================
async function loadKelasDosen(idDosen) {
    const select = document.getElementById('filterKelasNilai');
    if (!select) return;

    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ 
                action: 'get_kelas_dosen_ujian', 
                id_dosen: idDosen 
            })
        });
        const result = await response.json();
        console.log(">>> Kelas dosen:", result);

        if (result.status === 'success') {
            select.innerHTML = '<option value="">-- Pilih Mata Kuliah --</option>';
            result.data.forEach(kelas => {
                const option = document.createElement('option');
                option.value = kelas.id_kelas;
                option.textContent = kelas.nama_kelas;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error load kelas:', error);
    }
}

// ==========================================
// LOAD REKAP NILAI KELAS
// ==========================================
async function loadRekapNilai(idKelas) {
    const container = document.getElementById('containerRekapNilai');
    container.innerHTML = `
        <div class="text-center py-16 text-slate-400">
            <i class="fa-solid fa-circle-notch fa-spin text-4xl mb-3 block"></i>
            <p class="text-sm">Memuat rekap nilai...</p>
        </div>
    `;

    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ 
                action: 'get_rekap_nilai_kelas', 
                id_kelas: idKelas 
            })
        });
        const result = await response.json();
        console.log(">>> Rekap nilai:", result);

        if (result.status === 'success' && result.data) {
            currentRekapData = result.data;
            renderInfoCard(result.data);
            renderDistribusiGrade(result.data);
            renderTabelNilai(result.data);
        } else {
            container.innerHTML = `
                <div class="text-center py-16 text-red-400">
                    <i class="fa-solid fa-circle-exclamation text-4xl mb-3 block"></i>
                    <p class="text-sm font-medium">${result.message || 'Gagal memuat data.'}</p>
                </div>
            `;
        }
    } catch (error) {
        console.error("Error load rekap nilai:", error);
        container.innerHTML = `
            <div class="text-center py-16 text-red-400">
                <i class="fa-solid fa-circle-exclamation text-4xl mb-3 block"></i>
                <p class="text-sm font-medium">Gagal terhubung ke server.</p>
            </div>
        `;
    }
}

// ==========================================
// RENDER INFO CARD
// ==========================================
function renderInfoCard(data) {
    document.getElementById('infoCard').classList.remove('hidden');
    
    const stat = data.statistik || {};
    document.getElementById('infoTotalMhs').innerText = stat.total_mahasiswa || 0;
    document.getElementById('infoRataNilai').innerText = stat.rata_nilai_akhir || 0;
    document.getElementById('infoSudahNilai').innerText = stat.sudah_ada_nilai || 0;
    document.getElementById('infoNilaiKurang').innerText = stat.mhs_kurang_60 || 0;
}

// ==========================================
// RENDER DISTRIBUSI GRADE
// ==========================================
function renderDistribusiGrade(data) {
    document.getElementById('distribusiGrade').classList.remove('hidden');
    
    const dist = (data.statistik || {}).distribusi_grade || {};
    document.getElementById('gradeA').innerText = dist['A'] || 0;
    document.getElementById('gradeB').innerText = dist['B'] || 0;
    document.getElementById('gradeC').innerText = dist['C'] || 0;
    document.getElementById('gradeD').innerText = dist['D'] || 0;
    document.getElementById('gradeE').innerText = dist['E'] || 0;
}

// ==========================================
// RENDER TABEL NILAI
// ==========================================
function renderTabelNilai(data) {
    const container = document.getElementById('containerRekapNilai');
    
    const kelas = data.kelas || {};
    const mahasiswa = data.mahasiswa || [];
    
    if (mahasiswa.length === 0) {
        container.innerHTML = `
            <div class="text-center py-16 text-slate-400">
                <i class="fa-regular fa-folder-open text-5xl mb-4 block opacity-30"></i>
                <p class="text-sm font-medium">Belum ada mahasiswa di kelas ini.</p>
            </div>
        `;
        return;
    }
    
    let html = `
        <div class="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
            <div>
                <h3 class="text-base font-bold text-slate-800">
                    <i class="fa-solid fa-table-cells text-teal-600 mr-2"></i>${kelas.nama_matkul || 'Mata Kuliah'}
                </h3>
                <p class="text-xs text-slate-500 mt-0.5">${kelas.nama_kelas || '-'} • ${kelas.sks || 0} SKS • ${mahasiswa.length} Mahasiswa</p>
            </div>
            <div class="text-xs text-slate-500">
                <i class="fa-solid fa-info-circle text-teal-500 mr-1"></i>Klik cell nilai untuk koreksi
            </div>
        </div>
        
        <div class="overflow-x-auto" style="max-height: 600px;">
            <table class="min-w-full text-xs border-collapse">
                <thead class="sticky top-0 bg-slate-100 z-10">
                    <tr>
                        <th class="sticky-col-header px-3 py-3 text-left font-bold text-slate-700 border-b-2 border-slate-200 min-w-[200px]">Mahasiswa</th>
                        <th class="px-3 py-3 text-center font-bold text-slate-700 border-b-2 border-slate-200 min-w-[80px] bg-blue-50">Tugas (20%)</th>
                        <th class="px-3 py-3 text-center font-bold text-slate-700 border-b-2 border-slate-200 min-w-[80px] bg-purple-50">UTS (30%)</th>
                        <th class="px-3 py-3 text-center font-bold text-slate-700 border-b-2 border-slate-200 min-w-[80px] bg-rose-50">UAS (40%)</th>
                        <th class="px-3 py-3 text-center font-bold text-slate-700 border-b-2 border-slate-200 min-w-[80px] bg-amber-50">Hadir (10%)</th>
                        <th class="px-3 py-3 text-center font-bold text-slate-700 border-b-2 border-slate-200 min-w-[80px] bg-teal-100">Nilai Akhir</th>
                        <th class="px-3 py-3 text-center font-bold text-slate-700 border-b-2 border-slate-200 min-w-[80px]">Grade</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    mahasiswa.forEach((mhs, idx) => {
        const rowClass = !mhs.sudah_ada_nilai ? 'bg-amber-50/30' : (idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50');
        const gradeConfig = GRADE_CONFIG[mhs.grade] || GRADE_CONFIG['-'];
        
        html += `
            <tr class="${rowClass} hover:bg-teal-50/30 transition-colors border-b border-slate-100">
                <td class="sticky-col px-3 py-2 border-r border-slate-100 ${rowClass}">
                    <div class="flex items-center gap-2">
                        <div class="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                            ${(mhs.nama || '?').charAt(0).toUpperCase()}
                        </div>
                        <div class="min-w-0">
                            <div class="font-bold text-slate-800 text-xs truncate">${mhs.nama || '-'}</div>
                            <div class="text-[10px] text-slate-500">${mhs.nim || '-'}</div>
                        </div>
                    </div>
                </td>
                <td class="px-3 py-2 text-center">
                    <span onclick="bukaEditNilai('${mhs.id_mahasiswa}', '${kelas.id_matkul}', 'tugas', '${mhs.nama}', '${mhs.nim}', '${kelas.nama_matkul}')"
                        class="cell-editable inline-block px-2 py-1 rounded font-semibold ${mhs.nilai_tugas > 0 ? 'text-blue-700 bg-blue-50' : 'text-slate-400 bg-slate-100'}">
                        ${mhs.nilai_tugas || 0}
                    </span>
                </td>
                <td class="px-3 py-2 text-center">
                    <span onclick="bukaEditNilai('${mhs.id_mahasiswa}', '${kelas.id_matkul}', 'uts', '${mhs.nama}', '${mhs.nim}', '${kelas.nama_matkul}')"
                        class="cell-editable inline-block px-2 py-1 rounded font-semibold ${mhs.nilai_uts > 0 ? 'text-purple-700 bg-purple-50' : 'text-slate-400 bg-slate-100'}">
                        ${mhs.nilai_uts || 0}
                    </span>
                </td>
                <td class="px-3 py-2 text-center">
                    <span onclick="bukaEditNilai('${mhs.id_mahasiswa}', '${kelas.id_matkul}', 'uas', '${mhs.nama}', '${mhs.nim}', '${kelas.nama_matkul}')"
                        class="cell-editable inline-block px-2 py-1 rounded font-semibold ${mhs.nilai_uas > 0 ? 'text-rose-700 bg-rose-50' : 'text-slate-400 bg-slate-100'}">
                        ${mhs.nilai_uas || 0}
                    </span>
                </td>
                <td class="px-3 py-2 text-center">
                    <span onclick="bukaEditNilai('${mhs.id_mahasiswa}', '${kelas.id_matkul}', 'kehadiran', '${mhs.nama}', '${mhs.nim}', '${kelas.nama_matkul}')"
                        class="cell-editable inline-block px-2 py-1 rounded font-semibold ${mhs.nilai_kehadiran > 0 ? 'text-amber-700 bg-amber-50' : 'text-slate-400 bg-slate-100'}">
                        ${mhs.nilai_kehadiran || 0}
                    </span>
                </td>
                <td class="px-3 py-2 text-center bg-teal-50/30">
                    <span class="inline-block px-2 py-1 rounded font-bold text-teal-700 bg-teal-100">
                        ${mhs.nilai_akhir || 0}
                    </span>
                </td>
                <td class="px-3 py-2 text-center">
                    <span class="inline-block px-3 py-1 rounded-full text-xs font-bold ${gradeConfig.class}">
                        ${gradeConfig.label}
                    </span>
                </td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
        
        <!-- Info Bawah -->
        <div class="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center gap-2">
            <i class="fa-solid fa-lightbulb text-amber-500"></i>
            <span><strong>Tips:</strong> Klik salah satu nilai (Tugas/UTS/UAS/Kehadiran) untuk mengoreksi. Nilai akhir & grade akan otomatis dihitung ulang.</span>
        </div>
    `;
    
    container.innerHTML = html;
}

// ==========================================
// BUKA MODAL EDIT NILAI
// ==========================================
function bukaEditNilai(idMahasiswa, idMatkul, komponen, namaMhs, nimMhs, namaMatkul) {
    // Isi info
    document.getElementById('editInisial').innerText = (namaMhs || '?').charAt(0).toUpperCase();
    document.getElementById('editNamaMhs').innerText = namaMhs || '-';
    document.getElementById('editNimMhs').innerText = nimMhs || '-';
    document.getElementById('editNamaMatkul').innerText = namaMatkul || '-';
    
    // Set komponen
    document.getElementById('editKomponen').value = komponen;
    
    // Ambil nilai saat ini
    const mhs = (currentRekapData?.mahasiswa || []).find(m => m.id_mahasiswa === idMahasiswa);
    let nilaiSekarang = 0;
    if (mhs) {
        if (komponen === 'tugas') nilaiSekarang = mhs.nilai_tugas;
        else if (komponen === 'uts') nilaiSekarang = mhs.nilai_uts;
        else if (komponen === 'uas') nilaiSekarang = mhs.nilai_uas;
        else if (komponen === 'kehadiran') nilaiSekarang = mhs.nilai_kehadiran;
    }
    
    document.getElementById('editNilaiBaru').value = nilaiSekarang;
    
    // Simpan data
    document.getElementById('modalEditNilai').dataset.idMahasiswa = idMahasiswa;
    document.getElementById('modalEditNilai').dataset.idMatkul = idMatkul;
    
    // Buka modal
    document.getElementById('modalEditNilai').classList.remove('hidden');
}

// ==========================================
// SIMPAN KOREKSI NILAI
// ==========================================
async function simpanKoreksiNilai() {
    const idMahasiswa = document.getElementById('modalEditNilai').dataset.idMahasiswa;
    const idMatkul = document.getElementById('modalEditNilai').dataset.idMatkul;
    const komponen = document.getElementById('editKomponen').value;
    const nilaiBaru = parseFloat(document.getElementById('editNilaiBaru').value);
    
    if (!komponen) {
        alert('⚠️ Pilih komponen nilai dulu.');
        return;
    }
    
    if (isNaN(nilaiBaru) || nilaiBaru < 0 || nilaiBaru > 100) {
        alert('⚠️ Nilai harus antara 0-100.');
        return;
    }
    
    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ 
                action: 'koreksi_nilai', 
                id_mahasiswa: idMahasiswa,
                id_matkul: idMatkul,
                komponen: komponen,
                nilai_baru: nilaiBaru
            })
        });
        const result = await response.json();
        console.log(">>> Koreksi nilai:", result);

        if (result.status === 'success') {
            alert('✅ ' + result.message);
            tutupModal('modalEditNilai');
            if (currentIdKelas) await loadRekapNilai(currentIdKelas);
        } else {
            alert('❌ ' + result.message);
        }
    } catch (error) {
        console.error("Error koreksi nilai:", error);
        alert('❌ Terjadi kesalahan koneksi.');
    }
}

// ==========================================
// HITUNG ULANG NILAI SEMUA MAHASISWA
// ==========================================
async function hitungUlangNilai() {
    if (!currentIdKelas) {
        alert('⚠️ Pilih mata kuliah dulu.');
        return;
    }
    
    if (!confirm('Hitung ulang nilai akhir & grade untuk semua mahasiswa di kelas ini?\n\nBobot: Kehadiran 10%, Tugas 20%, UTS 30%, UAS 40%')) {
        return;
    }
    
    const btn = document.getElementById('btnHitungUlang');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Memproses...';
    btn.disabled = true;
    
    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ 
                action: 'hitung_ulang_nilai', 
                id_kelas: currentIdKelas 
            })
        });
        const result = await response.json();
        console.log(">>> Hitung ulang:", result);

        if (result.status === 'success') {
            alert(`✅ ${result.message}\n\nTotal: ${result.total}\nBerhasil: ${result.sukses}`);
            await loadRekapNilai(currentIdKelas);
        } else {
            alert('❌ ' + result.message);
        }
    } catch (error) {
        console.error("Error hitung ulang:", error);
        alert('❌ Terjadi kesalahan koneksi.');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// ==========================================
// EXPORT CSV
// ==========================================
function exportCSV() {
    if (!currentRekapData) {
        alert('⚠️ Tidak ada data untuk di-export.');
        return;
    }
    
    const data = currentRekapData;
    const kelas = data.kelas || {};
    const mahasiswa = data.mahasiswa || [];
    
    // Header CSV
    let csv = `Rekap Nilai: ${kelas.nama_matkul || 'Mata Kuliah'}\n`;
    csv += `Kelas: ${kelas.nama_kelas || '-'}\n`;
    csv += `SKS: ${kelas.sks || 0}\n`;
    csv += `Tanggal Export: ${new Date().toLocaleString('id-ID')}\n\n`;
    
    // Header tabel
    csv += 'No,NIM,Nama,Tugas (20%),UTS (30%),UAS (40%),Kehadiran (10%),Nilai Akhir,Grade\n';
    
    // Baris mahasiswa
    mahasiswa.forEach((mhs, idx) => {
        csv += `${idx + 1},${mhs.nim || '-'},${mhs.nama || '-'},`;
        csv += `${mhs.nilai_tugas || 0},${mhs.nilai_uts || 0},${mhs.nilai_uas || 0},`;
        csv += `${mhs.nilai_kehadiran || 0},${mhs.nilai_akhir || 0},${mhs.grade || '-'}\n`;
    });
    
    // Statistik
    csv += '\n\nSTATISTIK\n';
    const stat = data.statistik || {};
    csv += `Total Mahasiswa,${stat.total_mahasiswa || 0}\n`;
    csv += `Rata-rata Nilai,${stat.rata_nilai_akhir || 0}\n`;
    csv += `Mahasiswa Nilai < 60,${stat.mhs_kurang_60 || 0}\n\n`;
    
    csv += 'Distribusi Grade\n';
    csv += `A,${(stat.distribusi_grade || {})['A'] || 0}\n`;
    csv += `B,${(stat.distribusi_grade || {})['B'] || 0}\n`;
    csv += `C,${(stat.distribusi_grade || {})['C'] || 0}\n`;
    csv += `D,${(stat.distribusi_grade || {})['D'] || 0}\n`;
    csv += `E,${(stat.distribusi_grade || {})['E'] || 0}\n`;
    
    // Download
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Rekap_Nilai_${kelas.nama_kelas || 'kelas'}_${Date.now()}.csv`;
    link.click();
    
    console.log('✅ Export CSV berhasil');
}

// ==========================================
// TUTUP MODAL
// ==========================================
function tutupModal(id) {
    document.getElementById(id).classList.add('hidden');
}
