import { unlockAudio } from './Sound.js';

// Milliseconds between hops while a direction button is held down
const HOLD_REPEAT_INTERVAL = 150;

// The map is seen from a corner, so each arrow key moves Tode diagonally on screen.
// The buttons are laid out and labelled the way Tode actually moves.
const PAD_BUTTONS = [
  { label: '↖', key: 'ArrowLeft', name: 'Hop up-left' },
  { label: '↗', key: 'ArrowUp', name: 'Hop up-right' },
  { label: '↙', key: 'ArrowDown', name: 'Hop down-left' },
  { label: '↘', key: 'ArrowRight', name: 'Hop down-right' },
];

// True on phones and tablets, where the main way to point is a finger
export function isTouchDevice() {
  return window.matchMedia('(pointer: coarse)').matches;
}

// Touch buttons work by pretending a key was pressed, so the rest of the game
// needs no separate code for touch
function pressKey(key) {
  window.dispatchEvent(new KeyboardEvent('keydown', { key, code: key }));
}

function createButton({ label, key, name }, className, repeatWhileHeld = false) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.textContent = label;
  button.setAttribute('aria-label', name);

  let repeatTimer = null;
  const stopRepeating = () => {
    clearInterval(repeatTimer);
    repeatTimer = null;
  };

  // Reacts when the finger goes down, not when it lifts, so the game feels immediate
  button.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    pressKey(key);
    if (repeatWhileHeld) {
      stopRepeating();
      repeatTimer = setInterval(() => pressKey(key), HOLD_REPEAT_INTERVAL);
    }
  });
  for (const type of ['pointerup', 'pointercancel', 'pointerleave']) {
    button.addEventListener(type, stopRepeating);
  }
  // Stops a long press from opening the browser's menu
  button.addEventListener('contextmenu', (event) => event.preventDefault());

  return button;
}

// A tap anywhere on a screen does what the screen's key would do.
// Like the buttons, it reacts when the finger goes down. That matters for the pause button:
// the finger that pressed it must not also count as a tap on the pause screen that appears under it.
function tapToPress(selector, key) {
  document.querySelector(selector).addEventListener('pointerdown', () => pressKey(key));
}

// A screen that covers everything while the phone is held upright, asking the player to turn it.
// The stylesheet shows it in portrait and hides it in landscape.
function createRotateHint() {
  const hint = document.createElement('div');
  hint.className = 'rotate-hint';

  const phone = document.createElement('div');
  phone.className = 'rotate-hint-phone';

  const text = document.createElement('p');
  text.textContent = 'Turn your phone sideways to play';

  hint.append(phone, text);
  return hint;
}

// True while a touch device is held upright
export function isPortrait() {
  return isTouchDevice() && window.matchMedia('(orientation: portrait)').matches;
}

// Calls `callback` every time a touch device is turned upright
export function onTurnedPortrait(callback) {
  window.matchMedia('(orientation: portrait)').addEventListener('change', (event) => {
    if (event.matches && isTouchDevice()) callback();
  });
}

// Adds the on-screen buttons. Does nothing on devices with a mouse and keyboard.
// Call it after the start, pause and "Game Over" screens have been created.
export function createTouchControls() {
  if (!isTouchDevice()) return;

  // Lets the stylesheet adjust the page for touch
  document.body.classList.add('touch');

  const controls = document.createElement('div');
  controls.className = 'touch-controls';

  const pad = document.createElement('div');
  pad.className = 'touch-pad';
  pad.append(...PAD_BUTTONS.map((button) => createButton(button, 'touch-button', true)));

  const attack = createButton(
    { label: 'Attack', key: 'Space', name: 'Attack' },
    'touch-button touch-attack'
  );

  const menu = document.createElement('div');
  menu.className = 'touch-menu';
  menu.append(
    createButton({ label: 'II', key: 'KeyP', name: 'Pause' }, 'touch-button touch-small'),
    createButton({ label: '♪', key: 'KeyM', name: 'Sound on or off' }, 'touch-button touch-small')
  );

  controls.append(pad, attack, menu);
  document.body.append(controls, createRotateHint());

  tapToPress('.start-screen', 'Space');
  tapToPress('.game-over', 'Space');
  tapToPress('.pause', 'KeyP');

  // Tapping the high score line resets it, without also starting a game
  for (const hint of document.querySelectorAll('.high-score-hint')) {
    hint.addEventListener('pointerdown', (event) => {
      event.stopPropagation();
      pressKey('KeyR');
    });
  }

  // Browsers only allow sound after a finger has lifted from the screen
  window.addEventListener('pointerup', unlockAudio);
}
