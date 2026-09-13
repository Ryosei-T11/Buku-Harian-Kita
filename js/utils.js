// =====================================================
// UTILS
// =====================================================

// ---------- TEMA MALAM (Dark Mode) ----------
// Diterapkan sedini mungkin (saat utils.js dimuat) supaya tidak ada kedipan
// tema terang sebelum tema gelap yang tersimpan diterapkan.
const THEME_STORAGE_KEY = 'buku_harian_theme';

function applyTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    document.querySelectorAll('.theme-toggle-btn').forEach(b => b.innerText = theme === 'dark' ? '☀️ Mode Terang' : '🌙 Mode Malam');
    document.querySelectorAll('.theme-toggle-btn-mobile').forEach(b => b.innerText = theme === 'dark' ? '☀️' : '🌙');
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    applyTheme(current === 'dark' ? 'light' : 'dark');
}

applyTheme(localStorage.getItem(THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light');

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

// ---------- MODAL KONFIRMASI HAPUS (dipakai bersama oleh semua modul) ----------
let _pendingConfirmAction = null;

function requestConfirm(message, onConfirm) {
    document.getElementById('confirm-message').innerText = message;
    _pendingConfirmAction = onConfirm;
    document.getElementById('confirm-modal').classList.remove('hidden');
}

function closeConfirmModal() {
    document.getElementById('confirm-modal').classList.add('hidden');
    _pendingConfirmAction = null;
}

function executeConfirmedAction() {
    const action = _pendingConfirmAction;
    closeConfirmModal();
    if (typeof action === 'function') action();
}

// ---------- TAG / LABEL (dipakai bersama oleh jurnal & puisi) ----------
function parseTagsInput(str) {
    if (!str) return [];
    return Array.from(new Set(str.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)));
}

function collectUniqueTags(items) {
    const set = new Set();
    items.forEach(it => (it.tags || []).forEach(t => set.add(t)));
    return Array.from(set).sort();
}

function tagPillsHtml(tags) {
    if (!tags || tags.length === 0) return '';
    return `<div class="tag-pills">${tags.map(t => `<span class="tag-pill">#${escapeHtml(t)}</span>`).join('')}</div>`;
}

function tagFilterBarHtml(allTags, activeTag, toggleFnName) {
    if (allTags.length === 0) return '';
    return `<div class="tag-filter-bar">${allTags.map(t =>
        `<button class="tag-filter-btn ${activeTag === t ? 'tag-filter-active' : ''}" onclick="${toggleFnName}('${t.replace(/'/g, "\\'")}')">#${escapeHtml(t)}</button>`
    ).join('')}</div>`;
}

// ---------- REAKSI CEPAT (dipakai bersama oleh jurnal, puisi, & dinding kenangan) ----------
const REACTION_EMOJIS = ['❤️', '😂', '🥺', '😮'];
const REACTION_SOURCE = {
    diary: () => appState.diaryEntries,
    poem: () => appState.poems,
    polaroid: () => appState.polaroids
};
const REACTION_RERENDER = {
    diary: () => typeof renderDiary === 'function' && renderDiary(),
    poem: () => typeof renderPoems === 'function' && renderPoems(),
    polaroid: () => typeof renderPolaroids === 'function' && renderPolaroids()
};

function toggleReaction(itemType, itemId, emoji) {
    const getArr = REACTION_SOURCE[itemType];
    if (!getArr) return;
    const item = getArr().find(i => String(i.id) === String(itemId));
    if (!item) return;

    item.reactions = item.reactions || {};
    const role = getMyRole();
    const list = item.reactions[emoji] || [];
    const idx = list.indexOf(role);
    if (idx >= 0) list.splice(idx, 1); else list.push(role);
    if (list.length > 0) item.reactions[emoji] = list; else delete item.reactions[emoji];

    saveState();
    const rerender = REACTION_RERENDER[itemType];
    if (rerender) rerender();
}

function reactionBarHtml(itemType, itemId, reactions) {
    const myRole = typeof getMyRole === 'function' ? getMyRole() : 'creator';
    return `<div class="reaction-bar">${REACTION_EMOJIS.map(e => {
        const list = (reactions && reactions[e]) || [];
        const mine = list.includes(myRole);
        const count = list.length;
        return `<button class="reaction-btn ${mine ? 'reaction-btn-active' : ''}" onclick="toggleReaction('${itemType}','${itemId}','${e}')">${e}${count > 0 ? `<span>${count}</span>` : ''}</button>`;
    }).join('')}</div>`;
}

// ---------- LAGU KENANGAN ----------
function songLinkHtml(url) {
    if (!url || !/^https?:\/\//i.test(url)) return '';
    return `<a class="song-link" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">🎵 Dengerin lagunya</a>`;
}

// ---------- PENCARIAN BEBAS ----------
function matchesSearch(text, query) {
    if (!query) return true;
    return String(text || '').toLowerCase().includes(query.trim().toLowerCase());
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
