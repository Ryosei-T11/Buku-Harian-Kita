// =====================================================
// APP — Logika Utama
// =====================================================

function checkDigitalKey() {
    const answerInput = document.getElementById('security-answer');
    const role = document.getElementById('roleSelector').value;
    const given = answerInput.value.trim().toLowerCase();
    const real = appState.settings.secretAnswer.toLowerCase();

    if (given === real) {
        localStorage.setItem(SESSION_ROLE_KEY, role);
        localStorage.setItem(SESSION_UNLOCKED_KEY, 'true');
        localStorage.setItem(SESSION_LAST_ANSWER_KEY, real);
        document.getElementById('lock-screen').classList.add('lock-fade-out');
        setTimeout(() => {
            document.getElementById('lock-screen').classList.add('hidden');
            document.getElementById('main-app').classList.remove('hidden');
            initApp();
        }, 500);
    } else {
        const box = document.getElementById('lock-screen-box');
        box.classList.add('shake');
        setTimeout(() => box.classList.remove('shake'), 500);
        answerInput.value = '';
        answerInput.placeholder = 'Coba lagi ya...';
    }
}

function getMyRole() {
    return localStorage.getItem(SESSION_ROLE_KEY) || 'creator';
}

function getProfiles() {
    const s = appState.settings;
    const role = getMyRole();
    if (role === 'partner') {
        return {
            myRole: 'partner', partnerRole: 'creator',
            myName: s.partnerName, myCity: s.partnerCity,
            partnerName: s.myName, partnerCity: s.myCity
        };
    }
    return {
        myRole: 'creator', partnerRole: 'partner',
        myName: s.myName, myCity: s.myCity,
        partnerName: s.partnerName, partnerCity: s.partnerCity
    };
}

function injectRoleLabels() {
    const select = document.getElementById('roleSelector');
    if (!select) return;
    const s = appState.settings;
    select.innerHTML = `
        <option value="creator">${s.myName} (Pembuat)</option>
        <option value="partner">${s.partnerName} (Pasangan)</option>
    `;
}

function initApp() {
    lucideReplace();
    injectRoleLabels();
    renderDashboard();
    renderPolaroids();
    renderDiary();
    renderQuiz();
    renderPoems();
    renderBucketList();
    renderCalendar();
    renderCapsules();
    fillSettingsForm();
}

// ---------- NAVIGASI TAB ----------
function switchTab(tabName) {
    document.querySelectorAll('.tab-page').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.nav-tab').forEach(el => el.classList.remove('nav-tab-active'));
    const target = document.getElementById(`tab-${tabName}`);
    target.classList.remove('hidden');
    // Transisi halus: restart animasi fade+slide setiap kali tab ditampilkan
    target.classList.remove('tab-page-enter');
    void target.offsetWidth; // paksa reflow supaya animasi bisa diulang
    target.classList.add('tab-page-enter');
    document.getElementById(`nav-${tabName}`).classList.add('nav-tab-active');
    document.getElementById('mobile-nav-title').innerText = document.getElementById(`nav-${tabName}`).dataset.label;
    closeMobileNav();
    lucideReplace();
}

function toggleMobileNav() {
    document.getElementById('sidebar').classList.toggle('sidebar-open');
}
function closeMobileNav() {
    document.getElementById('sidebar').classList.remove('sidebar-open');
}

// ---------- DASHBOARD ----------
function renderDashboard() {
    const s = appState.settings;
    const p = getProfiles();

    document.getElementById('dash-greeting').innerText = `Halo, ${p.myName}!`;
    const hari = hitungHariBersama(s.anniversaryDate);
    document.getElementById('dash-days-count').innerText = hari >= 0 ? hari : 0;
    document.getElementById('dash-anniv-since').innerText = hari >= 0
        ? `hari sejak ${formatTanggalSingkat(s.anniversaryDate)}`
        : `menuju ${formatTanggalSingkat(s.anniversaryDate)}`;

    // Countdown ke anniversary tahun ini/berikutnya
    const annivDate = new Date(s.anniversaryDate + 'T00:00:00');
    const now = new Date();
    let nextAnniv = new Date(now.getFullYear(), annivDate.getMonth(), annivDate.getDate());
    if (nextAnniv < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
        nextAnniv.setFullYear(now.getFullYear() + 1);
    }
    const diffDays = Math.ceil((nextAnniv - now) / 86400000);
    const yearsTogether = nextAnniv.getFullYear() - annivDate.getFullYear();
    document.getElementById('dash-next-anniv').innerText = diffDays === 0
        ? `Hari ini adalah hari jadian ke-${yearsTogether}! 🎉`
        : `${diffDays} hari ke Anniversary ke-${yearsTogether}`;

    if (diffDays === 0) triggerAnniversaryConfetti();

    document.getElementById('dash-my-city').innerText = p.myCity;
    document.getElementById('dash-partner-city').innerText = p.partnerCity;
    document.getElementById('dash-partner-name-label').innerText = p.partnerName;

    // Catatan tempel terakhir dari jurnal
    const latest = [...appState.diaryEntries].sort((a, b) => b.date.localeCompare(a.date))[0];
    const latestBox = document.getElementById('dash-latest-entry');
    if (latest) {
        const authorName = latest.author === getMyRole() ? 'Kamu' : p.partnerName;
        latestBox.innerHTML = `<span class="latest-mood">${latest.mood}</span> <strong>${escapeHtml(latest.title)}</strong><br><span class="latest-meta">ditulis oleh ${authorName}, ${formatTanggalSingkat(latest.date)}</span>`;
    } else {
        latestBox.innerHTML = `<span class="latest-meta">Belum ada catatan jurnal. Yuk tulis yang pertama!</span>`;
    }

    renderDashboardQuote();
}

// Kutipan acak dari puisi yang sudah ditulis, satu pilihan tetap per hari
// (tidak berubah-ubah tiap kali dashboard di-render ulang di hari yang sama).
function renderDashboardQuote() {
    const box = document.getElementById('dash-quote-box');
    if (!box) return;

    if (!appState.poems || appState.poems.length === 0) {
        box.innerHTML = `<span class="latest-meta">Belum ada puisi. Tulis satu di tab "Puisi Kita" ✍️</span>`;
        return;
    }

    const todayKey = toLocalDateKey(new Date());
    const pickKey = 'buku_harian_quote_pick_' + todayKey;
    let chosenId = localStorage.getItem(pickKey);
    let poem = appState.poems.find(p => String(p.id) === chosenId);

    if (!poem) {
        poem = appState.poems[Math.floor(Math.random() * appState.poems.length)];
        localStorage.setItem(pickKey, String(poem.id));
    }

    // Ambil satu-dua baris pertama saja supaya ringkas sebagai kutipan
    const lines = poem.content.split('\n').filter(l => l.trim() !== '');
    const snippet = lines.slice(0, 2).join('\n');

    box.innerHTML = `
        <p class="quote-text">"${escapeHtml(snippet)}${lines.length > 2 ? '...' : ''}"</p>
        <span class="quote-source">— dari puisi "${escapeHtml(poem.title)}"</span>
    `;
}

// ---------- PENGATURAN ----------
function fillSettingsForm() {
    const s = appState.settings;
    document.getElementById('set-my-name').value = s.myName;
    document.getElementById('set-my-city').value = s.myCity;
    document.getElementById('set-partner-name').value = s.partnerName;
    document.getElementById('set-partner-city').value = s.partnerCity;
    document.getElementById('set-anniversary-date').value = s.anniversaryDate;
    document.getElementById('set-secret-question').value = s.secretQuestion;
    document.getElementById('set-secret-answer').value = '';
    document.getElementById('set-secret-answer').placeholder = '(kosongkan jika tidak diganti)';
}

function saveSettings() {
    const s = appState.settings;
    s.myName = document.getElementById('set-my-name').value.trim() || s.myName;
    s.myCity = document.getElementById('set-my-city').value.trim() || s.myCity;
    s.partnerName = document.getElementById('set-partner-name').value.trim() || s.partnerName;
    s.partnerCity = document.getElementById('set-partner-city').value.trim() || s.partnerCity;
    s.anniversaryDate = document.getElementById('set-anniversary-date').value || s.anniversaryDate;
    s.secretQuestion = document.getElementById('set-secret-question').value.trim() || s.secretQuestion;

    const newAnswer = document.getElementById('set-secret-answer').value.trim();
    if (newAnswer) s.secretAnswer = newAnswer.toLowerCase();

    saveState();
    // Perbarui jawaban terakhir yang diketahui perangkat ini supaya tidak ter-auto-logout
    // oleh perubahannya sendiri saat data balik lagi dari Firebase.
    localStorage.setItem(SESSION_LAST_ANSWER_KEY, s.secretAnswer.toLowerCase());
    injectRoleLabels();
    renderDashboard();
    showToast('Tersimpan 📌', 'Pengaturan buku harian sudah diperbarui & disinkronkan ke cloud.');
    fillSettingsForm();
}

function lucideReplace() {
    // Placeholder no-op: ikon di app ini murni emoji/CSS, tidak pakai library luar.
}

// ---------- BOOT ----------
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('lock-screen-question').innerText = `"${appState.settings.secretQuestion}"`;
    injectRoleLabels();

    if (localStorage.getItem(SESSION_UNLOCKED_KEY) === 'true') {
        localStorage.setItem(SESSION_LAST_ANSWER_KEY, appState.settings.secretAnswer.toLowerCase());
        document.getElementById('lock-screen').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
        initApp();
    }
});
