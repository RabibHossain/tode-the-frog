// 0.1 per second = 1 point for every 10 seconds survived
const SCORE_PER_SECOND = 0.1;
const SCORE_PER_KILL = 10;

// The name the high score is saved under in the browser's storage
const HIGH_SCORE_KEY = 'tode-the-frog-high-score';

let score = 0;
let highScore = 0;
let scoreElement = null;
let currentElement = null;
let bestElement = null;
let displayedScore = null;

// The page only shows whole points, rounded down
function render() {
  const rounded = Math.floor(score);
  if (rounded === displayedScore) return;

  displayedScore = rounded;
  currentElement.textContent = `Score: ${rounded}`;
}

function renderHighScore() {
  bestElement.textContent = `Best: ${highScore}`;
  // Nothing to show before the first game has been played
  bestElement.hidden = highScore === 0;
}

// The high score is kept in the browser, so it is still there after the page is closed.
// Storage can be switched off (some private windows), so every use is guarded.
function loadHighScore() {
  try {
    const saved = Number(localStorage.getItem(HIGH_SCORE_KEY));
    return Number.isFinite(saved) && saved > 0 ? Math.floor(saved) : 0;
  } catch {
    return 0;
  }
}

export function createScore() {
  scoreElement = document.createElement('div');
  scoreElement.className = 'score';

  currentElement = document.createElement('span');
  bestElement = document.createElement('span');
  bestElement.className = 'score-best';
  scoreElement.append(currentElement, bestElement);
  document.body.appendChild(scoreElement);

  highScore = loadHighScore();
  render();
  renderHighScore();

  return scoreElement;
}

export function getHighScore() {
  return highScore;
}

// Called when a game ends. Saves the score if it beats the high score.
// Returns true if it is a new high score.
export function saveHighScore() {
  const rounded = Math.floor(score);
  if (rounded <= highScore) return false;

  highScore = rounded;
  renderHighScore();
  try {
    localStorage.setItem(HIGH_SCORE_KEY, String(highScore));
  } catch {
    // Without storage the high score still counts until the page is closed
  }
  return true;
}

// Forgets the high score, on the page and in the browser's storage
export function resetHighScore() {
  highScore = 0;
  renderHighScore();
  try {
    localStorage.removeItem(HIGH_SCORE_KEY);
  } catch {
    // Nothing was stored, so there is nothing to remove
  }
}

export function getScore() {
  return score;
}

// `delta` is the time survived since the last frame, `kills` the enemies defeated in it.
// Stronger enemies count as more than one kill (a brute as 3), so `kills` can be a fraction.
export function updateScore(delta, kills) {
  score += delta * SCORE_PER_SECOND + kills * SCORE_PER_KILL;
  render();
}

export function resetScore() {
  score = 0;
  render();
}
