// js/ujian.js - Logika Interaktif Ujian CBT & Navigasi Soal

let currentIndex = 0;
let daftarSoal = [];
let jawabanSiswa = {}; // Menyimpan jawaban: { indexSoal: { opsi: 'A', ragu: false } }

document.addEventListener('DOMContentLoaded', async () => {
    // Menangkap id_ujian dari URL (contoh: ujian_soal.html?id_ujian=U001)
    const urlParams = new URLSearchParams(window.location.search);
    const idUjian = urlParams.get('id_ujian') || 'U001'; // Default ke U001 jika kosong
    
    // PERBAIKAN: Gunakan variabel idUjian, bukan string 'U001' langsung
    await loadSoalUjian(idUjian);

    // Event listener untuk pilihan ganda agar langsung tersimpan saat diklik
    document.querySelectorAll('input[name="opsiJawaban"]').forEach(input => {
        input.addEventListener('change', (e) => {
            if (!jawabanSiswa[currentIndex]) jawabanSiswa[currentIndex] = { opsi: '', ragu: false };
            jawabanSiswa[currentIndex].opsi = e.target.value;
            
            renderNavigasi();
            renderTampilanSoal();
        });
    });
});

async function loadSoalUjian(id_ujian) {
    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'get_soal', id_ujian: id_ujian })
        });
        const result = await response.json();

        if (result.status === 'success' && result.data.length > 0) {
            daftarSoal = result.data;
            document.getElementById('totalSoalLabel').innerText = `Total Soal: ${daftarSoal.length} Pilihan Ganda`;
            renderTampilanSoal();
            renderNavigasi();
        } else {
            alert('Gagal memuat soal ujian: ' + (result.message || 'Data kosong'));
        }
    } catch (error) {
        console.error(error);
        alert('Terjadi kesalahan koneksi saat memuat soal.');
    }
}

function renderTampilanSoal() {
    if (daftarSoal.length === 0) return;

    const soal = daftarSoal[currentIndex];

    // Header Soal
    document.getElementById('nomorSoalHeader').innerText = `Soal ${currentIndex + 1} dari ${daftarSoal.length}`;
    
    // Pertanyaan
    document.getElementById('teksPertanyaan').innerText = soal.pertanyaan;

    // Opsi Jawaban
    document.getElementById('teksOpsiA').innerText = soal.opsi_a;
    document.getElementById('teksOpsiB').innerText = soal.opsi_b;
    document.getElementById('teksOpsiC').innerText = soal.opsi_c;
    document.getElementById('teksOpsiD').innerText = soal.opsi_d;

    // Reset pilihan radio button terlebih dahulu
    document.querySelectorAll('input[name="opsiJawaban"]').forEach(input => {
        input.checked = false;
        input.parentElement.classList.remove('border-2', 'border-indigo-600', 'bg-indigo-50/50', 'shadow-sm');
        input.parentElement.classList.add('border', 'border-slate-200');
    });

    // Jika siswa sudah pernah menjawab soal ini, tandai pilihan radionya
    if (jawabanSiswa[currentIndex] && jawabanSiswa[currentIndex].opsi) {
        const pilihan = jawabanSiswa[currentIndex].opsi;
        const targetInput = document.querySelector(`input[name="opsiJawaban"][value="${pilihan}"]`);
        if (targetInput) {
            targetInput.checked = true;
            targetInput.parentElement.classList.remove('border', 'border-slate-200');
            targetInput.parentElement.classList.add('border-2', 'border-indigo-600', 'bg-indigo-50/50', 'shadow-sm');
        }
    }

    // Checkbox Ragu-ragu
    const checkRagu = document.getElementById('checkRagu');
    checkRagu.checked = jawabanSiswa[currentIndex] ? jawabanSiswa[currentIndex].ragu : false;

    // Atur Status Tombol Sebelumnya / Berikutnya
    document.getElementById('btnSebelumnya').style.visibility = currentIndex === 0 ? 'hidden' : 'visible';
    document.getElementById('btnBerikutnya').innerText = currentIndex === daftarSoal.length - 1 ? 'Selesai' : 'Berikutnya ';
}

function renderNavigasi() {
    const container = document.getElementById('gridNavigasi');
    container.innerHTML = '';

    daftarSoal.forEach((_, idx) => {
        const btn = document.createElement('button');
        btn.innerText = idx + 1;
        
        // Warna Default (Belum dijawab)
        let kelasWarna = "bg-slate-100 text-slate-600 hover:bg-slate-200";

        const status = jawabanSiswa[idx];
        if (status) {
            if (status.ragu) {
                kelasWarna = "bg-amber-500 text-white shadow-sm"; // Kuning Ragu-ragu
            } else if (status.opsi) {
                kelasWarna = "bg-emerald-500 text-white shadow-sm"; // Hijau Sudah Dijawab
            }
        }

        // Jika sedang aktif (dibuka sekarang)
        if (idx === currentIndex) {
            btn.className = `w-10 h-10 rounded-xl font-bold text-xs flex items-center justify-center bg-indigo-600 text-white ring-4 ring-indigo-100 shadow-md`;
        } else {
            btn.className = `w-10 h-10 rounded-xl font-bold text-xs flex items-center justify-center ${kelasWarna}`;
        }

        // Ketika nomor soal diklik, langsung lompat ke soal tersebut
        btn.onclick = () => {
            currentIndex = idx;
            renderTampilanSoal();
            renderNavigasi();
        };

        container.appendChild(btn);
    });
}

function pindahSoal(arah) {
    const target = currentIndex + arah;
    if (target >= 0 && target < daftarSoal.length) {
        currentIndex = target;
        renderTampilanSoal();
        renderNavigasi();
    } else if (target >= daftarSoal.length) {
        if (confirm('Apakah Anda ingin mengakhiri dan mengumpulkan ujian ini?')) {
            window.location.href = 'dashboard.html';
        }
    }
}

function toggleRaguRagu(checkbox) {
    if (!jawabanSiswa[currentIndex]) jawabanSiswa[currentIndex] = { opsi: '', ragu: false };
    jawabanSiswa[currentIndex].ragu = checkbox.checked;
    renderNavigasi();
}
