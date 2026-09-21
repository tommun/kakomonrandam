// Math Quiz Web Application Logic

// Local Storage Keys
const STORAGE_KEYS = {
  THEME: 'math_quiz_theme',
  BOOKMARKS: 'math_quiz_bookmarks',
  STATS: 'math_quiz_stats',
  RESULTS: 'math_quiz_results'
};

// Application State
const state = {
  mode: 'infinite', // 'infinite', 'test10', 'bookmarks'
  activeChapter: 'all', // 'all', 1, 2, ..., 8
  pool: [],
  currentIndex: 0,
  isAnswerVisible: false,
  bookmarks: new Set(),
  stats: {
    answered: 0,
    correct: 0,
    incorrect: 0
  },
  testResults: [], // For 10-question test mode
  history: [] // Question IDs seen in current session
};

// Render equations using KaTeX auto-render or direct KaTeX calls
function renderEquationsInElement(element) {
  if (window.renderMathInElement) {
    try {
      window.renderMathInElement(element, {
        delimiters: [
          {left: '$$', right: '$$', display: true},
          {left: '$', right: '$', display: false},
          {left: '\\(', right: '\\)', display: false},
          {left: '\\[', right: '\\]', display: true}
        ],
        throwOnError: false
      });
    } catch (err) {
      console.warn('KaTeX render error:', err);
    }
  }
}

// Enhances text with math delimiters where appropriate
function autoAnnotateMath(text) {
  if (!text) return '';
  let str = text;

  // Σ記号の処理: Σ_{k=1}^{n} や Σ_{k=1}^{10} など
  str = str.replace(/Σ_\{([^}]+)\}\^\{([^}]+)\}/g, '$\\sum_{$1}^{$2}$');
  str = str.replace(/Σ_\{([^}]+)\}/g, '$\\sum_{$1}$');
  str = str.replace(/Σ/g, '$\\Sigma$');

  // 極限: lim_{n->∞}
  str = str.replace(/lim_\{([^}]+)\}/g, '$\\lim_{$1}$');

  // 積分: ∫_{0}^{a}
  str = str.replace(/∫_\{([^}]+)\}\^\{([^}]+)\}/g, '$\\int_{$1}^{$2}$');
  str = str.replace(/∫/g, '$\\int$');

  // 改行をbrに
  str = str.replace(/\n/g, '<br>');

  return str;
}

// Shuffle array (Fisher-Yates)
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Storage helpers
function loadStorage() {
  try {
    const savedBookmarks = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
    if (savedBookmarks) {
      state.bookmarks = new Set(JSON.parse(savedBookmarks));
    }
    const savedStats = localStorage.getItem(STORAGE_KEYS.STATS);
    if (savedStats) {
      state.stats = JSON.parse(savedStats);
    }
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
  } catch (e) {
    console.error('Failed to load local storage:', e);
  }
}

function saveStorage() {
  try {
    localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify([...state.bookmarks]));
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(state.stats));
  } catch (e) {
    console.error('Failed to save to local storage:', e);
  }
}

// Build question pool based on mode & chapter
function rebuildPool() {
  let list = [...QUESTIONS_DATA];

  // Chapter filter
  if (state.activeChapter !== 'all') {
    list = list.filter(q => q.chapter === state.activeChapter);
  }

  // Mode filter
  if (state.mode === 'bookmarks') {
    list = list.filter(q => state.bookmarks.has(q.id));
  }

  // Shuffle
  state.pool = shuffle(list);

  // Limit for 10-question test
  if (state.mode === 'test10') {
    state.pool = state.pool.slice(0, 10);
    state.testResults = [];
  }

  state.currentIndex = 0;
  state.isAnswerVisible = false;
  renderCurrentQuestion();
  updateStatsDisplay();
}

// Render current question
function renderCurrentQuestion() {
  const card = document.getElementById('quizCard');
  const emptyState = document.getElementById('emptyState');
  const counterText = document.getElementById('cardCounter');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const answerContainer = document.getElementById('answerContainer');
  const evalArea = document.getElementById('evalArea');
  const answerToggleBtn = document.getElementById('answerToggleBtn');

  if (!state.pool || state.pool.length === 0) {
    card.style.display = 'none';
    emptyState.classList.add('visible');
    return;
  }

  card.style.display = 'flex';
  emptyState.classList.remove('visible');

  const q = state.pool[state.currentIndex];

  // Badge & Number
  document.getElementById('badgeChapter').textContent = q.chapterName;
  document.getElementById('badgeNumber').textContent = q.number;

  // Bookmark status
  const bookmarkBtn = document.getElementById('bookmarkBtn');
  if (state.bookmarks.has(q.id)) {
    bookmarkBtn.classList.add('active');
    bookmarkBtn.innerHTML = '<i data-lucide="bookmark-check"></i>';
  } else {
    bookmarkBtn.classList.remove('active');
    bookmarkBtn.innerHTML = '<i data-lucide="bookmark"></i>';
  }

  // Question Text
  const questionEl = document.getElementById('questionText');
  questionEl.innerHTML = autoAnnotateMath(q.question);
  renderEquationsInElement(questionEl);

  // Answer Text
  const answerEl = document.getElementById('answerText');
  answerEl.innerHTML = autoAnnotateMath(q.answer);
  renderEquationsInElement(answerEl);

  // Answer Visibility State
  state.isAnswerVisible = false;
  answerContainer.classList.remove('visible');
  evalArea.classList.remove('visible');
  answerToggleBtn.innerHTML = '<i data-lucide="eye"></i> 解答を表示する <span style="font-size:0.75rem;opacity:0.7;">(Space)</span>';

  // Navigation state
  prevBtn.disabled = state.currentIndex === 0;
  prevBtn.style.opacity = state.currentIndex === 0 ? '0.5' : '1';
  counterText.textContent = `${state.currentIndex + 1} / ${state.pool.length}`;

  if (state.mode === 'test10' && state.currentIndex === state.pool.length - 1) {
    nextBtn.innerHTML = '結果を見る <i data-lucide="award"></i>';
  } else {
    nextBtn.innerHTML = '次の問題 <i data-lucide="chevron-right"></i>';
  }

  // Reset evaluation highlight
  resetEvaluationButtons();

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function resetEvaluationButtons() {
  document.getElementById('evalCorrect').classList.remove('selected');
  document.getElementById('evalIncorrect').classList.remove('selected');
}

// Toggle Answer
function toggleAnswer() {
  const answerContainer = document.getElementById('answerContainer');
  const evalArea = document.getElementById('evalArea');
  const answerToggleBtn = document.getElementById('answerToggleBtn');

  state.isAnswerVisible = !state.isAnswerVisible;

  if (state.isAnswerVisible) {
    answerContainer.classList.add('visible');
    evalArea.classList.add('visible');
    answerToggleBtn.innerHTML = '<i data-lucide="eye-off"></i> 解答を隠す';
  } else {
    answerContainer.classList.remove('visible');
    evalArea.classList.remove('visible');
    answerToggleBtn.innerHTML = '<i data-lucide="eye"></i> 解答を表示する <span style="font-size:0.75rem;opacity:0.7;">(Space)</span>';
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// Next Question
function nextQuestion() {
  if (state.currentIndex < state.pool.length - 1) {
    state.currentIndex++;
    renderCurrentQuestion();
  } else if (state.mode === 'test10') {
    showTestResult();
  } else {
    // In infinite mode, loop or reshuffle
    state.pool = shuffle(state.pool);
    state.currentIndex = 0;
    renderCurrentQuestion();
  }
}

// Previous Question
function prevQuestion() {
  if (state.currentIndex > 0) {
    state.currentIndex--;
    renderCurrentQuestion();
  }
}

// Bookmark Toggle
function toggleBookmark() {
  if (state.pool.length === 0) return;
  const q = state.pool[state.currentIndex];
  if (state.bookmarks.has(q.id)) {
    state.bookmarks.delete(q.id);
  } else {
    state.bookmarks.add(q.id);
  }
  saveStorage();
  renderCurrentQuestion();
  updateStatsDisplay();
}

// Self Evaluation
function recordEvaluation(isCorrect) {
  if (!state.pool || state.pool.length === 0) return;
  const q = state.pool[state.currentIndex];
  state.stats.answered++;
  if (isCorrect) {
    state.stats.correct++;
    document.getElementById('evalCorrect').classList.add('selected');
    document.getElementById('evalIncorrect').classList.remove('selected');
  } else {
    state.stats.incorrect++;
    // Auto-bookmark on incorrect
    state.bookmarks.add(q.id);
    document.getElementById('evalIncorrect').classList.add('selected');
    document.getElementById('evalCorrect').classList.remove('selected');
  }

  if (state.mode === 'test10') {
    state.testResults[state.currentIndex] = isCorrect;
  }

  saveStorage();
  updateStatsDisplay();
}

// Update Stats in Top Bar
function updateStatsDisplay() {
  const answeredEl = document.getElementById('statAnswered');
  const accuracyEl = document.getElementById('statAccuracy');
  const bookmarkCountEl = document.getElementById('statBookmarks');
  const totalQuestionsEl = document.getElementById('statTotal');

  if (answeredEl) answeredEl.textContent = state.stats.answered;
  if (totalQuestionsEl) totalQuestionsEl.textContent = QUESTIONS_DATA.length;
  if (bookmarkCountEl) {
    bookmarkCountEl.textContent = state.bookmarks.size;
    const bookmarkTabBadge = document.getElementById('bookmarkTabBadge');
    if (bookmarkTabBadge) bookmarkTabBadge.textContent = state.bookmarks.size;
  }

  if (accuracyEl) {
    const total = state.stats.correct + state.stats.incorrect;
    const acc = total > 0 ? Math.round((state.stats.correct / total) * 100) : 0;
    accuracyEl.textContent = `${acc}%`;
  }
}

// Show Test Modal
function showTestResult() {
  const modal = document.getElementById('testResultModal');
  const scoreEl = document.getElementById('modalScore');
  const textEl = document.getElementById('modalText');

  const correctCount = state.testResults.filter(Boolean).length;
  const total = state.pool.length;
  const scorePercent = Math.round((correctCount / total) * 100);

  scoreEl.textContent = `${correctCount} / ${total}`;
  textEl.textContent = `正答率: ${scorePercent}%！ お疲れさまでした。間違えた問題は「要復習」タブから集中して解き直すことができます。`;

  modal.classList.add('visible');
  if (window.lucide) window.lucide.createIcons();
}

function closeTestModal() {
  document.getElementById('testResultModal').classList.remove('visible');
  rebuildPool();
}

// Reset stats
function resetStats() {
  if (confirm('解答履歴・正答率の統計をリセットしますか？（ブックマークは保持されます）')) {
    state.stats = { answered: 0, correct: 0, incorrect: 0 };
    saveStorage();
    updateStatsDisplay();
  }
}

// Theme Toggle
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem(STORAGE_KEYS.THEME, next);
}

// Keyboard shortcuts
function handleKeyboard(e) {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

  if (e.code === 'Space') {
    e.preventDefault();
    toggleAnswer();
  } else if (e.code === 'ArrowRight' || e.code === 'Enter') {
    e.preventDefault();
    nextQuestion();
  } else if (e.code === 'ArrowLeft') {
    e.preventDefault();
    prevQuestion();
  } else if (e.key === '1') {
    e.preventDefault();
    if (state.isAnswerVisible) recordEvaluation(true);
  } else if (e.key === '2') {
    e.preventDefault();
    if (state.isAnswerVisible) recordEvaluation(false);
  } else if (e.key === 'b' || e.key === 'B') {
    e.preventDefault();
    toggleBookmark();
  }
}

// Setup Event Listeners
function setupEventListeners() {
  document.getElementById('answerToggleBtn').addEventListener('click', toggleAnswer);
  document.getElementById('nextBtn').addEventListener('click', nextQuestion);
  document.getElementById('prevBtn').addEventListener('click', prevQuestion);
  document.getElementById('bookmarkBtn').addEventListener('click', toggleBookmark);

  document.getElementById('evalCorrect').addEventListener('click', () => recordEvaluation(true));
  document.getElementById('evalIncorrect').addEventListener('click', () => recordEvaluation(false));

  document.getElementById('modalCloseBtn').addEventListener('click', closeTestModal);

  document.getElementById('themeToggleBtn').addEventListener('click', toggleTheme);
  document.getElementById('resetStatsBtn').addEventListener('click', resetStats);

  // Mode Tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      const target = e.currentTarget;
      target.classList.add('active');
      state.mode = target.dataset.mode;
      rebuildPool();
    });
  });

  // Chapter Chips
  document.querySelectorAll('.chip-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.chip-btn').forEach(b => b.classList.remove('active'));
      const target = e.currentTarget;
      target.classList.add('active');
      const chap = target.dataset.chapter;
      state.activeChapter = chap === 'all' ? 'all' : parseInt(chap, 10);
      rebuildPool();
    });
  });

  // Keyboard
  window.addEventListener('keydown', handleKeyboard);
}

// Initialization on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  loadStorage();
  setupEventListeners();
  rebuildPool();
  if (window.lucide) {
    window.lucide.createIcons();
  }
});
