// =====================================================
// DINDING KENANGAN (Polaroid Gallery)
// =====================================================

function renderPolaroids() {
    const wall = document.getElementById('polaroid-wall');
    wall.innerHTML = '';

    if (appState.polaroids.length === 0) {
        wall.innerHTML = `<p class="empty-note">Dinding ini masih kosong. Tempel kenangan pertama kalian di sini.</p>`;
        return;
    }

    appState.polaroids.forEach((p, idx) => {
        const rotation = (idx % 5 - 2) * 3.2;
        const card = document.createElement('div');
        card.className = 'polaroid';
        card.style.transform = `rotate(${rotation}deg)`;
        card.innerHTML = `
            <span class="washi washi-${p.tape || 'rose'}"></span>
            <img src="${p.img}" alt="${escapeHtml(p.caption)}" loading="lazy">
            <p class="polaroid-caption">${escapeHtml(p.caption)}</p>
            <span class="polaroid-date">${formatTanggalSingkat(p.date)}</span>
            <button class="polaroid-delete" onclick="deletePolaroid(${p.id})" title="Hapus">✕</button>
        `;
        wall.appendChild(card);
    });
}

function openPolaroidModal() { document.getElementById('polaroid-modal').classList.remove('hidden'); }
function closePolaroidModal() { document.getElementById('polaroid-modal').classList.add('hidden'); }

function savePolaroid() {
    const img = document.getElementById('polaroid-img-input').value.trim();
    const caption = document.getElementById('polaroid-caption-input').value.trim();
    const date = document.getElementById('polaroid-date-input').value || toLocalDateKey(new Date());
    const tape = document.getElementById('polaroid-tape-input').value;

    if (!img || !caption) {
        showToast('Belum Lengkap', 'Isi tautan foto dan captionnya dulu ya.');
        return;
    }

    appState.polaroids.push({ id: Date.now(), img, caption, date, tape });
    saveState();
    renderPolaroids();
    closePolaroidModal();
    document.getElementById('polaroid-img-input').value = '';
    document.getElementById('polaroid-caption-input').value = '';
    showToast('Tertempel! 📌', 'Kenangan baru sudah nempel di dinding.');
}

function deletePolaroid(id) {
    appState.polaroids = appState.polaroids.filter(p => p.id !== id);
    saveState();
    renderPolaroids();
}
