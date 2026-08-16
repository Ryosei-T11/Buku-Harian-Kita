// =====================================================
// PUISI KITA — kumpulan puisi yang ditulis sendiri
// =====================================================

let poemActiveTag = null;

function renderPoems() {
    const container = document.getElementById('poem-list');
    const filterBar = document.getElementById('poem-tag-filter');
    container.innerHTML = '';

    const allTags = collectUniqueTags(appState.poems);
    filterBar.innerHTML = tagFilterBarHtml(allTags, poemActiveTag, 'togglePoemTagFilter');

    if (appState.poems.length === 0) {
        container.innerHTML = `<p class="empty-note">Belum ada puisi tersimpan. Tulis yang pertama.</p>`;
        return;
    }

    const p = getProfiles();
    let sorted = [...appState.poems].sort((a, b) => b.date.localeCompare(a.date));
    if (poemActiveTag) {
        sorted = sorted.filter(poem => (poem.tags || []).includes(poemActiveTag));
    }

    if (sorted.length === 0) {
        container.innerHTML = `<p class="empty-note">Tidak ada puisi dengan label #${escapeHtml(poemActiveTag)}.</p>`;
        return;
    }

    sorted.forEach(poem => {
        const authorName = poem.author === getMyRole() ? p.myName : p.partnerName;
        const card = document.createElement('div');
        card.className = 'poem-card';
        card.innerHTML = `
            <button class="poem-delete" onclick="deletePoem(${poem.id})" title="Hapus">✕</button>
            <h4 class="poem-title">${escapeHtml(poem.title)}</h4>
            ${poem.dedication ? `<p class="poem-dedication">${escapeHtml(poem.dedication)}</p>` : ''}
            <p class="poem-body">${escapeHtml(poem.content)}</p>
            <p class="poem-meta">— ${escapeHtml(authorName)}, ${formatTanggalSingkat(poem.date)}</p>
            ${tagPillsHtml(poem.tags)}
        `;
        container.appendChild(card);
    });
}

function togglePoemTagFilter(tag) {
    poemActiveTag = poemActiveTag === tag ? null : tag;
    renderPoems();
}

function openPoemModal() { document.getElementById('poem-modal').classList.remove('hidden'); }
function closePoemModal() { document.getElementById('poem-modal').classList.add('hidden'); }

function savePoem() {
    const title = document.getElementById('poem-title-input').value.trim();
    const dedication = document.getElementById('poem-dedication-input').value.trim();
    const content = document.getElementById('poem-content-input').value.trim();
    const tags = parseTagsInput(document.getElementById('poem-tags-input').value);

    if (!title || !content) {
        showToast('Belum Lengkap', 'Isi judul dan isi puisinya dulu ya.');
        return;
    }

    appState.poems.push({
        id: Date.now(),
        author: getMyRole(),
        date: toLocalDateKey(new Date()),
        title,
        dedication,
        content,
        tags
    });
    saveState();
    renderPoems();
    closePoemModal();
    document.getElementById('poem-title-input').value = '';
    document.getElementById('poem-dedication-input').value = '';
    document.getElementById('poem-content-input').value = '';
    document.getElementById('poem-tags-input').value = '';
    showToast('Tersimpan 📜', 'Puisimu sudah ditambahkan ke buku.');
}

function deletePoem(id) {
    requestConfirm('Hapus puisi ini? Tindakan ini tidak bisa dibatalkan.', () => {
        appState.poems = appState.poems.filter(p => p.id !== id);
        saveState();
        renderPoems();
    });
}
