let currentSoalIndex = 0;
let soalList = [];
let jawabanUser = {}; // Menyimpan { id_soal: 'A' }

async function startUjian(id_ujian) {
    const res = await fetch(CONFIG.API_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'get_soal', id_ujian: id_ujian })
    });
    const result = await res.json();
    soalList = result.data;
    renderSoal();
}

function renderSoal() {
    const s = soalList[currentSoalIndex];
    // DOM Manipulation untuk menampilkan pertanyaan dan 4 opsi
    document.getElementById('pertanyaan').innerText = s.pertanyaan;
    document.getElementById('opsi_a').innerText = s.opsi_a;
    // ... dst
}

function simpanJawaban(opsi) {
    const s = soalList[currentSoalIndex];
    jawabanUser[s.id_soal] = opsi;
    renderNavigasi(); // Update warna tombol navigasi menjadi hijau
}

// Timer sederhana
let timeLeft = 3600; // 1 jam dalam detik
setInterval(() => {
    timeLeft--;
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    document.getElementById('timerCountdown').innerText = `${m}:${s}`;
}, 1000);
