// ── State ──────────────────────────────────────
let currentCode    = null;
let currentSquares = [];
let currentGrid    = [];

// ── Screens ────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
}

// ── Home ───────────────────────────────────────
async function joinRoom() {
  const input = document.getElementById('code-input');
  const code  = input.value.trim().toUpperCase();
  const err   = document.getElementById('home-error');
  err.textContent = '';

  if (!code) { err.textContent = 'enter a code first!'; return; }

  setLoading('screen-home', true);
  const room = await db.getRoom(code);
  setLoading('screen-home', false);

  if (!room) {
    err.textContent = `no room found for "${code}" — try creating it instead`;
    return;
  }

  loadRoom(code, room.squares ?? []);
}

async function createRoom() {
  const input = document.getElementById('code-input');
  const code  = input.value.trim().toUpperCase();
  const err   = document.getElementById('home-error');
  err.textContent = '';

  if (!code) { err.textContent = 'enter a code to use for your room!'; return; }
  if (!/^[A-Z0-9_\-]{1,12}$/.test(code)) {
    err.textContent = 'use letters, numbers, hyphens or underscores only';
    return;
  }

  setLoading('screen-home', true);
  const existing = await db.getRoom(code);
  if (existing) {
    setLoading('screen-home', false);
    err.textContent = `"${code}" already exists — just click join!`;
    return;
  }

  const room = await db.createRoom(code);
  setLoading('screen-home', false);

  if (!room) { err.textContent = 'something went wrong, try again'; return; }
  loadRoom(code, []);
}

function goHome() {
  currentCode    = null;
  currentSquares = [];
  document.getElementById('code-input').value = '';
  showScreen('screen-home');
}

// ── Room ───────────────────────────────────────
function loadRoom(code, squares) {
  currentCode    = code;
  currentSquares = squares;

  document.getElementById('room-code-display').textContent = code;
  document.getElementById('square-input').value = '';
  document.getElementById('add-error').textContent = '';
  renderSquaresList();
  showScreen('screen-room');
}

function renderSquaresList() {
  const list  = document.getElementById('squares-list');
  const count = document.getElementById('square-count');
  const hint  = document.getElementById('generate-hint');
  const btn   = document.getElementById('generate-btn');
  const n     = currentSquares.length;

  count.textContent = `${n} square${n === 1 ? '' : 's'}`;

  if (n === 0) {
    list.innerHTML = '<p class="empty-msg">no squares yet — add some!</p>';
  } else {
    list.innerHTML = currentSquares.map((sq, i) => `
      <div class="square-item">
        <span class="square-text">${escapeHtml(sq)}</span>
        <button class="delete-btn" onclick="deleteSquare(${i})" title="remove">✕</button>
      </div>
    `).join('');
  }

  if (n < 25) {
    hint.textContent = n === 0 ? '' : `need ${25 - n} more to generate a full card`;
    btn.disabled = true;
  } else {
    hint.textContent = '';
    btn.disabled = false;
  }
}

async function addSquare() {
  const input = document.getElementById('square-input');
  const text  = input.value.trim();
  const err   = document.getElementById('add-error');
  err.textContent = '';

  if (!text) { err.textContent = 'write something first!'; return; }
  if (currentSquares.includes(text)) {
    err.textContent = 'that square is already in the list';
    return;
  }

  const newSquares = [...currentSquares, text];
  setLoading('screen-room', true);
  const ok = await db.updateSquares(currentCode, newSquares);
  setLoading('screen-room', false);

  if (!ok) { err.textContent = 'failed to save, try again'; return; }

  currentSquares = newSquares;
  input.value = '';
  input.focus();
  renderSquaresList();
}

async function deleteSquare(index) {
  const newSquares = currentSquares.filter((_, i) => i !== index);
  setLoading('screen-room', true);
  const ok = await db.updateSquares(currentCode, newSquares);
  setLoading('screen-room', false);

  if (ok) {
    currentSquares = newSquares;
    renderSquaresList();
  }
}

// allow pressing Enter to add a square
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('square-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') addSquare();
  });
  document.getElementById('code-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') joinRoom();
  });
});

function goRoom() {
  showScreen('screen-room');
}

// ── Grid ───────────────────────────────────────
function generateGrid() {
  if (currentSquares.length < 25) return;

  // shuffle and pick 25
  const shuffled = [...currentSquares].sort(() => Math.random() - 0.5);
  const picked   = shuffled.slice(0, 25);

  // place FREE SPACE in centre (index 12)
  const withFree = [...picked];
  withFree[12] = '__FREE__';

  currentGrid = withFree;
  renderGrid();
  showScreen('screen-grid');
}

function renderGrid() {
  const grid = document.getElementById('bingo-grid');
  grid.innerHTML = currentGrid.map((sq, i) => {
    if (sq === '__FREE__') {
      return `<div class="bingo-cell free-space">FREE<br>SPACE</div>`;
    }
    return `<div class="bingo-cell" onclick="toggleCell(this)">${escapeHtml(sq)}</div>`;
  }).join('');
}

function toggleCell(el) {
  el.classList.toggle('marked');
}

// ── Helpers ────────────────────────────────────
function setLoading(screenId, on) {
  document.getElementById(screenId).classList.toggle('loading', on);
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
