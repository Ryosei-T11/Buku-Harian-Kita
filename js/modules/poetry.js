// =====================================================
// PUISI KITA — kumpulan puisi yang ditulis sendiri
// =====================================================

function renderPoems() {
    const container = document.getElementById('poem-list');
    container.innerHTML = '';

    if (appState.poems.length === 0) {
        container.innerHTML = `<p class="empty-note">Belum ada puisi tersimpan. Tulis yang pertama.</p>`;
        return;
    }

    const p = getProfiles();
    const sorted = [...appState.poems].sort((a, b) => b.date.localeCompare(a.date));

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
        `;
        container.appendChild(card);
    });
}

function openPoemModal() { document.getElementById('poem-modal').classList.remove('hidden'); }
function closePoemModal() { document.getElementById('poem-modal').classList.add('hidden'); }

function savePoem() {
    const title = document.getElementById('poem-title-input').value.trim();
    const dedication = document.getElementById('poem-dedication-input').value.trim();
    const content = document.getElementById('poem-content-input').value.trim();

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
        content
    });
    saveState();
    renderPoems();
    closePoemModal();
    document.getElementById('poem-title-input').value = '';
    document.getElementById('poem-dedication-input').value = '';
    document.getElementById('poem-content-input').value = '';
    showToast('Tersimpan 📜', 'Puisimu sudah ditambahkan ke buku.');
}

function deletePoem(id) {
    appState.poems = appState.poems.filter(p => p.id !== id);
    saveState();
    renderPoems();
}
