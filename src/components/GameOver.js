import { createHighScoreHint } from './HighScoreHint.js';
import { isTouchDevice } from './Touch.js';

let gameOverElement = null;
let finalScoreElement = null;
let bestElement = null;

export function createGameOver() {
  gameOverElement = document.createElement('div');
  gameOverElement.className = 'game-over';
  gameOverElement.hidden = true;

  const title = document.createElement('h1');
  title.textContent = 'Game Over';

  finalScoreElement = document.createElement('p');
  finalScoreElement.className = 'game-over-score';

  bestElement = document.createElement('p');
  bestElement.className = 'game-over-best';

  const hint = document.createElement('p');
  hint.textContent = isTouchDevice() ? 'Tap to play again' : 'Press Space to play again';

  gameOverElement.append(title, finalScoreElement, bestElement, hint, createHighScoreHint(false));
  document.body.appendChild(gameOverElement);

  return gameOverElement;
}

export function showGameOver(score, highScore, isNewHighScore) {
  finalScoreElement.textContent = `Score: ${Math.floor(score)}`;
  bestElement.textContent = isNewHighScore ? 'New high score!' : `Best: ${highScore}`;
  bestElement.classList.toggle('game-over-new-best', isNewHighScore);
  // Before the first points are scored there is no best to show
  bestElement.hidden = highScore === 0;
  gameOverElement.hidden = false;
}

// Empties the high score line after the high score has been reset
export function clearGameOverBest() {
  bestElement.textContent = '';
}

export function hideGameOver() {
  gameOverElement.hidden = true;
}
