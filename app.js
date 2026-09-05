'use strict';

/* ---------- Core Sudoku engine (bitmask backtracking) ---------- */

const SIZE = 9;
const BOX = 3;

function boxIndex(row, col) {
  return Math.floor(row / BOX) * BOX + Math.floor(col / BOX);
}

function shuffle(arr, random = Math.random) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Generates a fully solved, valid 9x9 board (flat array of 81 numbers 1-9).
function generateFullSolution(random = Math.random) {
  const board = new Array(81).fill(0);
  const rowsUsed = new Array(9).fill(0);
  const colsUsed = new Array(9).fill(0);
  const boxUsed = new Array(9).fill(0);

  function fill(pos) {
    if (pos === 81) return true;
    const row = Math.floor(pos / 9);
    const col = pos % 9;
    const b = boxIndex(row, col);
    const candidates = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], random);
    for (const num of candidates) {
      const bit = 1 << num;
      if (rowsUsed[row] & bit || colsUsed[col] & bit || boxUsed[b] & bit) continue;
      board[pos] = num;
      rowsUsed[row] |= bit;
      colsUsed[col] |= bit;
      boxUsed[b] |= bit;
      if (fill(pos + 1)) return true;
      board[pos] = 0;
      rowsUsed[row] &= ~bit;
      colsUsed[col] &= ~bit;
      boxUsed[b] &= ~bit;
    }
    return false;
  }

  fill(0);
  return board;
}

// Counts solutions of a puzzle (flat array, 0 = blank) up to `limit`, using MRV heuristic.
function countSolutions(puzzle, limit) {
  const board = puzzle.slice();
  const rowsUsed = new Array(9).fill(0);
  const colsUsed = new Array(9).fill(0);
  const boxUsed = new Array(9).fill(0);
  const empties = [];

  for (let pos = 0; pos < 81; pos++) {
    const row = Math.floor(pos / 9);
    const col = pos % 9;
    const b = boxIndex(row, col);
    const val = board[pos];
    if (val === 0) {
      empties.push(pos);
    } else {
      const bit = 1 << val;
      rowsUsed[row] |= bit;
      colsUsed[col] |= bit;
      boxUsed[b] |= bit;
    }
  }

  let count = 0;

  function candidatesFor(pos) {
    const row = Math.floor(pos / 9);
    const col = pos % 9;
    const b = boxIndex(row, col);
    const used = rowsUsed[row] | colsUsed[col] | boxUsed[b];
    const list = [];
    for (let n = 1; n <= 9; n++) {
      if (!(used & (1 << n))) list.push(n);
    }
    return list;
  }

  function solve(remaining) {
    if (count >= limit) return;
    if (remaining.length === 0) {
      count++;
      return;
    }
    // pick the empty cell with fewest candidates (MRV)
    let bestIdx = -1;
    let bestCandidates = null;
    for (let i = 0; i < remaining.length; i++) {
      const cands = candidatesFor(remaining[i]);
      if (cands.length === 0) return; // dead end
      if (!bestCandidates || cands.length < bestCandidates.length) {
        bestCandidates = cands;
        bestIdx = i;
        if (cands.length === 1) break;
      }
    }
    const pos = remaining[bestIdx];
    const row = Math.floor(pos / 9);
    const col = pos % 9;
    const b = boxIndex(row, col);
    const rest = remaining.slice(0, bestIdx).concat(remaining.slice(bestIdx + 1));

    for (const num of bestCandidates) {
      const bit = 1 << num;
      board[pos] = num;
      rowsUsed[row] |= bit;
      colsUsed[col] |= bit;
      boxUsed[b] |= bit;
      solve(rest);
      board[pos] = 0;
      rowsUsed[row] &= ~bit;
      colsUsed[col] &= ~bit;
      boxUsed[b] &= ~bit;
      if (count >= limit) return;
    }
  }

  solve(empties);
  return count;
}

// Solves a puzzle assuming a unique solution exists; returns solved board or null.
function solvePuzzle(puzzle) {
  const board = puzzle.slice();
  const rowsUsed = new Array(9).fill(0);
  const colsUsed = new Array(9).fill(0);
  const boxUsed = new Array(9).fill(0);
  const empties = [];

  for (let pos = 0; pos < 81; pos++) {
    const row = Math.floor(pos / 9);
    const col = pos % 9;
    const b = boxIndex(row, col);
    const val = board[pos];
    if (val === 0) {
      empties.push(pos);
    } else {
      const bit = 1 << val;
      rowsUsed[row] |= bit;
      colsUsed[col] |= bit;
      boxUsed[b] |= bit;
    }
  }

  function candidatesFor(pos) {
    const row = Math.floor(pos / 9);
    const col = pos % 9;
    const b = boxIndex(row, col);
    const used = rowsUsed[row] | colsUsed[col] | boxUsed[b];
    const list = [];
    for (let n = 1; n <= 9; n++) {
      if (!(used & (1 << n))) list.push(n);
    }
    return list;
  }

  function solve(remaining) {
    if (remaining.length === 0) return true;
    let bestIdx = -1;
    let bestCandidates = null;
    for (let i = 0; i < remaining.length; i++) {
      const cands = candidatesFor(remaining[i]);
      if (cands.length === 0) return false;
      if (!bestCandidates || cands.length < bestCandidates.length) {
        bestCandidates = cands;
        bestIdx = i;
        if (cands.length === 1) break;
      }
    }
    const pos = remaining[bestIdx];
    const row = Math.floor(pos / 9);
    const col = pos % 9;
    const b = boxIndex(row, col);
    const rest = remaining.slice(0, bestIdx).concat(remaining.slice(bestIdx + 1));

    for (const num of bestCandidates) {
      const bit = 1 << num;
      board[pos] = num;
      rowsUsed[row] |= bit;
      colsUsed[col] |= bit;
      boxUsed[b] |= bit;
      if (solve(rest)) return true;
      board[pos] = 0;
      rowsUsed[row] &= ~bit;
      colsUsed[col] &= ~bit;
      boxUsed[b] &= ~bit;
    }
    return false;
  }

  if (solve(empties)) return board;
  return null;
}

const DIFFICULTY_CLUES = {
  easy: 40,
  medium: 32,
  hard: 26
};

function generatePuzzle(difficulty, random = Math.random) {
  const solution = generateFullSolution(random);
  const target = DIFFICULTY_CLUES[difficulty] ?? DIFFICULTY_CLUES.medium;
  const puzzle = solution.slice();
  const positions = shuffle([...Array(81).keys()], random);
  let clues = 81;

  for (const pos of positions) {
    if (clues <= target) break;
    const backup = puzzle[pos];
    puzzle[pos] = 0;
    const count = countSolutions(puzzle, 2);
    if (count === 1) {
      clues--;
    } else {
      puzzle[pos] = backup;
    }
  }

  return { puzzle, solution };
}

/* ---------- Seed encode/decode (puzzle save/load code) ----------
 *
 * Every random choice in generation comes from a deterministic PRNG. A saved
 * puzzle therefore needs only the generator version, difficulty, and seed:
 *
 *   version:     4 bits
 *   difficulty:  2 bits
 *   seed:        48 bits
 *
 * The resulting 54 bits fit exactly into 9 base64url characters.
 */

const DIFFICULTY_CODE = { easy: 0, medium: 1, hard: 2 };
const CODE_DIFFICULTY = ['easy', 'medium', 'hard'];
const BASE64URL_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const BASE64URL_LOOKUP = (() => {
  const map = {};
  for (let i = 0; i < BASE64URL_ALPHABET.length; i++) map[BASE64URL_ALPHABET[i]] = BigInt(i);
  return map;
})();
const CODE_VERSION = 1;
const SEED_BITS = 48n;
const SEED_MASK = (1n << SEED_BITS) - 1n;
const UINT64_MASK = (1n << 64n) - 1n;

function bigIntToBase64url(num) {
  if (num === 0n) return BASE64URL_ALPHABET[0];
  let out = '';
  const base = 64n;
  while (num > 0n) {
    const rem = num % base;
    out = BASE64URL_ALPHABET[Number(rem)] + out;
    num = num / base;
  }
  return out;
}

function base64urlToBigInt(str) {
  let num = 0n;
  const base = 64n;
  for (const ch of str) {
    const val = BASE64URL_LOOKUP[ch];
    if (val === undefined) throw new Error('Invalid character in code: ' + ch);
    num = num * base + val;
  }
  return num;
}

function createSeededRandom(seed) {
  let state = seed & UINT64_MASK;
  return () => {
    state = (state + 0x9e3779b97f4a7c15n) & UINT64_MASK;
    let value = state;
    value = ((value ^ (value >> 30n)) * 0xbf58476d1ce4e5b9n) & UINT64_MASK;
    value = ((value ^ (value >> 27n)) * 0x94d049bb133111ebn) & UINT64_MASK;
    value ^= value >> 31n;
    return Number(value >> 11n) / 9007199254740992;
  };
}

function createRandomSeed() {
  const words = new Uint32Array(2);
  crypto.getRandomValues(words);
  return (BigInt(words[0] & 0xffff) << 32n) | BigInt(words[1]);
}

function encodePuzzleCode(seed, difficulty) {
  const difficultyCode = DIFFICULTY_CODE[difficulty];
  if (difficultyCode === undefined) throw new Error('Unknown difficulty');

  const packed =
    (BigInt(CODE_VERSION) << 50n) |
    (BigInt(difficultyCode) << 48n) |
    (seed & SEED_MASK);

  return bigIntToBase64url(packed).padStart(9, BASE64URL_ALPHABET[0]);
}

function decodePuzzleCode(code) {
  const normalized = code.trim();
  if (!/^[A-Za-z0-9_-]{9}$/.test(normalized)) return null;

  try {
    const packed = base64urlToBigInt(normalized);
    const version = Number((packed >> 50n) & 0xfn);
    const difficultyCode = Number((packed >> 48n) & 0x3n);
    const difficulty = CODE_DIFFICULTY[difficultyCode];

    if (version !== CODE_VERSION || !difficulty) return null;

    return {
      seed: packed & SEED_MASK,
      difficulty
    };
  } catch (e) {
    return null;
  }
}

/* ---------- Color palette (matches the physical Colour Sudoku pegs) ---------- */

// Index 1-9 map to the puzzle's internal digit values; index 0 is "empty".
const COLORS = [
  null,
  { name: 'Red', hex: '#e63b27' },
  { name: 'Orange', hex: '#f2911b' },
  { name: 'Yellow', hex: '#f5d515' },
  { name: 'Green / teal', hex: '#639d80' },
  { name: 'Pale mint', hex: '#b3ded2' },
  { name: 'Light blue', hex: '#66a4cb' },
  { name: 'Purple', hex: '#916fbd' },
  { name: 'Pink', hex: '#df5688' },
  { name: 'Pale pink', hex: '#f7d4df' }
];

/* ---------- UI wiring ---------- */

const boardEl = document.getElementById('board');
const paletteEl = document.getElementById('palette');
const difficultyEl = document.getElementById('difficulty');
const newPuzzleBtn = document.getElementById('newPuzzleBtn');
const checkBtn = document.getElementById('checkBtn');
const solutionBtn = document.getElementById('solutionBtn');
const hashInput = document.getElementById('hashInput');
const copyBtn = document.getElementById('copyBtn');
const shareBtn = document.getElementById('shareBtn');
const saveBtn = document.getElementById('saveBtn');
const loadBtn = document.getElementById('loadBtn');
const savedList = document.getElementById('savedList');
const statusEl = document.getElementById('status');

const SAVED_STORAGE_KEY = 'sudoku_saved_puzzles';
const ACTIVE_GAME_KEY = 'sudoku_active_game';

let currentPuzzle = new Array(81).fill(0);
let currentSolution = new Array(81).fill(0);
let userValues = new Array(81).fill(0);
let currentSeed = 0n;
let cellButtons = [];
let pegSpans = [];
let solutionShown = false;
let selectedTool = 1; // 1-9 = color to place, 0 = eraser

function setStatus(msg, type = '') {
  statusEl.textContent = msg || '';
  statusEl.className = 'status' + (type ? ` ${type}` : '');
}

function setPeg(idx, colorValue) {
  const peg = pegSpans[idx];
  if (colorValue) {
    peg.style.backgroundColor = COLORS[colorValue].hex;
    peg.classList.add('filled');
    peg.title = COLORS[colorValue].name;
  } else {
    peg.style.backgroundColor = '';
    peg.classList.remove('filled');
    peg.title = 'Empty';
  }
}

function buildBoard() {
  boardEl.innerHTML = '';
  cellButtons = [];
  pegSpans = [];
  for (let i = 0; i < 81; i++) {
    const row = Math.floor(i / 9);
    const cell = document.createElement('div');
    cell.className = 'cell';
    if (row === 2 || row === 5) cell.classList.add('thick-bottom');

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'peg-btn';
    btn.dataset.index = String(i);

    const peg = document.createElement('span');
    peg.className = 'peg';
    btn.appendChild(peg);

    btn.addEventListener('click', onCellClick);
    btn.addEventListener('keydown', onCellKeyDown);

    cell.appendChild(btn);
    boardEl.appendChild(cell);
    cellButtons.push(btn);
    pegSpans.push(peg);
  }
}

function buildPalette() {
  paletteEl.innerHTML = '';
  for (let c = 1; c <= 9; c++) {
    const swatch = document.createElement('button');
    swatch.type = 'button';
    swatch.className = 'swatch';
    swatch.style.backgroundColor = COLORS[c].hex;
    swatch.title = COLORS[c].name;
    swatch.setAttribute('aria-label', COLORS[c].name);
    swatch.dataset.color = String(c);
    swatch.addEventListener('click', () => selectTool(c));
    paletteEl.appendChild(swatch);
  }
  const eraser = document.createElement('button');
  eraser.type = 'button';
  eraser.className = 'swatch eraser';
  eraser.title = 'Eraser';
  eraser.setAttribute('aria-label', 'Eraser');
  eraser.dataset.color = '0';
  eraser.textContent = '✕';
  eraser.addEventListener('click', () => selectTool(0));
  paletteEl.appendChild(eraser);

  updatePaletteSelection();
}

function selectTool(colorValue) {
  selectedTool = colorValue;
  updatePaletteSelection();
}

function updatePaletteSelection() {
  paletteEl.querySelectorAll('.swatch').forEach((el) => {
    el.classList.toggle('selected', Number(el.dataset.color) === selectedTool);
  });
}

function renderPuzzle() {
  solutionShown = false;
  solutionBtn.textContent = 'Show Solution';
  for (let i = 0; i < 81; i++) {
    const btn = cellButtons[i];
    const cellEl = btn.closest('.cell');
    const clueVal = currentPuzzle[i];
    cellEl.classList.remove('solution-shown');
    if (clueVal !== 0) {
      btn.disabled = true;
      cellEl.classList.add('clue');
      setPeg(i, clueVal);
    } else {
      btn.disabled = false;
      cellEl.classList.remove('clue');
      setPeg(i, userValues[i]);
    }
  }
}

function applyToolToCell(idx) {
  if (currentPuzzle[idx] !== 0 || solutionShown) return; // clues & solution view are locked
  userValues[idx] = selectedTool;
  setPeg(idx, selectedTool);
  saveActiveGame();
}

function onCellClick(e) {
  const idx = Number(e.currentTarget.dataset.index);
  applyToolToCell(idx);
  e.currentTarget.focus();
}

function onCellKeyDown(e) {
  const idx = Number(e.currentTarget.dataset.index);
  const row = Math.floor(idx / 9);
  const col = idx % 9;
  let target = -1;
  if (e.key === 'ArrowRight') target = row * 9 + Math.min(col + 1, 8);
  else if (e.key === 'ArrowLeft') target = row * 9 + Math.max(col - 1, 0);
  else if (e.key === 'ArrowDown') target = Math.min(row + 1, 8) * 9 + col;
  else if (e.key === 'ArrowUp') target = Math.max(row - 1, 0) * 9 + col;
  else if (e.key >= '1' && e.key <= '9') {
    // Keyboard shortcut: place the color matching this digit directly,
    // independent of the currently selected palette tool.
    e.preventDefault();
    if (currentPuzzle[idx] === 0 && !solutionShown) {
      userValues[idx] = Number(e.key);
      setPeg(idx, Number(e.key));
      saveActiveGame();
    }
    return;
  } else if (e.key === '0' || e.key === 'Backspace' || e.key === 'Delete') {
    e.preventDefault();
    if (currentPuzzle[idx] === 0 && !solutionShown) {
      userValues[idx] = 0;
      setPeg(idx, 0);
      saveActiveGame();
    }
    return;
  }
  if (target >= 0) {
    e.preventDefault();
    cellButtons[target].focus();
  }
}

function updateHashAndUrl() {
  const code = encodePuzzleCode(currentSeed, difficultyEl.value);
  hashInput.value = code;
  const url = new URL(window.location.href);
  url.searchParams.set('p', code);
  window.history.replaceState(null, '', url.toString());
}

function saveActiveGame() {
  try {
    const code = hashInput.value;
    if (!code) return;
    const data = {
      code,
      difficulty: difficultyEl.value,
      userValues
    };
    localStorage.setItem(ACTIVE_GAME_KEY, JSON.stringify(data));
  } catch (e) {
    // Ignore storage errors
  }
}

function newPuzzle() {
  setStatus('Generating puzzle...');
  // Let the status message paint before the (synchronous) generation work runs.
  setTimeout(() => {
    const difficulty = difficultyEl.value;
    currentSeed = createRandomSeed();
    const random = createSeededRandom(currentSeed);
    const { puzzle, solution } = generatePuzzle(difficulty, random);
    currentPuzzle = puzzle;
    currentSolution = solution;
    userValues = new Array(81).fill(0);
    renderPuzzle();
    updateHashAndUrl();
    saveActiveGame();
    setStatus('');
  }, 20);
}

function toggleSolution() {
  solutionShown = !solutionShown;
  solutionBtn.textContent = solutionShown ? 'Hide Solution' : 'Show Solution';

  for (let i = 0; i < 81; i++) {
    const btn = cellButtons[i];
    if (currentPuzzle[i] !== 0) continue; // clues never change
    const cellEl = btn.closest('.cell');
    if (solutionShown) {
      btn.disabled = true;
      cellEl.classList.add('solution-shown');
      setPeg(i, currentSolution[i]);
    } else {
      btn.disabled = false;
      cellEl.classList.remove('solution-shown');
      setPeg(i, userValues[i]);
    }
  }
}

function checkSolution() {
  if (solutionShown) {
    setStatus('Hide the solution before checking.', 'error');
    return;
  }

  let emptyCount = 0;
  let hasErrors = false;

  for (let i = 0; i < 81; i++) {
    if (currentPuzzle[i] !== 0) continue;
    if (userValues[i] === 0) {
      emptyCount++;
    } else if (userValues[i] !== currentSolution[i]) {
      hasErrors = true;
    }
  }

  if (emptyCount > 0) {
    setStatus(
      `Puzzle is incomplete (${emptyCount} empty ${emptyCount === 1 ? 'cell' : 'cells'} remaining).`,
      'error'
    );
  } else if (hasErrors) {
    setStatus('The solution is incorrect. Keep trying!', 'error');
  } else {
    setStatus('Congratulations! The solution is correct! 🎉\nYou are amazing, smart, loved and a sudoku master!', 'success');
  }
}

function getSavedPuzzles() {
  try {
    const raw = localStorage.getItem(SAVED_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function renderSavedPuzzles() {
  const saved = getSavedPuzzles();
  savedList.innerHTML = '';
  if (saved.length === 0) {
    savedList.innerHTML = '<p class="saved-empty">No saved puzzles yet. Click "Save" above to bookmark puzzles.</p>';
    return;
  }

  saved.forEach((item) => {
    const el = document.createElement('div');
    el.className = 'saved-item';

    const info = document.createElement('div');
    info.className = 'saved-info';

    const badge = document.createElement('span');
    badge.className = `badge badge-${item.difficulty || 'medium'}`;
    badge.textContent = item.difficulty || 'medium';

    const codeSpan = document.createElement('span');
    codeSpan.className = 'saved-code';
    codeSpan.textContent = item.code;

    const dateSpan = document.createElement('span');
    dateSpan.className = 'saved-date';
    dateSpan.textContent = item.date || '';

    info.appendChild(badge);
    info.appendChild(codeSpan);
    if (item.date) info.appendChild(dateSpan);

    const actions = document.createElement('div');
    actions.className = 'saved-actions';

    const playBtn = document.createElement('button');
    playBtn.type = 'button';
    playBtn.textContent = 'Load';
    playBtn.addEventListener('click', () => {
      hashInput.value = item.code;
      loadFromCode(item.code);
    });

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'btn-delete';
    delBtn.textContent = '✕';
    delBtn.title = 'Delete saved puzzle';
    delBtn.setAttribute('aria-label', `Delete saved puzzle ${item.code}`);
    delBtn.addEventListener('click', () => deleteSavedPuzzle(item.code));

    actions.appendChild(playBtn);
    actions.appendChild(delBtn);

    el.appendChild(info);
    el.appendChild(actions);
    savedList.appendChild(el);
  });
}

function saveCurrentPuzzle() {
  const code = hashInput.value;
  if (!decodePuzzleCode(code)) {
    setStatus('Cannot save invalid puzzle code.', 'error');
    return;
  }
  const saved = getSavedPuzzles();
  if (saved.some((item) => item.code === code)) {
    setStatus('Puzzle is already in your saved list! ⭐');
    return;
  }
  const dateStr = new Date().toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
  });
  saved.unshift({
    code,
    difficulty: difficultyEl.value,
    date: dateStr
  });
  try {
    localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(saved));
    renderSavedPuzzles();
    setStatus('Puzzle saved to your list! ⭐', 'success');
  } catch (e) {
    setStatus('Could not save puzzle (storage full or disabled).', 'error');
  }
}

function deleteSavedPuzzle(code) {
  let saved = getSavedPuzzles();
  saved = saved.filter((item) => item.code !== code);
  try {
    localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(saved));
  } catch (e) {}
  renderSavedPuzzles();
  setStatus('Puzzle removed from saved list.');
}

async function shareCurrentPuzzle() {
  const code = hashInput.value;
  const url = window.location.href;
  const shareData = {
    title: 'Colour Sudoku',
    text: `Try solving this Sudoku puzzle (${code})!`,
    url: url
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
      setStatus('Puzzle shared!');
      return;
    } catch (e) {
      if (e.name === 'AbortError') return;
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    setStatus('Puzzle link copied to clipboard!');
  } catch (e) {
    hashInput.select();
    document.execCommand('copy');
    setStatus('Puzzle code copied to clipboard.');
  }
}

function loadFromCode(code, savedUserValues = null, showStatus = true) {
  const decoded = decodePuzzleCode(code);
  if (!decoded) {
    setStatus('Invalid puzzle code. Enter exactly 9 characters.', 'error');
    return false;
  }

  if (savedUserValues === null) {
    try {
      const raw = localStorage.getItem(ACTIVE_GAME_KEY);
      if (raw) {
        const active = JSON.parse(raw);
        if (active && active.code === code && Array.isArray(active.userValues) && active.userValues.length === 81) {
          savedUserValues = active.userValues;
        }
      }
    } catch (e) {}
  }

  currentSeed = decoded.seed;
  difficultyEl.value = decoded.difficulty;
  const random = createSeededRandom(currentSeed);
  const { puzzle, solution } = generatePuzzle(decoded.difficulty, random);
  currentPuzzle = puzzle;
  currentSolution = solution;
  userValues = Array.isArray(savedUserValues) && savedUserValues.length === 81
    ? savedUserValues.slice()
    : new Array(81).fill(0);
  renderPuzzle();
  updateHashAndUrl();
  saveActiveGame();
  if (showStatus) {
    setStatus('Puzzle loaded.');
  }
  return true;
}

newPuzzleBtn.addEventListener('click', newPuzzle);
checkBtn.addEventListener('click', checkSolution);
solutionBtn.addEventListener('click', toggleSolution);
saveBtn.addEventListener('click', saveCurrentPuzzle);
shareBtn.addEventListener('click', shareCurrentPuzzle);
loadBtn.addEventListener('click', () => loadFromCode(hashInput.value));
copyBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(hashInput.value);
    setStatus('Puzzle code copied to clipboard.');
  } catch (e) {
    hashInput.select();
    document.execCommand('copy');
    setStatus('Puzzle code copied to clipboard.');
  }
});

buildBoard();
buildPalette();
renderSavedPuzzles();

// On load, check for a puzzle code in the URL (?p=...); otherwise restore active game or generate a fresh puzzle.
const urlParams = new URLSearchParams(window.location.search);
const initialCode = urlParams.get('p');
if (initialCode) {
  loadFromCode(initialCode, null, false);
} else {
  let restored = false;
  try {
    const raw = localStorage.getItem(ACTIVE_GAME_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data && data.code && decodePuzzleCode(data.code)) {
        loadFromCode(data.code, data.userValues, false);
        restored = true;
      }
    }
  } catch (e) {}
  if (!restored) {
    newPuzzle();
  }
}
