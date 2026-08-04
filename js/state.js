// =====================================================
// STATE — Buku Harian Kita (Retro Scrapbook Diary)
// Disimpan di localStorage browser (tidak ada cloud sync di versi ini)
// =====================================================

const STORAGE_KEY = 'buku_harian_kita_v1';

let appState = {
    unlocked: false,
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
        {
            id: 1,
            img: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=600',
            caption: 'Hari itu, langit sore jadi saksi.',
            date: '2026-06-10',
            tape: 'rose'
        },
        {
            id: 2,
            img: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=600',
            caption: 'Ketawa sampai perut sakit.',
            date: '2026-06-24',
            tape: 'mustard'
        }
    ],
    diaryEntries: [
        {
            id: 1,
            author: 'creator',
            date: '2026-07-22',
            mood: '🥰',
            title: 'Halaman Pertama',
            content: 'Mulai dari sini, kita simpan cerita kita berdua. Setiap hal kecil, biar tidak lupa.'
        }
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
    ]
};

function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            appState = { ...appState, ...parsed, settings: { ...appState.settings, ...(parsed.settings || {}) } };
        }
    } catch (e) {
        console.error('Gagal memuat data dari localStorage:', e);
    }
}

function saveState() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    } catch (e) {
        console.error('Gagal menyimpan data ke localStorage:', e);
    }
}

loadState();
