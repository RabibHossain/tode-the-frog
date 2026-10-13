import { isTouchDevice } from './Touch.js';

let pauseElement = null;

export function createPause() {
  pauseElement = document.createElement('div');
  pauseElement.className = 'pause';
  pauseElement.hidden = true;

  const title = document.createElement('h1');
  title.textContent = 'Paused';

  const hint = document.createElement('p');
  hint.textContent = isTouchDevice() ? 'Tap to continue' : 'Press P to continue';

  pauseElement.append(title, hint);
  document.body.appendChild(pauseElement);

  return pauseElement;
}

export function showPause() {
  pauseElement.hidden = false;
}

export function hidePause() {
  pauseElement.hidden = true;
}
