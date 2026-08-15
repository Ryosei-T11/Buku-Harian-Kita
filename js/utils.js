// =====================================================
// UTILS
// =====================================================

const NAMA_BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const NAMA_HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', "Jum'at", 'Sabtu'];

function formatTanggalPanjang(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return `${NAMA_HARI[d.getDay()]}, ${d.getDate()} ${NAMA_BULAN[d.getMonth()]} ${d.getFullYear()}`;
}

function formatTanggalSingkat(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return `${d.getDate()} ${NAMA_BULAN[d.getMonth()]} ${d.getFullYear()}`;
}

function toLocalDateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function hitungHariBersama(anniversaryDate) {
    const start = new Date(anniversaryDate + 'T00:00:00');
    const now = new Date();
    const startLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffMs = startLocal - new Date(start.getFullYear(), start.getMonth(), start.getDate());
    return Math.floor(diffMs / 86400000);
}

// Toast catatan tempel kecil di pojok layar
function showToast(title, message) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const note = document.createElement('div');
    note.className = 'sticky-toast';
    note.innerHTML = `<strong>${title}</strong><p>${message}</p>`;
    container.appendChild(note);
    setTimeout(() => {
        note.classList.add('sticky-toast-out');
        setTimeout(() => note.remove(), 400);
    }, 3200);
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.innerText = str == null ? '' : str;
    return div.innerHTML;
}

// ---------- KONFETI ANNIVERSARY ----------
const CONFETTI_COLORS = ['#c1666b', '#d8a657', '#3f6e60', '#f7f0dc', '#a84e53'];

function triggerAnniversaryConfetti() {
    const todayKey = toLocalDateKey(new Date());
    const flagKey = 'buku_harian_confetti_' + todayKey;
    if (sessionStorage.getItem(flagKey)) return; // sudah tampil hari ini, jangan ulang tiap render
    sessionStorage.setItem(flagKey, 'true');

    const container = document.createElement('div');
    container.className = 'confetti-container';
    document.body.appendChild(container);

    const pieceCount = 60;
    for (let i = 0; i < pieceCount; i++) {
        const piece = document.createElement('span');
        piece.className = 'confetti-piece';
        piece.style.left = `${Math.random() * 100}vw`;
        piece.style.background = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
        piece.style.animationDuration = `${2.2 + Math.random() * 1.8}s`;
        piece.style.animationDelay = `${Math.random() * 0.6}s`;
        piece.style.setProperty('--rot', `${(Math.random() * 360) | 0}deg`);
        container.appendChild(piece);
    }

    setTimeout(() => container.remove(), 4500);
    if (typeof showToast === 'function') showToast('Selamat Hari Jadi! 🎉', 'Semoga makin sayang setiap harinya.');
}
