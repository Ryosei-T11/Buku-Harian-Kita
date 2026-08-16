// =====================================================
// RENCANA & MIMPI — Bucket List, Kalender, Kapsul Waktu
// =====================================================

function switchPlannerSubTab(name) {
    ['bucket', 'calendar', 'capsule'].forEach(n => {
        document.getElementById(`planner-${n}`).classList.toggle('hidden', n !== name);
        document.getElementById(`sub-planner-${n}`).classList.toggle('subtab-active', n === name);
    });
    if (name === 'calendar') renderCalendar();
}

// ---------- BUCKET LIST ----------
function renderBucketList() {
    const container = document.getElementById('bucket-list-container');
    container.innerHTML = '';
    let done = 0;

    appState.bucketList.forEach(item => {
        if (item.completed) done++;
        const row = document.createElement('div');
        row.className = `bucket-item ${item.completed ? 'bucket-item-done' : ''}`;
        row.innerHTML = `
            <label class="bucket-check">
                <input type="checkbox" ${item.completed ? 'checked' : ''} onchange="toggleBucket(${item.id})">
                <span></span>
            </label>
            <div class="bucket-text">
                <span class="bucket-category">${escapeHtml(item.category)}</span>
                <p>${escapeHtml(item.title)}</p>
            </div>
            <button class="bucket-delete" onclick="deleteBucket(${item.id})" title="Hapus">✕</button>
        `;
        container.appendChild(row);
    });

    const percent = appState.bucketList.length > 0 ? Math.round((done / appState.bucketList.length) * 100) : 0;
    document.getElementById('bucket-progress-fill').style.width = `${percent}%`;
    document.getElementById('bucket-progress-label').innerText = `${done} dari ${appState.bucketList.length} impian tercapai (${percent}%)`;
}

function toggleBucket(id) {
    const item = appState.bucketList.find(b => b.id === id);
    if (item) { item.completed = !item.completed; saveState(); renderBucketList(); }
}

function openBucketModal() { document.getElementById('bucket-modal').classList.remove('hidden'); }
function closeBucketModal() { document.getElementById('bucket-modal').classList.add('hidden'); }

function saveBucketItem() {
    const title = document.getElementById('bucket-title-input').value.trim();
    const category = document.getElementById('bucket-category-input').value;
    if (!title) { showToast('Belum Lengkap', 'Tulis dulu impian kalian.'); return; }
    appState.bucketList.push({ id: Date.now(), title, category, completed: false });
    saveState();
    renderBucketList();
    closeBucketModal();
    document.getElementById('bucket-title-input').value = '';
}

function deleteBucket(id) {
    requestConfirm('Hapus impian ini dari bucket list?', () => {
        appState.bucketList = appState.bucketList.filter(b => b.id !== id);
        saveState();
        renderBucketList();
    });
}

// ---------- KALENDER (navigasi bebas bulan/tahun, tak terbatas ke depan) ----------
const todayRef = new Date();
let calYear = todayRef.getFullYear();
let calMonth = todayRef.getMonth();

function changeCalendarMonth(delta) {
    calMonth += delta;
    if (calMonth > 11) { calMonth = 0; calYear++; }
    else if (calMonth < 0) { calMonth = 11; calYear--; }
    renderCalendar();
}

function goToCalendarToday() {
    const now = new Date();
    calYear = now.getFullYear();
    calMonth = now.getMonth();
    renderCalendar();
}

function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    const label = document.getElementById('calendar-label');
    if (!grid) return;
    grid.innerHTML = '';
    label.innerText = `${NAMA_BULAN[calMonth]} ${calYear}`;

    const eventsByDate = {};
    appState.calendarEvents.forEach(e => {
        (eventsByDate[e.date] = eventsByDate[e.date] || []).push(e);
    });

    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const todayKey = toLocalDateKey(new Date());

    for (let i = 0; i < firstDay; i++) grid.appendChild(document.createElement('div'));

    for (let d = 1; d <= daysInMonth; d++) {
        const dateKey = toLocalDateKey(new Date(calYear, calMonth, d));
        const dayEvents = eventsByDate[dateKey] || [];
        const cell = document.createElement('div');
        cell.className = `cal-day ${dayEvents.length ? 'cal-day-event' : ''} ${dateKey === todayKey ? 'cal-day-today' : ''}`;
        cell.innerHTML = `${d}${dayEvents.length ? '<span class="cal-dot"></span>' : ''}`;
        if (dayEvents.length) {
            cell.onclick = () => showToast('Jadwal 📅', dayEvents.map(e => `${escapeHtml(e.title)}: ${escapeHtml(e.desc)}`).join(' • '));
        }
        grid.appendChild(cell);
    }

    const list = document.getElementById('calendar-events-list');
    list.innerHTML = '';
    const upcoming = [...appState.calendarEvents]
        .filter(e => e.date >= todayKey)
        .sort((a, b) => a.date.localeCompare(b.date));
    const toShow = upcoming.length ? upcoming : [...appState.calendarEvents].sort((a, b) => a.date.localeCompare(b.date));

    toShow.forEach(item => {
        const row = document.createElement('div');
        row.className = 'agenda-item';
        row.innerHTML = `
            <div>
                <h5>${escapeHtml(item.title)}</h5>
                <span>${formatTanggalSingkat(item.date)}</span>
                <p>${escapeHtml(item.desc)}</p>
            </div>
            <button onclick="deleteCalendarItem(${item.id})" title="Hapus">✕</button>
        `;
        list.appendChild(row);
    });
}

function openCalendarModal() { document.getElementById('calendar-modal').classList.remove('hidden'); }
function closeCalendarModal() { document.getElementById('calendar-modal').classList.add('hidden'); }

function saveCalendarItem() {
    const title = document.getElementById('cal-title-input').value.trim();
    const date = document.getElementById('cal-date-input').value;
    const desc = document.getElementById('cal-desc-input').value.trim();
    if (!title || !date) { showToast('Belum Lengkap', 'Isi judul dan tanggalnya dulu.'); return; }
    appState.calendarEvents.push({ id: Date.now(), title, date, desc });
    saveState();
    renderCalendar();
    closeCalendarModal();
    document.getElementById('cal-title-input').value = '';
    document.getElementById('cal-date-input').value = '';
    document.getElementById('cal-desc-input').value = '';
}

function deleteCalendarItem(id) {
    requestConfirm('Hapus jadwal ini dari kalender?', () => {
        appState.calendarEvents = appState.calendarEvents.filter(e => e.id !== id);
        saveState();
        renderCalendar();
    });
}

// ---------- KAPSUL WAKTU ----------
function renderCapsules() {
    const container = document.getElementById('capsule-container');
    container.innerHTML = '';

    appState.capsuleLetters.forEach(item => {
        const isLocked = new Date() < new Date(item.unlockDate + 'T00:00:00');
        const card = document.createElement('div');
        card.className = `capsule-card ${isLocked ? 'capsule-locked' : ''}`;
        card.innerHTML = `
            <div class="capsule-head">
                <span>Kepada: ${escapeHtml(item.target)}</span>
                <span>Buka: ${formatTanggalSingkat(item.unlockDate)}</span>
            </div>
            ${isLocked
                ? `<div class="capsule-seal">🔒<p>Masih tersegel</p></div>`
                : `<p class="capsule-text">"${escapeHtml(item.content)}"</p>`
            }
            <div class="capsule-foot">
                ${isLocked
                    ? `<button class="btn-disabled" disabled>Belum Bisa Dibuka</button>`
                    : `<button class="btn-small" onclick="readCapsuleLetter(${item.id})">Baca Surat</button>`
                }
                <button class="capsule-delete" onclick="deleteCapsule(${item.id})" title="Hapus">✕</button>
            </div>
        `;
        container.appendChild(card);
    });
}

function readCapsuleLetter(id) {
    const item = appState.capsuleLetters.find(c => c.id === id);
    if (!item) return;
    document.getElementById('capsule-reader-target').innerText = item.target;
    document.getElementById('capsule-reader-text').innerText = item.content;
    document.getElementById('capsule-reader-modal').classList.remove('hidden');
}
function closeCapsuleReader() { document.getElementById('capsule-reader-modal').classList.add('hidden'); }

function openCapsuleModal() { document.getElementById('capsule-modal').classList.remove('hidden'); }
function closeCapsuleModal() { document.getElementById('capsule-modal').classList.add('hidden'); }

function saveCapsuleItem() {
    const target = document.getElementById('capsule-target-input').value.trim() || 'Kita berdua';
    const unlockDate = document.getElementById('capsule-unlock-input').value;
    const content = document.getElementById('capsule-content-input').value.trim();
    if (!unlockDate || !content) { showToast('Belum Lengkap', 'Isi tanggal buka dan isi suratnya dulu.'); return; }
    appState.capsuleLetters.push({ id: Date.now(), target, unlockDate, content });
    saveState();
    renderCapsules();
    closeCapsuleModal();
    document.getElementById('capsule-target-input').value = '';
    document.getElementById('capsule-unlock-input').value = '';
    document.getElementById('capsule-content-input').value = '';
}

function deleteCapsule(id) {
    requestConfirm('Hapus surat kapsul waktu ini? Isinya tidak akan bisa dikembalikan.', () => {
        appState.capsuleLetters = appState.capsuleLetters.filter(c => c.id !== id);
        saveState();
        renderCapsules();
    });
}
