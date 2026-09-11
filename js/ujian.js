// ==========================================
// js/ujian.js - Logika Ujian CBT Mahasiswa (FINAL)
// Fitur: Timer Dinamis, Navigasi, Simpan Jawaban, Kunci Ujian, Badge Jenis Ujian
// ==========================================

// ==========================================
// VARIABEL GLOBAL
// ==========================================
let currentUser = null;
let currentIndex = 0;
let daftarSoal = [];
let jawabanSiswa = {};
let currentIdUjian = null;
let timerInterval = null;
let sisaWaktuDetik = 0;
let totalWaktuDetik = 0;
let ujianSelesai = [];        // Array of {id_ujian, nilai, jumlah_benar, total_soal}
let daftarUjianGlobal = [];   // ✅ Simpan daftar ujian untuk lookup durasi

// ==========================================
// KONFIGURASI WARNA BADGE JENIS UJIAN
// ==========================================
const JENIS_UJIAN_CONFIG = {
    'UTS': {
        label: 'UTS',
        class: 'bg-blue-50 text-blue-600 border-blue-100'
    },
    'UAS': {
        label: 'UAS',
        class: 'bg-purple-50 text-purple-600 border-purple-100'
    },
    'Quiz': {
        label: 'Quiz',
        class: 'bg-amber-50 text-amber-600 border-amber-100'
    },
    'Tugas Besar': {
        label: 'Tugas Besar',
        class: 'bg-rose-50 text-rose-600 border-rose-100'
    }
};

// ==========================================
// HELPER: Format Tanggal & Waktu ke Format Indonesia
// ==========================================
function formatTanggalWaktu(tanggalISO) {
    if (!tanggalISO) return '-';
    
    try {
        const date = new Date(tanggalISO);
        if (isNaN(date.getTime())) return tanggalISO;
        
        const options = {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Jakarta',
            hour12: false
        };
        
        return date.toLocaleString('id-ID', options);
        
    } catch (e) {
        console.error('Error format tanggal:', e);
        return tanggalISO;
    }
}

// ==========================================
// INISIALISASI HALAMAN
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Set Judul Halaman
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) pageTitle.innerText = 'Ujian';

    // 2. Ambil Session
    const sessionData = localStorage.getItem('user_session');
    if (!sessionData) { 
        window.location.href = '../login.html'; 
        return; 
    }
    
    currentUser = JSON.parse(sessionData);
    console.log(">>> User session:", currentUser);

    const idMhs = currentUser.id_mahasiswa || currentUser.id_user;

    // 3. Load status ujian yang sudah dikerjakan
    await loadStatusUjian(idMhs);
    
    // 4. Load daftar ujian
    await loadDaftarUjian(idMhs);

    // 5. Listener pilihan ganda
    document.querySelectorAll('input[name="opsiJawaban"]').forEach(input => {
        input.addEventListener('change', (e) => {
            if (!jawabanSiswa[currentIndex]) jawabanSiswa[currentIndex] = { opsi: '', ragu: false };
            jawabanSiswa[currentIndex].opsi = e.target.value;
            renderNavigasi();
            renderTampilanSoal();
        });
    });
});

// ==========================================
// 1. LOAD STATUS UJIAN (YANG SUDAH DIKERJAKAN)
// ==========================================
async function loadStatusUjian(id_mahasiswa) {
    try {
        console.log(">>> Loading status ujian untuk:", id_mahasiswa);
        
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify({ 
                action: 'cek_status_ujian', 
                id_mahasiswa: id_mahasiswa 
            })
        });
        const result = await response.json();
        console.log(">>> Status ujian:", result);
        
        if (result.status === 'success') {
            ujianSelesai = result.data || [];
        } else {
            ujianSelesai = [];
        }
    } catch (error) {
        console.error("Error loadStatusUjian:", error);
        ujianSelesai = [];
    }
}

// ==========================================
// 2. LOAD DAFTAR UJIAN (DENGAN BADGE & DURASI)
// ==========================================
async function loadDaftarUjian(id_user) {
    const container = document.getElementById('containerDaftarUjian');
    container.innerHTML = '<p class="text-slate-400 col-span-full text-center py-10"><i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Memuat ujian...</p>';
    
    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify({ action: 'get_ujian', id_mahasiswa: id_user })
        });
        const result = await response.json();
        console.log(">>> Daftar ujian:", result);

        if (result.status === 'success') {
            // ✅ SIMPAN DAFTAR UJIAN KE VARIABEL GLOBAL (untuk lookup durasi)
            daftarUjianGlobal = result.data;
            
            container.innerHTML = '';
            if (result.data.length === 0) {
                container.innerHTML = '<p class="text-slate-500 col-span-full text-center py-10">Belum ada jadwal ujian saat ini.</p>';
                return;
            }

            result.data.forEach(u => {
                // ✅ Cek apakah ujian sudah dikerjakan
                const infoSelesai = ujianSelesai.find(item => item.id_ujian === u.id_ujian);
                const sudahDikerjakan = !!infoSelesai;
                
                // ✅ Ambil config warna badge berdasarkan jenis ujian
                const jenisUjian = u.jenis_ujian || 'UTS';
                const jenisConfig = JENIS_UJIAN_CONFIG[jenisUjian] || JENIS_UJIAN_CONFIG['UTS'];
                
                // ✅ Format waktu
                const waktuMulai = formatTanggalWaktu(u.mulai);
                const waktuSelesai = formatTanggalWaktu(u.selesai);
                
                // ✅ Durasi ujian
                const durasi = u.durasi_menit || 60;
                
                // Card class berbeda berdasarkan status
                let cardClass = "bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition flex flex-col justify-between";
                if (sudahDikerjakan) {
                    cardClass = "bg-white p-6 rounded-2xl shadow-sm border-2 border-green-200 flex flex-col justify-between";
                }
                
                // Action HTML berbeda
                let actionHTML = '';
                let badgeHTML = '';
                
                if (sudahDikerjakan) {
                    // ✅ Badge jenis ujian + badge SELESAI
                    badgeHTML = `
                        <div class="flex gap-1.5">
                            <span class="${jenisConfig.class} text-xs font-bold px-2.5 py-1 rounded-md border">${jenisConfig.label}</span>
                            <span class="bg-green-50 text-green-600 border border-green-200 text-xs font-bold px-2.5 py-1 rounded-md">
                                <i class="fa-solid fa-check mr-0.5"></i> SELESAI
                            </span>
                        </div>
                    `;
                    actionHTML = `
                        <div class="bg-green-50 text-green-600 border border-green-200 py-2.5 rounded-xl text-xs font-bold text-center">
                            <div><i class="fa-solid fa-circle-check mr-1"></i> Sudah Dikerjakan</div>
                            <div class="text-lg font-bold mt-1">Nilai: ${infoSelesai.nilai}</div>
                            <div class="text-[10px] font-normal">Benar: ${infoSelesai.jumlah_benar}/${infoSelesai.total_soal}</div>
                        </div>
                    `;
                } else {
                    // ✅ Badge jenis ujian
                    badgeHTML = `<span class="${jenisConfig.class} text-xs font-bold px-2.5 py-1 rounded-md border">${jenisConfig.label}</span>`;
                    actionHTML = `
                        <button onclick="mulaiUjian('${u.id_ujian}', '${u.judul.replace(/'/g, "\\'")}')" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center">
                            <i class="fa-solid fa-pen-to-square mr-2"></i> Mulai Kerjakan Ujian
                        </button>
                    `;
                }

                const card = document.createElement('div');
                card.className = cardClass;
                card.innerHTML = `
                    <div>
                        <div class="flex justify-between items-start mb-3">
                            ${badgeHTML}
                            <span class="text-xs font-bold text-slate-400">Bobot: ${u.bobot}</span>
                        </div>
                        <h3 class="text-lg font-bold text-slate-800 mb-1">${u.judul}</h3>
                        <p class="text-xs text-indigo-600 font-semibold mb-3">${u.mata_kuliah}</p>
                        <p class="text-xs text-slate-500 mb-4 line-clamp-2">${u.deskripsi}</p>
                        <div class="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-600 space-y-1">
                            <div class="flex items-center"><i class="fa-regular fa-clock w-4 text-red-500 mr-1.5"></i> Mulai: ${waktuMulai}</div>
                            <div class="flex items-center"><i class="fa-regular fa-hourglass-end w-4 text-slate-400 mr-1.5"></i> Selesai: ${waktuSelesai}</div>
                            <div class="flex items-center"><i class="fa-solid fa-stopwatch w-4 text-amber-500 mr-1.5"></i> Durasi: ${durasi} menit</div>
                        </div>
                    </div>
                    <div class="mt-6">
                        ${actionHTML}
                    </div>
                `;
                container.appendChild(card);
            });
        } else {
            container.innerHTML = `<p class="text-red-500 col-span-full text-center py-10">${result.message}</p>`;
        }
    } catch (err) {
        console.error("Error loadDaftarUjian:", err);
        container.innerHTML = `<p class="text-red-500 col-span-full text-center py-10">Gagal terhubung ke server.</p>`;
    }
}

// ==========================================
// 3. MULAI UJIAN (DENGAN DURASI DINAMIS)
// ==========================================
async function mulaiUjian(id_ujian, judul_ujian) {
    // ✅ Proteksi: cek apakah sudah dikerjakan
    const sudahDikerjakan = ujianSelesai.some(item => item.id_ujian === id_ujian);
    if (sudahDikerjakan) {
        alert('⚠️ Anda sudah mengerjakan ujian ini!');
        return;
    }
    
    currentIdUjian = id_ujian;
    
    // ✅ Ambil durasi dari daftarUjianGlobal
    let durasiMenit = 60; // Default
    const ujianInfo = daftarUjianGlobal.find(u => u.id_ujian === id_ujian);
    if (ujianInfo && ujianInfo.durasi_menit) {
        durasiMenit = parseInt(ujianInfo.durasi_menit) || 60;
    }
    console.log(">>> Durasi ujian:", durasiMenit, "menit");
    
    document.getElementById('viewDaftarUjian').classList.add('hidden');
    document.getElementById('viewLembarSoal').classList.remove('hidden');
    document.getElementById('headerJudulUjian').innerText = judul_ujian;

    // Tampilkan loading
    document.getElementById('teksPertanyaan').innerHTML = 
        '<i class="fa-solid fa-circle-notch fa-spin text-indigo-500 mr-2"></i> Memuat soal...';
    document.getElementById('gridNavigasi').innerHTML = 
        '<p class="text-slate-400 text-xs col-span-4 text-center py-4">Memuat...</p>';

    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify({ action: 'get_soal', id_ujian: id_ujian })
        });
        const result = await response.json();
        console.log(">>> Soal ujian:", result);

        if (result.status === 'success' && result.data.length > 0) {
            daftarSoal = result.data;
            currentIndex = 0;
            jawabanSiswa = {};
            document.getElementById('totalSoalLabel').innerText = `Total Soal: ${daftarSoal.length} Pilihan Ganda`;
            renderTampilanSoal();
            renderNavigasi();
            
            // ✅ MULAI TIMER DENGAN DURASI DINAMIS
            mulaiTimer(durasiMenit);
            
        } else {
            alert('Gagal memuat soal: ' + (result.message || 'Data kosong'));
            kembaliKeDaftar();
        }
    } catch (error) {
        console.error("Error mulaiUjian:", error);
        alert('Terjadi kesalahan koneksi.');
        kembaliKeDaftar();
    }
}

// ==========================================
// 4. KEMBALI KE DAFTAR
// ==========================================
function kembaliKeDaftar() {
    if (confirm('Keluar dari ujian? Progress jawaban Anda akan direset.')) {
        stopTimer();
        
        document.getElementById('viewLembarSoal').classList.add('hidden');
        document.getElementById('viewDaftarUjian').classList.remove('hidden');
        document.getElementById('containerDaftarUjian').innerHTML = '<p class="text-slate-400 col-span-full text-center py-10"><i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Memuat ujian...</p>';
        
        // ✅ Refresh daftar ujian tanpa reload full
        const idMhs = currentUser.id_mahasiswa || currentUser.id_user;
        loadStatusUjian(idMhs).then(() => {
            loadDaftarUjian(idMhs);
        });
    }
}

// ==========================================
// 5. RENDER TAMPILAN SOAL
// ==========================================
function renderTampilanSoal() {
    if (daftarSoal.length === 0) return;
    const soal = daftarSoal[currentIndex];

    document.getElementById('nomorSoalHeader').innerText = `Soal ${currentIndex + 1} dari ${daftarSoal.length}`;
    document.getElementById('teksPertanyaan').innerText = soal.pertanyaan;
    document.getElementById('teksOpsiA').innerText = soal.opsi_a;
    document.getElementById('teksOpsiB').innerText = soal.opsi_b;
    document.getElementById('teksOpsiC').innerText = soal.opsi_c;
    document.getElementById('teksOpsiD').innerText = soal.opsi_d;

    // Reset semua radio
    document.querySelectorAll('input[name="opsiJawaban"]').forEach(input => {
        input.checked = false;
        input.parentElement.classList.remove('border-2', 'border-indigo-600', 'bg-indigo-50/50', 'shadow-sm');
        input.parentElement.classList.add('border', 'border-slate-200');
    });

    // Tandai jawaban yang sudah dipilih
    if (jawabanSiswa[currentIndex] && jawabanSiswa[currentIndex].opsi) {
        const pilihan = jawabanSiswa[currentIndex].opsi;
        const targetInput = document.querySelector(`input[name="opsiJawaban"][value="${pilihan}"]`);
        if (targetInput) {
            targetInput.checked = true;
            targetInput.parentElement.classList.remove('border', 'border-slate-200');
            targetInput.parentElement.classList.add('border-2', 'border-indigo-600', 'bg-indigo-50/50', 'shadow-sm');
        }
    }

    document.getElementById('checkRagu').checked = jawabanSiswa[currentIndex] ? jawabanSiswa[currentIndex].ragu : false;
    document.getElementById('btnSebelumnya').style.visibility = currentIndex === 0 ? 'hidden' : 'visible';
    document.getElementById('btnBerikutnya').innerText = currentIndex === daftarSoal.length - 1 ? 'Selesai' : 'Berikutnya ';
}

// ==========================================
// 6. RENDER NAVIGASI NOMOR
// ==========================================
function renderNavigasi() {
    const container = document.getElementById('gridNavigasi');
    container.innerHTML = '';

    daftarSoal.forEach((_, idx) => {
        const btn = document.createElement('button');
        btn.innerText = idx + 1;
        
        let kelasWarna = "bg-slate-100 text-slate-600 hover:bg-slate-200";
        const status = jawabanSiswa[idx];
        if (status) {
            if (status.ragu) kelasWarna = "bg-amber-500 text-white shadow-sm";
            else if (status.opsi) kelasWarna = "bg-emerald-500 text-white shadow-sm";
        }

        if (idx === currentIndex) {
            btn.className = "w-10 h-10 rounded-xl font-bold text-xs flex items-center justify-center bg-indigo-600 text-white ring-4 ring-indigo-100 shadow-md";
        } else {
            btn.className = `w-10 h-10 rounded-xl font-bold text-xs flex items-center justify-center ${kelasWarna}`;
        }

        btn.onclick = () => {
            currentIndex = idx;
            renderTampilanSoal();
            renderNavigasi();
        };
        container.appendChild(btn);
    });
}

// ==========================================
// 7. NAVIGASI SOAL
// ==========================================
function pindahSoal(arah) {
    const target = currentIndex + arah;
    if (target >= 0 && target < daftarSoal.length) {
        currentIndex = target;
        renderTampilanSoal();
        renderNavigasi();
    } else if (target >= daftarSoal.length) {
        if (confirm('Apakah Anda ingin mengakhiri dan mengumpulkan ujian ini?')) {
            selesaiUjian();
        }
    }
}

// ==========================================
// 8. SELESAI UJIAN - KIRIM JAWABAN KE BACKEND
// ==========================================
async function selesaiUjian() {
    stopTimer();
    
    if (!currentUser) {
        alert('Sesi tidak valid. Silakan login ulang.');
        return;
    }
    
    // Kumpulkan jawaban
    const jawaban = {};
    daftarSoal.forEach((soal, idx) => {
        if (jawabanSiswa[idx] && jawabanSiswa[idx].opsi) {
            jawaban[soal.id_soal] = jawabanSiswa[idx].opsi;
        }
    });
    
    const jumlahDijawab = Object.keys(jawaban).length;
    const totalSoal = daftarSoal.length;
    
    if (jumlahDijawab < totalSoal) {
        if (!confirm(`Anda baru menjawab ${jumlahDijawab} dari ${totalSoal} soal. Yakin ingin mengumpulkan?`)) {
            // Restart timer dengan sisa waktu
            if (sisaWaktuDetik > 0) {
                mulaiTimerDenganSisa(sisaWaktuDetik);
            }
            return;
        }
    }
    
    // Tampilkan loading
    const btnBerikutnya = document.getElementById('btnBerikutnya');
    if (btnBerikutnya) {
        btnBerikutnya.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Mengirim...';
        btnBerikutnya.disabled = true;
    }
    
    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify({
                action: 'simpan_jawaban_ujian',
                id_ujian: currentIdUjian,
                id_mahasiswa: currentUser.id_mahasiswa || currentUser.id_user,
                jawaban: jawaban
            })
        });
        
        const result = await response.json();
        console.log(">>> Response simpan jawaban:", result);
        
        if (result.status === 'success') {
            alert(`✅ ${result.message}\n\nBenar: ${result.jumlah_benar}/${result.total_soal}\nNilai: ${result.nilai}`);
            
            document.getElementById('viewLembarSoal').classList.add('hidden');
            document.getElementById('viewDaftarUjian').classList.remove('hidden');
            
            // ✅ Auto-reload status & daftar ujian
            const idMhs = currentUser.id_mahasiswa || currentUser.id_user;
            await loadStatusUjian(idMhs);
            await loadDaftarUjian(idMhs);
            
        } else {
            alert('❌ Gagal menyimpan jawaban: ' + result.message);
            
            if (btnBerikutnya) {
                btnBerikutnya.innerHTML = 'Selesai';
                btnBerikutnya.disabled = false;
            }
        }
    } catch (error) {
        console.error("Error simpan jawaban:", error);
        alert('❌ Terjadi kesalahan: ' + error.message);
        
        if (btnBerikutnya) {
            btnBerikutnya.innerHTML = 'Selesai';
            btnBerikutnya.disabled = false;
        }
    }
}

// ==========================================
// 9. FUNGSI TIMER
// ==========================================
function mulaiTimer(durasiMenit = 60) {
    if (timerInterval) clearInterval(timerInterval);
    
    sisaWaktuDetik = durasiMenit * 60;
    totalWaktuDetik = sisaWaktuDetik;
    updateTampilanTimer();
    
    timerInterval = setInterval(() => {
        sisaWaktuDetik--;
        updateTampilanTimer();
        
        if (sisaWaktuDetik <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;
            alert('⏰ Waktu ujian habis! Jawaban akan otomatis dikumpulkan.');
            selesaiUjian();
        }
    }, 1000);
}

function mulaiTimerDenganSisa(detikTersisa) {
    if (timerInterval) clearInterval(timerInterval);
    
    sisaWaktuDetik = detikTersisa;
    updateTampilanTimer();
    
    timerInterval = setInterval(() => {
        sisaWaktuDetik--;
        updateTampilanTimer();
        
        if (sisaWaktuDetik <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;
            alert('⏰ Waktu ujian habis! Jawaban akan otomatis dikumpulkan.');
            selesaiUjian();
        }
    }, 1000);
}

function updateTampilanTimer() {
    const timerEl = document.getElementById('timerCountdown');
    if (!timerEl) return;
    
    const jam = Math.floor(sisaWaktuDetik / 3600);
    const menit = Math.floor((sisaWaktuDetik % 3600) / 60);
    const detik = sisaWaktuDetik % 60;
    
    timerEl.innerText = `${jam.toString().padStart(2, '0')}:${menit.toString().padStart(2, '0')}:${detik.toString().padStart(2, '0')}`;
    
    // Ubah warna jika waktu hampir habis
    const parentDiv = timerEl.closest('div');
    if (parentDiv) {
        if (sisaWaktuDetik < 300) {
            // < 5 menit: merah tebal + animasi
            parentDiv.className = 'bg-red-100 text-red-700 border border-red-300 px-4 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-2 animate-pulse';
        } else if (sisaWaktuDetik < 600) {
            // < 10 menit: kuning
            parentDiv.className = 'bg-amber-50 text-amber-600 border border-amber-200 px-4 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-2';
        }
    }
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

// ==========================================
// 10. TANDAI RAGU-RAGU
// ==========================================
function toggleRaguRagu(checkbox) {
    if (!jawabanSiswa[currentIndex]) jawabanSiswa[currentIndex] = { opsi: '', ragu: false };
    jawabanSiswa[currentIndex].ragu = checkbox.checked;
    renderNavigasi();
}
