// Math Quiz Web Application Logic (with Account, History & Admin Dashboard)

// Storage Keys
const STORAGE_KEYS = {
  THEME: 'math_quiz_theme',
  CURRENT_USER: 'math_quiz_current_user',
  USERS_DB: 'math_quiz_users_db',
  USER_DATA_PREFIX: 'math_quiz_data_',
  ADMIN_PASS: 'math_quiz_admin_pass'
};

// Application State
const state = {
  currentUser: 'guest',
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
  history: [], // [{ id, number, chapterName, result: 'correct'|'incorrect', time: string }]
  testResults: [],
  isAdminUnlocked: false
};

// --- Password Hashing (SHA-256 via Web Crypto API with Fallback) ---
async function hashPassword(password) {
  const salted = password + "_math_salt_2026";
  
  if (window.crypto && window.crypto.subtle && window.crypto.subtle.digest) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(salted);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      console.warn('SubtleCrypto error, falling back:', e);
    }
  }

  // Fallback simple hash
  let h1 = 0xdeadbeef, h2 = 0x41c64e6d;
  for (let i = 0; i < salted.length; i++) {
    const ch = salted.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

// --- Account Management ---
function getUsersDB() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS_DB);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function saveUsersDB(db) {
  try {
    localStorage.setItem(STORAGE_KEYS.USERS_DB, JSON.stringify(db));
  } catch (e) {
    console.error('Failed to save users db:', e);
  }
}

async function registerUser(username, password) {
  const cleanUser = username.trim();
  if (!cleanUser || !password) return { success: false, message: 'ユーザー名とパスワードを入力してください。' };
  if (cleanUser.toLowerCase() === 'guest') return { success: false, message: '「guest」は予約名のため使用できません。' };

  const db = getUsersDB();
  if (db[cleanUser]) {
    return { success: false, message: 'このユーザー名は既に登録されています。「ログイン」タブからログインしてください。' };
  }

  const hash = await hashPassword(password);
  db[cleanUser] = {
    username: cleanUser,
    passwordHash: hash,
    createdAt: new Date().toISOString()
  };
  saveUsersDB(db);

  setCurrentUser(cleanUser);
  return { success: true };
}

async function loginUser(username, password) {
  const cleanUser = username.trim();
  if (!cleanUser || !password) return { success: false, message: 'ユーザー名とパスワードを入力してください。' };

  const db = getUsersDB();
  const user = db[cleanUser];
  
  if (!user) {
    return { 
      success: false, 
      isNotFound: true,
      message: `ユーザー「${cleanUser}」は見つかりませんでした。「新規登録」ボタンを押して登録してください。` 
    };
  }

  const hash = await hashPassword(password);
  if (user.passwordHash !== hash) {
    return { success: false, message: 'パスワードが間違っています。' };
  }

  setCurrentUser(cleanUser);
  return { success: true };
}

function logoutUser() {
  setCurrentUser('guest');
}

function setCurrentUser(username) {
  state.currentUser = username;
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, username);
  loadUserData();
  updateAuthUI();
  rebuildPool();
}

function updateAuthUI() {
  const authBtnText = document.getElementById('authBtnText');
  const userDisplay = document.getElementById('statCurrentUser');
  const authForm = document.getElementById('authForm');
  const logoutSection = document.getElementById('logoutSection');
  const loggedUserName = document.getElementById('loggedUserName');
  const authModalTitle = document.getElementById('authModalTitle');

  if (state.currentUser === 'guest') {
    authBtnText.textContent = 'ログイン / 登録';
    userDisplay.textContent = 'ゲスト';
    authForm.style.display = 'block';
    logoutSection.style.display = 'none';
    authModalTitle.textContent = 'アカウントで学習を記録';
  } else {
    authBtnText.textContent = `👤 ${state.currentUser}`;
    userDisplay.textContent = state.currentUser;
    authForm.style.display = 'none';
    logoutSection.style.display = 'flex';
    loggedUserName.textContent = state.currentUser;
    authModalTitle.textContent = 'アカウント設定';
  }
}

// --- User Progress Data Storage ---
function getUserDataKey(user = state.currentUser) {
  return `${STORAGE_KEYS.USER_DATA_PREFIX}${user}`;
}

function loadUserData() {
  try {
    const raw = localStorage.getItem(getUserDataKey());
    if (raw) {
      const data = JSON.parse(raw);
      state.bookmarks = new Set(data.bookmarks || []);
      state.stats = data.stats || { answered: 0, correct: 0, incorrect: 0 };
      state.history = data.history || [];
    } else {
      state.bookmarks = new Set();
      state.stats = { answered: 0, correct: 0, incorrect: 0 };
      state.history = [];
    }
  } catch (e) {
    state.bookmarks = new Set();
    state.stats = { answered: 0, correct: 0, incorrect: 0 };
    state.history = [];
  }
  updateStatsDisplay();
}

function saveUserData() {
  try {
    const data = {
      bookmarks: [...state.bookmarks],
      stats: state.stats,
      history: state.history.slice(0, 100)
    };
    localStorage.setItem(getUserDataKey(), JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save user data:', e);
  }
}

// --- Admin Panel Logic ---
function getAdminPassword() {
  return localStorage.getItem(STORAGE_KEYS.ADMIN_PASS) || 'admin';
}

function getAllAccountsSummary() {
  const db = getUsersDB();
  const list = [];

  // Registered users
  Object.keys(db).forEach(uname => {
    const u = db[uname];
    let udata = { stats: { answered: 0, correct: 0, incorrect: 0 }, bookmarks: [], history: [] };
    try {
      const raw = localStorage.getItem(getUserDataKey(uname));
      if (raw) udata = JSON.parse(raw);
    } catch (e) {}

    const total = (udata.stats.correct || 0) + (udata.stats.incorrect || 0);
    const acc = total > 0 ? Math.round(((udata.stats.correct || 0) / total) * 100) : 0;

    list.push({
      username: uname,
      createdAt: u.createdAt || '不明',
      answered: udata.stats.answered || 0,
      accuracy: acc,
      bookmarksCount: (udata.bookmarks || []).length,
      history: udata.history || [],
      isGuest: false
    });
  });

  // Guest data check
  try {
    const guestRaw = localStorage.getItem(getUserDataKey('guest'));
    if (guestRaw) {
      const gdata = JSON.parse(guestRaw);
      const total = (gdata.stats.correct || 0) + (gdata.stats.incorrect || 0);
      const acc = total > 0 ? Math.round(((gdata.stats.correct || 0) / total) * 100) : 0;
      if (gdata.stats.answered > 0 || (gdata.bookmarks || []).length > 0) {
        list.push({
          username: 'guest (未ログイン)',
          createdAt: 'ローカル',
          answered: gdata.stats.answered || 0,
          accuracy: acc,
          bookmarksCount: (gdata.bookmarks || []).length,
          history: gdata.history || [],
          isGuest: true
        });
      }
    }
  } catch (e) {}

  return list;
}

function renderAdminDashboard() {
  const users = getAllAccountsSummary();
  const totalUsersEl = document.getElementById('adminTotalUsers');
  const totalAnswersEl = document.getElementById('adminTotalAnswers');
  const avgAccuracyEl = document.getElementById('adminAvgAccuracy');
  const tbody = document.getElementById('adminUsersTbody');

  let totalAnswers = 0;
  let totalAccSum = 0;
  let activeUsersCount = 0;

  tbody.innerHTML = '';

  if (users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:1.5rem; color:var(--text-muted);">登録されたアカウントはまだありません。</td></tr>';
  } else {
    users.forEach(u => {
      totalAnswers += u.answered;
      if (u.answered > 0) {
        totalAccSum += u.accuracy;
        activeUsersCount++;
      }

      const isCurrent = state.currentUser === u.username;
      const dateStr = u.createdAt.includes('T') ? u.createdAt.split('T')[0] : u.createdAt;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <strong>${u.username}</strong>
          ${isCurrent ? '<span style="font-size:0.7rem; background:var(--accent-light); color:var(--accent-primary); padding:0.1rem 0.4rem; border-radius:4px; margin-left:0.3rem;">ログイン中</span>' : ''}
        </td>
        <td>${dateStr}</td>
        <td>${u.answered} 回</td>
        <td><strong>${u.accuracy}%</strong></td>
        <td>${u.bookmarksCount} 問</td>
        <td>
          <div style="display:flex; gap:0.3rem;">
            <button class="btn-sm-action btn-view-hist" data-username="${u.username}">履歴 (${u.history.length})</button>
            ${!u.isGuest ? `<button class="btn-sm-action danger btn-del-user" data-username="${u.username}">削除</button>` : ''}
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  totalUsersEl.textContent = users.filter(u => !u.isGuest).length;
  totalAnswersEl.textContent = totalAnswers;
  const avgAcc = activeUsersCount > 0 ? Math.round(totalAccSum / activeUsersCount) : 0;
  avgAccuracyEl.textContent = `${avgAcc}%`;

  // Attach table button events
  tbody.querySelectorAll('.btn-view-hist').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const uname = e.currentTarget.dataset.username;
      showUserHistoryDrilldown(uname);
    });
  });

  tbody.querySelectorAll('.btn-del-user').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const uname = e.currentTarget.dataset.username;
      if (confirm(`本当にユーザー「${uname}」を削除しますか？\nこの操作は取り消せません。`)) {
        deleteAccount(uname);
      }
    });
  });

  if (window.lucide) window.lucide.createIcons();
}

function showUserHistoryDrilldown(username) {
  const detailArea = document.getElementById('adminUserDetailArea');
  const nameEl = document.getElementById('detailUserName');
  const listEl = document.getElementById('adminUserHistoryList');

  nameEl.textContent = username;
  listEl.innerHTML = '';

  const cleanName = username.replace(' (未ログイン)', '');
  let udata = { history: [] };
  try {
    const raw = localStorage.getItem(getUserDataKey(cleanName));
    if (raw) udata = JSON.parse(raw);
  } catch (e) {}

  if (!udata.history || udata.history.length === 0) {
    listEl.innerHTML = '<div style="text-align:center; padding:1rem; color:var(--text-muted); font-size:0.85rem;">このユーザーの解答履歴はありません。</div>';
  } else {
    udata.history.forEach(item => {
      const div = document.createElement('div');
      div.className = 'history-item';
      div.innerHTML = `
        <div class="history-item-left">
          <span class="history-num">${item.number} <span style="font-size:0.75rem; color:var(--text-muted); font-weight:normal;">(${item.chapterName})</span></span>
          <span class="history-time">${item.time}</span>
        </div>
        <div>
          <span class="history-badge ${item.result}">
            ${item.result === 'correct' ? '⭕ 正解' : '❌ 要復習'}
          </span>
        </div>
      `;
      listEl.appendChild(div);
    });
  }

  detailArea.style.display = 'flex';
}

function deleteAccount(username) {
  const db = getUsersDB();
  delete db[username];
  saveUsersDB(db);
  localStorage.removeItem(getUserDataKey(username));

  if (state.currentUser === username) {
    logoutUser();
  }

  renderAdminDashboard();
  alert(`ユーザー「${username}」を削除しました。`);
}

function exportAllDataJSON() {
  const data = {
    exportedAt: new Date().toISOString(),
    users: getUsersDB(),
    accountsProgress: getAllAccountsSummary()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `math_quiz_backup_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// --- KaTeX Rendering ---
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

function autoAnnotateMath(text) {
  if (!text) return '';
  let str = text;

  // Σ
  str = str.replace(/Σ_\{([^}]+)\}\^\{([^}]+)\}/g, '$\\sum_{$1}^{$2}$');
  str = str.replace(/Σ_\{([^}]+)\}/g, '$\\sum_{$1}$');
  str = str.replace(/Σ/g, '$\\Sigma$');

  // lim
  str = str.replace(/lim_\{([^}]+)\}/g, '$\\lim_{$1}$');

  // ∫
  str = str.replace(/∫_\{([^}]+)\}\^\{([^}]+)\}/g, '$\\int_{$1}^{$2}$');
  str = str.replace(/∫/g, '$\\int$');

  // 改行
  str = str.replace(/\n/g, '<br>');

  return str;
}

// Shuffle with Linked Groups Preservation
// Ensures continuous/multi-part questions always appear consecutively in correct order
function shuffleWithGroups(list) {
  const units = [];
  const groupMap = new Map();

  list.forEach(q => {
    if (q.groupId) {
      if (!groupMap.has(q.groupId)) {
        groupMap.set(q.groupId, []);
      }
      groupMap.get(q.groupId).push(q);
    } else {
      units.push([q]);
    }
  });

  // Sort each group by its sequential groupOrder
  groupMap.forEach((items) => {
    items.sort((a, b) => (a.groupOrder || 0) - (b.groupOrder || 0));
    units.push(items);
  });

  // Shuffle the units (each unit is either a single question or an ordered array of linked questions)
  for (let i = units.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [units[i], units[j]] = [units[j], units[i]];
  }

  // Flatten
  const result = [];
  units.forEach(u => result.push(...u));
  return result;
}

// Rebuild pool
function rebuildPool() {
  let list = [...QUESTIONS_DATA];

  if (state.activeChapter !== 'all') {
    list = list.filter(q => q.chapter === state.activeChapter);
  }

  if (state.mode === 'bookmarks') {
    list = list.filter(q => state.bookmarks.has(q.id));
  }

  state.pool = shuffleWithGroups(list);

  if (state.mode === 'test10') {
    state.pool = state.pool.slice(0, 10);
    state.testResults = [];
  }

  state.currentIndex = 0;
  state.isAnswerVisible = false;
  renderCurrentQuestion();
  updateStatsDisplay();
}

// Render question
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

  document.getElementById('badgeChapter').textContent = q.chapterName;
  document.getElementById('badgeNumber').textContent = q.number;

  // Linked question group badge
  const badgeGroup = document.getElementById('badgeGroup');
  if (q.groupId && q.groupTotal > 1) {
    badgeGroup.style.display = 'inline-flex';
    badgeGroup.innerHTML = `<i data-lucide="link" style="width:0.75rem;height:0.75rem;"></i> 連問 (${q.groupOrder}/${q.groupTotal})`;
  } else {
    badgeGroup.style.display = 'none';
  }

  // Parent context (conditions from previous questions)
  const contextBox = document.getElementById('parentContextBox');
  const contextText = document.getElementById('parentContextText');
  if (q.parentContext) {
    contextBox.style.display = 'flex';
    contextText.innerHTML = autoAnnotateMath(q.parentContext);
    renderEquationsInElement(contextText);
  } else {
    contextBox.style.display = 'none';
  }

  const bookmarkBtn = document.getElementById('bookmarkBtn');
  if (state.bookmarks.has(q.id)) {
    bookmarkBtn.classList.add('active');
    bookmarkBtn.innerHTML = '<i data-lucide="bookmark-check"></i>';
  } else {
    bookmarkBtn.classList.remove('active');
    bookmarkBtn.innerHTML = '<i data-lucide="bookmark"></i>';
  }

  const questionEl = document.getElementById('questionText');
  questionEl.innerHTML = autoAnnotateMath(q.question);
  renderEquationsInElement(questionEl);

  // Render Image if available
  const imgContainer = document.getElementById('questionImageContainer');
  const imgEl = document.getElementById('questionImage');
  if (q.imageUrl) {
    imgContainer.style.display = 'flex';
    imgEl.src = q.imageUrl;
  } else {
    imgContainer.style.display = 'none';
    imgEl.src = '';
  }

  const answerEl = document.getElementById('answerText');
  answerEl.innerHTML = autoAnnotateMath(q.answer);
  renderEquationsInElement(answerEl);

  state.isAnswerVisible = false;
  answerContainer.classList.remove('visible');
  evalArea.classList.remove('visible');
  answerToggleBtn.innerHTML = '<i data-lucide="eye"></i> 解答を表示する <span style="font-size:0.75rem;opacity:0.7;">(Space)</span>';

  prevBtn.disabled = state.currentIndex === 0;
  prevBtn.style.opacity = state.currentIndex === 0 ? '0.5' : '1';
  counterText.textContent = `${state.currentIndex + 1} / ${state.pool.length}`;

  if (state.mode === 'test10' && state.currentIndex === state.pool.length - 1) {
    nextBtn.innerHTML = '結果を見る <i data-lucide="award"></i>';
  } else {
    nextBtn.innerHTML = '次の問題 <i data-lucide="chevron-right"></i>';
  }

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

// Navigation
function nextQuestion() {
  if (state.currentIndex < state.pool.length - 1) {
    state.currentIndex++;
    renderCurrentQuestion();
  } else if (state.mode === 'test10') {
    showTestResult();
  } else {
    state.pool = shuffleWithGroups(state.pool);
    state.currentIndex = 0;
    renderCurrentQuestion();
  }
}

function prevQuestion() {
  if (state.currentIndex > 0) {
    state.currentIndex--;
    renderCurrentQuestion();
  }
}

// Bookmark
function toggleBookmark() {
  if (state.pool.length === 0) return;
  const q = state.pool[state.currentIndex];
  if (state.bookmarks.has(q.id)) {
    state.bookmarks.delete(q.id);
  } else {
    state.bookmarks.add(q.id);
  }
  saveUserData();
  renderCurrentQuestion();
  updateStatsDisplay();
}

// Self Evaluation & History
function recordEvaluation(isCorrect) {
  if (!state.pool || state.pool.length === 0) return;
  const q = state.pool[state.currentIndex];
  state.stats.answered++;
  
  const now = new Date();
  const timeStr = `${now.getMonth() + 1}/${now.getDate()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  if (isCorrect) {
    state.stats.correct++;
    document.getElementById('evalCorrect').classList.add('selected');
    document.getElementById('evalIncorrect').classList.remove('selected');
  } else {
    state.stats.incorrect++;
    state.bookmarks.add(q.id);
    document.getElementById('evalIncorrect').classList.add('selected');
    document.getElementById('evalCorrect').classList.remove('selected');
  }

  state.history.unshift({
    id: q.id,
    number: q.number,
    chapterName: q.chapterName,
    result: isCorrect ? 'correct' : 'incorrect',
    time: timeStr
  });

  if (state.mode === 'test10') {
    state.testResults[state.currentIndex] = isCorrect;
  }

  saveUserData();
  updateStatsDisplay();
}

// Update Stats UI
function updateStatsDisplay() {
  const answeredEl = document.getElementById('statAnswered');
  const accuracyEl = document.getElementById('statAccuracy');
  const bookmarkCountEl = document.getElementById('statBookmarks');
  const bookmarkTabBadge = document.getElementById('bookmarkTabBadge');

  if (answeredEl) answeredEl.textContent = state.stats.answered;
  if (bookmarkCountEl) bookmarkCountEl.textContent = state.bookmarks.size;
  if (bookmarkTabBadge) bookmarkTabBadge.textContent = state.bookmarks.size;

  if (accuracyEl) {
    const total = state.stats.correct + state.stats.incorrect;
    const acc = total > 0 ? Math.round((state.stats.correct / total) * 100) : 0;
    accuracyEl.textContent = `${acc}%`;
  }
}

// History Modal
function openHistoryModal() {
  const modal = document.getElementById('historyModal');
  const container = document.getElementById('historyListContainer');
  container.innerHTML = '';

  if (!state.history || state.history.length === 0) {
    container.innerHTML = '<div style="text-align:center; padding:2rem; color:var(--text-muted);">まだ解答履歴がありません。<br>問題を解いて「解けた」「要復習」を押すとここにタイムラインが記録されます。</div>';
  } else {
    state.history.forEach(item => {
      const div = document.createElement('div');
      div.className = 'history-item';
      div.innerHTML = `
        <div class="history-item-left">
          <span class="history-num">${item.number} <span style="font-size:0.75rem; color:var(--text-muted); font-weight:normal;">(${item.chapterName})</span></span>
          <span class="history-time">${item.time}</span>
        </div>
        <div>
          <span class="history-badge ${item.result}">
            ${item.result === 'correct' ? '⭕ 正解' : '❌ 要復習'}
          </span>
        </div>
      `;
      div.style.cursor = 'pointer';
      div.title = 'クリックでこの問題を表示';
      div.addEventListener('click', () => {
        jumpToQuestion(item.id);
        closeHistoryModal();
      });
      container.appendChild(div);
    });
  }

  modal.classList.add('visible');
  if (window.lucide) window.lucide.createIcons();
}

function closeHistoryModal() {
  document.getElementById('historyModal').classList.remove('visible');
}

function jumpToQuestion(qId) {
  const target = QUESTIONS_DATA.find(q => q.id === qId);
  if (target) {
    state.pool = [target];
    state.currentIndex = 0;
    renderCurrentQuestion();
  }
}

// 10-Question Test Results
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

// Reset Stats
function resetStats() {
  const userText = state.currentUser === 'guest' ? 'ゲスト' : `ユーザー「${state.currentUser}」`;
  if (confirm(`${userText}の学習履歴・正答率の統計をリセットしますか？（ブックマークは保持されます）`)) {
    state.stats = { answered: 0, correct: 0, incorrect: 0 };
    state.history = [];
    saveUserData();
    updateStatsDisplay();
  }
}

// Theme
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem(STORAGE_KEYS.THEME, next);
}

// Keyboard
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

// Event Listeners
function setupEventListeners() {
  // Navigation
  document.getElementById('answerToggleBtn').addEventListener('click', toggleAnswer);
  document.getElementById('nextBtn').addEventListener('click', nextQuestion);
  document.getElementById('prevBtn').addEventListener('click', prevQuestion);
  document.getElementById('bookmarkBtn').addEventListener('click', toggleBookmark);

  // Self Evaluation
  document.getElementById('evalCorrect').addEventListener('click', () => recordEvaluation(true));
  document.getElementById('evalIncorrect').addEventListener('click', () => recordEvaluation(false));

  // Modals
  document.getElementById('modalCloseBtn').addEventListener('click', closeTestModal);
  document.getElementById('historyModalBtn').addEventListener('click', openHistoryModal);
  document.getElementById('historyModalClose').addEventListener('click', closeHistoryModal);

  // Theme & Reset
  document.getElementById('themeToggleBtn').addEventListener('click', toggleTheme);
  document.getElementById('resetStatsBtn').addEventListener('click', resetStats);

  // Tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      const target = e.currentTarget;
      target.classList.add('active');
      state.mode = target.dataset.mode;
      rebuildPool();
    });
  });

  // Chapters
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

  // Auth Modal Controls
  const authModal = document.getElementById('authModal');
  const authModalBtn = document.getElementById('authModalBtn');
  const authModalClose = document.getElementById('authModalClose');
  const tabToLogin = document.getElementById('tabToLogin');
  const tabToRegister = document.getElementById('tabToRegister');
  const authSubmitBtn = document.getElementById('authSubmitBtn');
  const authErrorMsg = document.getElementById('authErrorMsg');
  const logoutBtn = document.getElementById('logoutBtn');
  let authMode = 'login';

  function setAuthMode(mode) {
    authMode = mode;
    authErrorMsg.textContent = '';
    if (mode === 'login') {
      tabToLogin.classList.add('active');
      tabToRegister.classList.remove('active');
      authSubmitBtn.textContent = 'ログイン';
    } else {
      tabToRegister.classList.add('active');
      tabToLogin.classList.remove('active');
      authSubmitBtn.textContent = 'アカウント新規登録';
    }
  }

  authModalBtn.addEventListener('click', () => {
    authModal.classList.add('visible');
    authErrorMsg.textContent = '';
    if (window.lucide) window.lucide.createIcons();
  });

  authModalClose.addEventListener('click', () => {
    authModal.classList.remove('visible');
  });

  tabToLogin.addEventListener('click', () => setAuthMode('login'));
  tabToRegister.addEventListener('click', () => setAuthMode('register'));

  async function handleAuthAction(e) {
    if (e) e.preventDefault();
    const user = document.getElementById('authUsername').value.trim();
    const pass = document.getElementById('authPassword').value;
    authErrorMsg.textContent = '';

    if (!user || !pass) {
      authErrorMsg.textContent = 'ユーザー名とパスワードの両方を入力してください。';
      return;
    }

    if (authMode === 'register') {
      const res = await registerUser(user, pass);
      if (res.success) {
        authModal.classList.remove('visible');
        document.getElementById('authUsername').value = '';
        document.getElementById('authPassword').value = '';
        alert(`ユーザー「${user}」を新規登録し、ログインしました！\n進捗はこのアカウントに個別に記録されます。`);
      } else {
        authErrorMsg.textContent = res.message;
      }
    } else {
      const res = await loginUser(user, pass);
      if (res.success) {
        authModal.classList.remove('visible');
        document.getElementById('authUsername').value = '';
        document.getElementById('authPassword').value = '';
        alert(`ユーザー「${user}」としてログインしました！`);
      } else {
        if (res.isNotFound) {
          authErrorMsg.innerHTML = `${res.message} <br><button id="quickSwitchToRegister" style="margin-top:0.4rem; padding:0.2rem 0.6rem; border-radius:4px; border:1px solid var(--accent-primary); background:var(--accent-light); color:var(--accent-primary); cursor:pointer; font-weight:bold;">👉 「新規登録」タブに切り替える</button>`;
          const switchBtn = document.getElementById('quickSwitchToRegister');
          if (switchBtn) {
            switchBtn.addEventListener('click', () => setAuthMode('register'));
          }
        } else {
          authErrorMsg.textContent = res.message;
        }
      }
    }
  }

  document.getElementById('authForm').addEventListener('submit', (e) => {
    if (e) e.preventDefault();
    handleAuthAction(e);
  });

  logoutBtn.addEventListener('click', () => {
    logoutUser();
    authModal.classList.remove('visible');
    alert('ログアウトしました（ゲスト利用に戻りました）。');
  });

  // --- Admin Modal Controls ---
  const adminModal = document.getElementById('adminModal');
  const adminModalBtn = document.getElementById('adminModalBtn');
  const adminModalClose = document.getElementById('adminModalClose');
  const adminLockScreen = document.getElementById('adminLockScreen');
  const adminPanelContent = document.getElementById('adminPanelContent');
  const adminPassInput = document.getElementById('adminPassInput');
  const adminUnlockBtn = document.getElementById('adminUnlockBtn');
  const adminPassError = document.getElementById('adminPassError');
  const adminLockBtn = document.getElementById('adminLockBtn');
  const exportDataBtn = document.getElementById('exportDataBtn');
  const closeDetailBtn = document.getElementById('closeDetailBtn');

  adminModalBtn.addEventListener('click', () => {
    adminModal.classList.add('visible');
    adminPassError.textContent = '';
    if (state.isAdminUnlocked) {
      adminLockScreen.style.display = 'none';
      adminPanelContent.style.display = 'flex';
      renderAdminDashboard();
    } else {
      adminLockScreen.style.display = 'block';
      adminPanelContent.style.display = 'none';
      adminPassInput.value = '';
    }
    if (window.lucide) window.lucide.createIcons();
  });

  adminModalClose.addEventListener('click', () => {
    adminModal.classList.remove('visible');
  });

  function tryUnlockAdmin() {
    const entered = adminPassInput.value;
    const correct = getAdminPassword();
    if (entered === correct) {
      state.isAdminUnlocked = true;
      adminLockScreen.style.display = 'none';
      adminPanelContent.style.display = 'flex';
      renderAdminDashboard();
    } else {
      adminPassError.textContent = 'パスワードが違います（初期設定: admin）';
    }
  }

  adminUnlockBtn.addEventListener('click', tryUnlockAdmin);
  adminPassInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') tryUnlockAdmin();
  });

  adminLockBtn.addEventListener('click', () => {
    state.isAdminUnlocked = false;
    adminLockScreen.style.display = 'block';
    adminPanelContent.style.display = 'none';
    adminPassInput.value = '';
  });

  closeDetailBtn.addEventListener('click', () => {
    document.getElementById('adminUserDetailArea').style.display = 'none';
  });

  exportDataBtn.addEventListener('click', exportAllDataJSON);

  // Lightbox modal controls
  const imgEl = document.getElementById('questionImage');
  const lightboxModal = document.getElementById('imageLightboxModal');
  const lightboxImg = document.getElementById('lightboxImg');
  const closeLightboxBtn = document.getElementById('closeLightboxBtn');

  if (imgEl && lightboxModal) {
    imgEl.addEventListener('click', () => {
      lightboxImg.src = imgEl.src;
      lightboxModal.classList.add('visible');
    });

    closeLightboxBtn.addEventListener('click', () => {
      lightboxModal.classList.remove('visible');
    });

    lightboxModal.addEventListener('click', (e) => {
      if (e.target === lightboxModal) {
        lightboxModal.classList.remove('visible');
      }
    });
  }

  // Close modals on backdrop click
  window.addEventListener('click', (e) => {
    if (e.target === authModal) authModal.classList.remove('visible');
    const histModal = document.getElementById('historyModal');
    if (e.target === histModal) histModal.classList.remove('visible');
    if (e.target === adminModal) adminModal.classList.remove('visible');
  });

  // Keyboard
  window.addEventListener('keydown', handleKeyboard);
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  const savedUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || 'guest';
  state.currentUser = savedUser;

  const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);

  loadUserData();
  setupEventListeners();
  updateAuthUI();
  rebuildPool();

  if (window.lucide) {
    window.lucide.createIcons();
  }
});
