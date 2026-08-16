// =====================================================
// JURNAL HARIAN
// =====================================================

const MOOD_OPTIONS = ['🥰', '😊', '😴', '🥺', '😤', '🤗', '😭', '🎉'];
let diaryActiveTag = null;

function renderDiary() {
    const list = document.getElementById('diary-list');
    const filterBar = document.getElementById('diary-tag-filter');
    list.innerHTML = '';

    const allTags = collectUniqueTags(appState.diaryEntries);
    filterBar.innerHTML = tagFilterBarHtml(allTags, diaryActiveTag, 'toggleDiaryTagFilter');

    if (appState.diaryEntries.length === 0) {
        list.innerHTML = `<p class="empty-note">Halaman jurnal masih kosong. Tulis cerita hari ini.</p>`;
        return;
    }

    const p = getProfiles();
    let sorted = [...appState.diaryEntries].sort((a, b) => b.date.localeCompare(a.date));
    if (diaryActiveTag) {
        sorted = sorted.filter(e => (e.tags || []).includes(diaryActiveTag));
    }

    if (sorted.length === 0) {
        list.innerHTML = `<p class="empty-note">Tidak ada halaman dengan label #${escapeHtml(diaryActiveTag)}.</p>`;
        return;
    }

    sorted.forEach(entry => {
        const authorName = entry.author === getMyRole() ? p.myName : p.partnerName;
        const page = document.createElement('div');
        page.className = 'diary-page';
        page.innerHTML = `
            <div class="diary-page-head">
                <span class="diary-mood">${entry.mood}</span>
                <div>
                    <h4>${escapeHtml(entry.title)}</h4>
                    <span class="diary-meta">${authorName} · ${formatTanggalPanjang(entry.date)}</span>
                </div>
                <button class="diary-delete" onclick="deleteDiaryEntry(${entry.id})" title="Hapus">✕</button>
            </div>
            <p class="diary-content">${escapeHtml(entry.content)}</p>
            ${tagPillsHtml(entry.tags)}
        `;
        list.appendChild(page);
    });
}

function toggleDiaryTagFilter(tag) {
    diaryActiveTag = diaryActiveTag === tag ? null : tag;
    renderDiary();
}

function openDiaryModal() {
    const moodPicker = document.getElementById('diary-mood-picker');
    moodPicker.innerHTML = MOOD_OPTIONS.map(m =>
        `<button type="button" class="mood-btn" data-mood="${m}" onclick="pickMood('${m}')">${m}</button>`
    ).join('');
    pickMood(MOOD_OPTIONS[0]);
    document.getElementById('diary-modal').classList.remove('hidden');
}
function closeDiaryModal() { document.getElementById('diary-modal').classList.add('hidden'); }

let selectedMood = MOOD_OPTIONS[0];
function pickMood(m) {
    selectedMood = m;
    document.querySelectorAll('.mood-btn').forEach(b => b.classList.toggle('mood-btn-active', b.dataset.mood === m));
}

function saveDiaryEntry() {
    const title = document.getElementById('diary-title-input').value.trim();
    const content = document.getElementById('diary-content-input').value.trim();
    const tags = parseTagsInput(document.getElementById('diary-tags-input').value);
    if (!title || !content) {
        showToast('Belum Lengkap', 'Isi judul dan ceritanya dulu ya.');
        return;
    }

    appState.diaryEntries.push({
        id: Date.now(),
        author: getMyRole(),
        date: toLocalDateKey(new Date()),
        mood: selectedMood,
        title,
        content,
        tags
    });
    saveState();
    renderDiary();
    renderDashboard();
    closeDiaryModal();
    document.getElementById('diary-title-input').value = '';
    document.getElementById('diary-content-input').value = '';
    document.getElementById('diary-tags-input').value = '';
    showToast('Ditulis ✍️', 'Halaman baru sudah tersimpan di jurnal.');
}

function deleteDiaryEntry(id) {
    requestConfirm('Hapus halaman jurnal ini? Tindakan ini tidak bisa dibatalkan.', () => {
        appState.diaryEntries = appState.diaryEntries.filter(e => e.id !== id);
        saveState();
        renderDiary();
        renderDashboard();
    });
}
