// =====================================================
// KUIS PASANGAN — jawab sendiri-sendiri, baru dibandingkan
// =====================================================

function getRoleAnswerKey(role) {
    return role === 'partner' ? 'partnerAnswer' : 'creatorAnswer';
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
            const match = myAnswer.trim().toLowerCase() === otherAnswer.trim().toLowerCase();
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
                <p class="quiz-match ${match ? 'quiz-match-yes' : 'quiz-match-no'}">${match ? '✅ Jawaban kalian mirip!' : '💭 Jawaban kalian beda, seru buat dibahas berdua!'}</p>
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
    const matchCount = answeredBoth.filter(q => q.creatorAnswer.trim().toLowerCase() === q.partnerAnswer.trim().toLowerCase()).length;
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
    saveState();
    renderQuiz();
    showToast('Terkirim 💌', 'Jawabanmu sudah tersimpan.');
}

function editQuizAnswer(id) {
    const item = appState.quizAnswers.find(q => q.id === id);
    if (!item) return;
    const myKey = getRoleAnswerKey(getMyRole());
    item[myKey] = null;
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
