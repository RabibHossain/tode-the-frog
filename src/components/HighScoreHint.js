import { isTouchDevice } from './Touch.js';

export const HINT_IDLE = 'idle';
export const HINT_CONFIRM = 'confirm';
export const HINT_DONE = 'done';

// One hint per screen that offers the reset (the start screen and the "Game Over" screen)
const hints = [];

// A small line of text that explains how to reset the high score.
// `withBest` also shows the high score itself, for screens that don't show it elsewhere.
export function createHighScoreHint(withBest) {
  const element = document.createElement('p');
  element.className = 'high-score-hint';
  element.hidden = true;
  hints.push({ element, withBest });

  return element;
}

// `state` is where the reset stands: nothing pressed yet, waiting for the second press, or just done
export function updateHighScoreHints(highScore, state) {
  // On a phone the line itself is tapped instead of the R key
  const press = isTouchDevice() ? 'Tap here' : 'Press R';

  for (const { element, withBest } of hints) {
    // With no high score there is nothing to reset, so the hint is hidden
    element.hidden = highScore === 0 && state !== HINT_DONE;

    if (state === HINT_DONE) {
      element.textContent = 'High score reset';
    } else if (state === HINT_CONFIRM) {
      element.textContent = `${press} again to reset the high score`;
    } else if (withBest) {
      element.textContent = `Best: ${highScore} · ${press} to reset`;
    } else {
      element.textContent = `${press} to reset the high score`;
    }
  }
}
