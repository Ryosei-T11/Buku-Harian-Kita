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
