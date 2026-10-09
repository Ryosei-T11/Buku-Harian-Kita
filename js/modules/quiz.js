// =====================================================
// KUIS PASANGAN — jawab sendiri-sendiri, baru dibandingkan
// =====================================================

function getRoleAnswerKey(role) {
    return role === 'partner' ? 'partnerAnswer' : 'creatorAnswer';
}

// Membandingkan jawaban secara lebih fleksibel: mengabaikan huruf besar/kecil,
// tanda baca, dan spasi berlebih — juga tetap dianggap "cocok" kalau satu jawaban
// cuma menambahkan kata di ujung jawaban yang lain (misal "22 Juli 2026" vs
// "22 juli 2026 lahhh").
function normalizeQuizAnswer(str) {
    return String(str || '')
        .toLowerCase()
        .replace(/[.,!?;:'"()\-_/\\]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function isQuizAnswerMatch(a, b) {
    const na = normalizeQuizAnswer(a);
    const nb = normalizeQuizAnswer(b);
    if (!na || !nb) return false;
    if (na === nb) return true;
    return na.includes(nb) || nb.includes(na);
}

// ---------- PERTANYAAN "SIAPA ..." ----------
// Untuk pertanyaan berbentuk "Siapa yang ...?", jawaban seperti "Aku" (dari Aldo)
// dan "cowokku" (dari Wian) sebenarnya menunjuk orang yang sama. Fungsi di bawah
// mengubah jawaban jadi "siapa yang dimaksud" (creator / partner) sebelum dibandingkan.
const WHO_SELF_WORDS = ['aku', 'saya', 'gue', 'gua', 'diriku', 'sendiri', 'me', 'ak'];
const WHO_OTHER_WORDS = [
    'kamu', 'kau', 'dia', 'dirimu', 'doi', 'cowokku', 'cowoku', 'ceweku', 'cewekku',
    'pacarku', 'pacar', 'ayang', 'ayangku', 'sayang', 'sayangku', 'pasanganku', 'kekasihku', 'babe', 'you'
];

// "cowokkuu" -> "cowoku" : huruf berulang diringkas supaya variasi ketikan tetap dikenali
function collapseRepeats(str) {
    return String(str || '').toLowerCase().replace(/(.)\1+/g, '$1');
}

function isWhoQuestion(question) {
    return /^\s*siapa/i.test(String(question || ''));
}

// Mengembalikan 'creator' / 'partner' bila jawaban jelas menunjuk salah satunya, selain itu null.
function resolveWhoAnswer(answer, authorRole) {
    const s = appState.settings;
    const otherRole = authorRole === 'creator' ? 'partner' : 'creator';
    const names = {
        creator: collapseRepeats(s.myName),
        partner: collapseRepeats(s.partnerName)
    };

    const tokens = collapseRepeats(normalizeQuizAnswer(answer)).split(' ').filter(Boolean);
    const selfSet = new Set(WHO_SELF_WORDS.map(collapseRepeats));
    const otherSet = new Set(WHO_OTHER_WORDS.map(collapseRepeats));

    const found = new Set();
    tokens.forEach(t => {
        if (selfSet.has(t)) found.add(authorRole);
        else if (otherSet.has(t)) found.add(otherRole);
        else if (names.creator && t === names.creator) found.add('creator');
        else if (names.partner && t === names.partner) found.add('partner');
    });

    // Kalau menyebut dua-duanya (misal "kita berdua") atau tidak ada yang dikenali -> tidak bisa ditentukan
    return found.size === 1 ? Array.from(found)[0] : null;
}

// Penentu akhir apakah satu pertanyaan dianggap "cocok":
// 1) pasangan sudah menyepakati manual ("maksudnya sama"), atau
// 2) pertanyaan "Siapa..." yang kedua jawabannya menunjuk orang yang sama, atau
// 3) kemiripan teks biasa.
function getQuizMatchInfo(item) {
    if (item.agreedSame) return { match: true, reason: 'agreed' };

    if (isWhoQuestion(item.question)) {
        const c = resolveWhoAnswer(item.creatorAnswer, 'creator');
        const p = resolveWhoAnswer(item.partnerAnswer, 'partner');
        // Kalau dua-duanya jelas menunjuk seseorang, hasilnya ditentukan dari orangnya,
        // bukan dari tulisan (jadi "aku" dari Aldo vs "aku" dari Wian = beda orang).
        if (c && p) return c === p ? { match: true, reason: 'who' } : { match: false, reason: 'none' };
    }

    if (isQuizAnswerMatch(item.creatorAnswer, item.partnerAnswer)) return { match: true, reason: 'text' };
    return { match: false, reason: 'none' };
}

function renderQuiz() {
    const container = document.getElementById('quiz-list');
    container.innerHTML = '';

    if (appState.quizAnswers.length === 0) {
        container.innerHTML = `<p class="empty-note">Belum ada pertanyaan kuis. Tambahkan yang pertama!</p>`;
        return;
    }

    const p = getProfiles();
    const myRole = getMyRole();
    const myKey = getRoleAnswerKey(myRole);
    const otherKey = myKey === 'creatorAnswer' ? 'partnerAnswer' : 'creatorAnswer';

    appState.quizAnswers.forEach(item => {
        const myAnswer = item[myKey];
        const otherAnswer = item[otherKey];
        const card = document.createElement('div');
        card.className = 'quiz-card';

        let bodyHtml = '';
        if (!myAnswer) {
            // Belum dijawab oleh saya
            bodyHtml = `
                <div class="quiz-answer-form">
                    <input type="text" id="quiz-input-${item.id}" placeholder="Jawaban ${p.myName}...">
                    <button class="btn-small" onclick="submitQuizAnswer(${item.id})">Kirim</button>
                </div>`;
        } else if (!otherAnswer) {
            // Saya sudah jawab, pasangan belum
            bodyHtml = `
                <p class="quiz-my-answer"><strong>${p.myName}:</strong> ${escapeHtml(myAnswer)}</p>
                <p class="quiz-waiting">⏳ Menunggu jawaban ${escapeHtml(p.partnerName)}...</p>
                <button class="quiz-edit-btn" onclick="editQuizAnswer(${item.id})">Ubah jawabanku</button>`;
        } else {
            // Berdua sudah jawab -> tampilkan perbandingan
            const info = getQuizMatchInfo(item);
            const match = info.match;
            let verdictHtml;
            if (info.reason === 'agreed') {
                verdictHtml = `
                    <p class="quiz-match quiz-match-yes">🤝 Kalian sepakat: maksudnya sama!</p>
                    <button class="quiz-edit-btn" onclick="toggleQuizAgreed(${item.id})">Batalkan kesepakatan</button>`;
            } else if (match) {
                verdictHtml = `<p class="quiz-match quiz-match-yes">✅ Jawaban kalian mirip!</p>`;
            } else {
                verdictHtml = `
                    <p class="quiz-match quiz-match-no">💭 Kata-katanya beda, tapi apa maksudnya sama?</p>
                    <button class="quiz-agree-btn" onclick="toggleQuizAgreed(${item.id})">🤝 Iya, maksudnya sama</button>`;
            }
            bodyHtml = `
                <div class="quiz-compare">
                    <div class="quiz-compare-col">
                        <span class="quiz-compare-label">${escapeHtml(p.myName)}</span>
                        <p>${escapeHtml(myAnswer)}</p>
                    </div>
                    <div class="quiz-compare-col">
                        <span class="quiz-compare-label">${escapeHtml(p.partnerName)}</span>
                        <p>${escapeHtml(otherAnswer)}</p>
                    </div>
                </div>
                ${verdictHtml}
                <button class="quiz-edit-btn" onclick="editQuizAnswer(${item.id})">Ubah jawabanku</button>`;
        }

        card.innerHTML = `
            <div class="quiz-card-head">
                <h4>${escapeHtml(item.question)}</h4>
                <button class="quiz-delete" onclick="deleteQuizQuestion(${item.id})" title="Hapus pertanyaan">✕</button>
            </div>
            ${bodyHtml}
        `;
        container.appendChild(card);
    });

    // Skor kecocokan keseluruhan
    const answeredBoth = appState.quizAnswers.filter(q => q.creatorAnswer && q.partnerAnswer);
    const matchCount = answeredBoth.filter(q => getQuizMatchInfo(q).match).length;
    const scoreBox = document.getElementById('quiz-score');
    if (answeredBoth.length > 0) {
        scoreBox.classList.remove('hidden');
        scoreBox.innerText = `💞 ${matchCount} dari ${answeredBoth.length} jawaban kalian mirip`;
    } else {
        scoreBox.classList.add('hidden');
    }
}

function submitQuizAnswer(id) {
    const input = document.getElementById(`quiz-input-${id}`);
    const value = input.value.trim();
    if (!value) { showToast('Belum Diisi', 'Tulis jawabanmu dulu ya.'); return; }

    const item = appState.quizAnswers.find(q => q.id === id);
    if (!item) return;
    const myKey = getRoleAnswerKey(getMyRole());
    item[myKey] = value;
    delete item.agreedSame; // jawaban berubah -> kesepakatan lama tidak berlaku lagi
    saveState();
    renderQuiz();
    showToast('Terkirim 💌', 'Jawabanmu sudah tersimpan.');
}

function editQuizAnswer(id) {
    const item = appState.quizAnswers.find(q => q.id === id);
    if (!item) return;
    const myKey = getRoleAnswerKey(getMyRole());
    item[myKey] = null;
    delete item.agreedSame;
    saveState();
    renderQuiz();
}

// Kalian berdua bebas menandai "maksudnya sama" (atau membatalkannya) untuk pertanyaan ini
function toggleQuizAgreed(id) {
    const item = appState.quizAnswers.find(q => q.id === id);
    if (!item) return;
    if (item.agreedSame) {
        delete item.agreedSame;
    } else {
        item.agreedSame = true;
        showToast('Sepakat 🤝', 'Dihitung sebagai jawaban yang sama.');
    }
    saveState();
    renderQuiz();
}

function deleteQuizQuestion(id) {
    requestConfirm('Hapus pertanyaan kuis ini beserta jawaban kalian berdua?', () => {
        appState.quizAnswers = appState.quizAnswers.filter(q => q.id !== id);
        saveState();
        renderQuiz();
    });
}

function openQuizModal() { document.getElementById('quiz-modal').classList.remove('hidden'); }
function closeQuizModal() { document.getElementById('quiz-modal').classList.add('hidden'); }

function saveQuizQuestion() {
    const question = document.getElementById('quiz-question-input').value.trim();
    if (!question) { showToast('Belum Lengkap', 'Tulis dulu pertanyaannya.'); return; }
    appState.quizAnswers.push({ id: Date.now(), question, creatorAnswer: null, partnerAnswer: null });
    saveState();
    renderQuiz();
    closeQuizModal();
    document.getElementById('quiz-question-input').value = '';
}
