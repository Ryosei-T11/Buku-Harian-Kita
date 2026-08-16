// =====================================================
// DINDING KENANGAN (Polaroid Gallery)
// =====================================================

const MAX_IMAGE_DIMENSION = 900; // px, sisi terpanjang setelah dikompres
const IMAGE_QUALITY = 0.68;

let pendingUploadDataUrl = null;

function renderPolaroids() {
    const wall = document.getElementById('polaroid-wall');
    wall.innerHTML = '';

    if (appState.polaroids.length === 0) {
        wall.innerHTML = `<p class="empty-note">Dinding ini masih kosong. Tempel kenangan pertama kalian di sini.</p>`;
        return;
    }

    appState.polaroids.forEach((p, idx) => {
        // Rotasi & pergeseran semi-acak tapi stabil (berbasis id foto), jadi terasa
        // organik seperti ditempel tangan, bukan pola berulang tiap 5 foto.
        const seed = Math.abs(Math.sin(p.id * 12.9898) * 43758.5453);
        const rotation = ((seed - Math.floor(seed)) * 12) - 6; // -6deg s/d 6deg
        const seedY = Math.abs(Math.sin(p.id * 78.233) * 12345.678);
        const offsetY = ((seedY - Math.floor(seedY)) * 14) - 7; // -7px s/d 7px
        const card = document.createElement('div');
        card.className = 'polaroid';
        card.style.transform = `rotate(${rotation.toFixed(1)}deg) translateY(${offsetY.toFixed(1)}px)`;
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

function openPolaroidModal() {
    pendingUploadDataUrl = null;
    document.getElementById('polaroid-file-input').value = '';
    document.getElementById('polaroid-preview').classList.add('hidden');
    document.getElementById('polaroid-upload-status').innerText = '';
    document.getElementById('polaroid-modal').classList.remove('hidden');
}
function closePolaroidModal() { document.getElementById('polaroid-modal').classList.add('hidden'); }

// Mengompres & mengubah ukuran gambar di browser sebelum disimpan ke cloud,
// supaya tidak terlalu berat dikirim/diunduh berulang kali.
function handlePolaroidFileSelect(fileInput) {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        showToast('Bukan Gambar', 'Pilih file foto (jpg/png/webp) ya.');
        return;
    }

    document.getElementById('polaroid-upload-status').innerText = 'Memproses foto...';

    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            let width = img.width;
            let height = img.height;
            if (width > height && width > MAX_IMAGE_DIMENSION) {
                height = Math.round(height * (MAX_IMAGE_DIMENSION / width));
                width = MAX_IMAGE_DIMENSION;
            } else if (height > MAX_IMAGE_DIMENSION) {
                width = Math.round(width * (MAX_IMAGE_DIMENSION / height));
                height = MAX_IMAGE_DIMENSION;
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            pendingUploadDataUrl = canvas.toDataURL('image/jpeg', IMAGE_QUALITY);

            const preview = document.getElementById('polaroid-preview');
            preview.src = pendingUploadDataUrl;
            preview.classList.remove('hidden');
            const sizeKb = Math.round(pendingUploadDataUrl.length / 1024);
            document.getElementById('polaroid-upload-status').innerText = `Siap ditempel (± ${sizeKb} KB setelah dikompres).`;
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function savePolaroid() {
    const urlInput = document.getElementById('polaroid-img-input').value.trim();
    const img = pendingUploadDataUrl || urlInput;
    const caption = document.getElementById('polaroid-caption-input').value.trim();
    const date = document.getElementById('polaroid-date-input').value || toLocalDateKey(new Date());
    const tape = document.getElementById('polaroid-tape-input').value;

    if (!img || !caption) {
        showToast('Belum Lengkap', 'Upload foto (atau tempel link) dan isi captionnya dulu ya.');
        return;
    }

    appState.polaroids.push({ id: Date.now(), img, caption, date, tape });
    saveState();
    renderPolaroids();
    closePolaroidModal();
    document.getElementById('polaroid-img-input').value = '';
    document.getElementById('polaroid-caption-input').value = '';
    pendingUploadDataUrl = null;
    showToast('Tertempel! 📌', 'Kenangan baru sudah nempel di dinding.');
}

function deletePolaroid(id) {
    requestConfirm('Hapus foto ini dari dinding kenangan? Tindakan ini tidak bisa dibatalkan.', () => {
        appState.polaroids = appState.polaroids.filter(p => p.id !== id);
        saveState();
        renderPolaroids();
    });
}
