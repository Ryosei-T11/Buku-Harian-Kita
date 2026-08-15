// =====================================================
// STATE — Buku Harian Kita (Retro Scrapbook Diary)
// Sinkronisasi real-time via Firebase Realtime Database
// =====================================================

// 1. KONEKSI KE FIREBASE
// Project Firebase khusus untuk Buku Harian Kita.
const firebaseConfig = {
    databaseURL: "https://buku-harian-kita-default-rtdb.asia-southeast1.firebasedatabase.app/"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const database = firebase.database();
const CLOUD_NODE = 'buku_harian_kita_state';
const LOCAL_BACKUP_KEY = 'buku_harian_kita_backup';
const SESSION_ROLE_KEY = 'buku_harian_role';
const SESSION_UNLOCKED_KEY = 'buku_harian_unlocked';
const SESSION_LAST_ANSWER_KEY = 'buku_harian_last_answer';

// 2. DATA BAWAAN (dipakai hanya jika cloud & backup lokal masih benar-benar kosong)
let appState = {
    settings: {
        myName: 'Aldo',
        myCity: 'Modayag',
        myTimezone: 'Asia/Manado',
        partnerName: 'Wian',
        partnerCity: 'Modayag',
        partnerTimezone: 'Asia/Manado',
        anniversaryDate: '2026-07-22',
        secretQuestion: 'Selain Lapkot, dimana biasanya kita duduk menghabiskan waktu?',
        secretAnswer: 'mogolaing'
    },
    polaroids: [
        { id: 1, img: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=600', caption: 'Hari itu, langit sore jadi saksi.', date: '2026-06-10', tape: 'rose' },
        { id: 2, img: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=600', caption: 'Ketawa sampai perut sakit.', date: '2026-06-24', tape: 'mustard' }
    ],
    diaryEntries: [
        { id: 1, author: 'creator', date: '2026-07-22', mood: '🥰', title: 'Halaman Pertama', content: 'Mulai dari sini, kita simpan cerita kita berdua. Setiap hal kecil, biar tidak lupa.' }
    ],
    bucketList: [
        { id: 1, title: 'Nonton sunset di Molibagu', category: 'Destinasi', completed: false },
        { id: 2, title: 'Masak nasi kuning bareng', category: 'Makanan', completed: false },
        { id: 3, title: 'Bikin scrapbook fisik dari halaman ini', category: 'Aktivitas', completed: false }
    ],
    capsuleLetters: [
        { id: 1, target: 'Kita berdua', unlockDate: '2027-07-22', content: 'Kalau surat ini sudah boleh dibuka, berarti kita sudah melewati satu tahun lagi bersama. Terima kasih sudah bertahan dan bertumbuh bersamaku.', unlocked: false }
    ],
    calendarEvents: [
        { id: 1, title: 'Hari Jadian Kita', date: '2026-07-22', desc: 'Jangan lupa dirayakan setiap tahun 🎉' }
    ],
    quizAnswers: [
        { id: 1, question: 'Makanan favoritku adalah...', creatorAnswer: null, partnerAnswer: null },
        { id: 2, question: 'Kalau libur panjang, aku maunya kita...', creatorAnswer: null, partnerAnswer: null },
        { id: 3, question: 'Kebiasaan lucu/anehku yang mungkin belum kamu sadari...', creatorAnswer: null, partnerAnswer: null },
        { id: 4, question: 'Kalau harus pilih satu superpower, aku pilih...', creatorAnswer: null, partnerAnswer: null },
        { id: 5, question: 'Tempat yang paling ingin aku kunjungi bareng kamu...', creatorAnswer: null, partnerAnswer: null },
        { id: 6, question: 'Lagu yang selalu bikin aku ingat kamu...', creatorAnswer: null, partnerAnswer: null },
        { id: 7, question: 'Hal kecil yang bikin aku jatuh cinta sama kamu...', creatorAnswer: null, partnerAnswer: null },
        { id: 8, question: 'Julukan yang aku pengen kamu panggil ke aku...', creatorAnswer: null, partnerAnswer: null }
    ],
    poems: [
        {
            id: 1,
            author: 'creator',
            date: '2026-07-22',
            title: 'Halaman Pertama',
            dedication: 'Untuk Wian',
            content: 'Di setiap baris yang kutulis,\nada namamu yang terselip diam-diam.\nBuku ini bukan cuma kertas,\ntapi rumah kecil untuk kita berdua.'
        }
    ]
};

// Menandai apakah data masih 100% bawaan (dipakai untuk deteksi konflik pemulihan data)
function isDefaultSettings(settings) {
    if (!settings) return true;
    return settings.myName === 'Aldo' &&
           settings.partnerName === 'Wian' &&
           settings.myCity === 'Modayag' &&
           settings.partnerCity === 'Modayag';
}

function normalizeState(data) {
    data = data || {};
    data.settings = data.settings || appState.settings;
    data.polaroids = Array.isArray(data.polaroids) ? data.polaroids : [];
    data.diaryEntries = Array.isArray(data.diaryEntries) ? data.diaryEntries : [];
    data.bucketList = Array.isArray(data.bucketList) ? data.bucketList : [];
    data.capsuleLetters = Array.isArray(data.capsuleLetters) ? data.capsuleLetters : [];
    data.calendarEvents = Array.isArray(data.calendarEvents) ? data.calendarEvents : [];
    data.quizAnswers = Array.isArray(data.quizAnswers) ? data.quizAnswers : [];
    data.poems = Array.isArray(data.poems) ? data.poems : [];
    return data;
}

// 3. SIMPAN PERUBAHAN KE CLOUD (dipanggil setiap kali data berubah)
function saveState() {
    localStorage.setItem(LOCAL_BACKUP_KEY, JSON.stringify(appState));
    database.ref(CLOUD_NODE).set(appState).catch((error) => {
        console.error('Gagal menyinkronkan ke Firebase:', error);
        if (typeof showToast === 'function') showToast('Gagal Sinkron ☁️', 'Perubahan tersimpan lokal, tapi belum terkirim ke cloud. Cek koneksi internet.');
    });
}

// 4. DENGARKAN PERUBAHAN CLOUD SECARA REAL-TIME (dari perangkat manapun)
function hideBootLoading() {
    const el = document.getElementById('boot-loading');
    if (el) el.classList.add('boot-loading-hide');
}
// Jaring pengaman: kalau Firebase lambat/tidak merespons, jangan biarkan
// layar loading tertahan selamanya.
setTimeout(hideBootLoading, 4000);

database.ref(CLOUD_NODE).on('value', (snapshot) => {
    try {
        let cloudData = snapshot.val();
        const backupStr = localStorage.getItem(LOCAL_BACKUP_KEY);
        let localBackup = null;
        if (backupStr) {
            try { localBackup = JSON.parse(backupStr); } catch (e) { /* abaikan backup rusak */ }
        }

        if (cloudData) {
            cloudData = normalizeState(cloudData);

            // PEMULIHAN OTOMATIS: kalau cloud tiba-tiba balik ke data bawaan padahal
            // perangkat ini masih punya data kustom asli, unggah ulang data kustomnya.
            if (localBackup && localBackup.settings && !isDefaultSettings(localBackup.settings) && isDefaultSettings(cloudData.settings)) {
                console.warn('Cloud terdeteksi kembali ke default, memulihkan data kustom dari cadangan lokal...');
                appState = normalizeState(localBackup);
                saveState();
                hideBootLoading();
                return;
            }

            // AUTO-LOGOUT: kalau pertanyaan/jawaban kunci diubah dari perangkat lain
            // saat perangkat ini sedang dalam kondisi terbuka, keluarkan paksa.
            const isSessionUnlocked = localStorage.getItem(SESSION_UNLOCKED_KEY) === 'true';
            const lastKnownAnswer = localStorage.getItem(SESSION_LAST_ANSWER_KEY);
            const cloudAnswer = (cloudData.settings.secretAnswer || '').toLowerCase();
            if (isSessionUnlocked && lastKnownAnswer && lastKnownAnswer !== cloudAnswer) {
                console.warn('Kunci keamanan diubah dari perangkat lain, mengunci ulang halaman ini...');
                localStorage.setItem(SESSION_UNLOCKED_KEY, 'false');
                localStorage.removeItem(SESSION_LAST_ANSWER_KEY);
                location.reload();
                return;
            }

            appState = cloudData;
            localStorage.setItem(LOCAL_BACKUP_KEY, JSON.stringify(appState));

            // Perbarui tampilan yang bergantung pada data cloud
            const lockQ = document.getElementById('lock-screen-question');
            if (lockQ) lockQ.innerText = `"${appState.settings.secretQuestion}"`;
            if (typeof injectRoleLabels === 'function') injectRoleLabels();

            if (localStorage.getItem(SESSION_UNLOCKED_KEY) === 'true' && typeof initApp === 'function') {
                initApp();
            }
        } else if (localBackup) {
            console.log('Cloud masih kosong, mengunggah cadangan lokal sebagai data awal...');
            appState = normalizeState(localBackup);
            saveState();
        } else {
            console.log('Cloud & cadangan lokal kosong, memakai data bawaan dan mengunggahnya.');
            saveState();
        }
    } catch (error) {
        console.error('Gagal memproses data dari Firebase:', error);
    }
    hideBootLoading();
}, (error) => {
    console.error('Gagal membaca dari Firebase:', error);
    if (typeof showToast === 'function') showToast('Tidak Terhubung ☁️', 'Gagal memuat data dari cloud. Periksa koneksi internetmu.');
    hideBootLoading();
});

// 5. INDIKATOR STATUS KONEKSI CLOUD (ditampilkan kecil di sidebar)
database.ref('.info/connected').on('value', (snap) => {
    const el = document.getElementById('cloud-status');
    if (!el) return;
    if (snap.val() === true) {
        el.innerText = '☁️ Tersambung';
        el.classList.remove('cloud-status-off');
    } else {
        el.innerText = '☁️ Menghubungkan...';
        el.classList.add('cloud-status-off');
    }
});
