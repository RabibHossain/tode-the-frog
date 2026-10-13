import { createHighScoreHint } from './HighScoreHint.js';
import { isTouchDevice } from './Touch.js';

// One inner list per row; the two small controls share the last row to save height
const CONTROL_ROWS = [
  [{ keys: ['←', '↑', '↓', '→'], action: 'Hop' }],
  [{ keys: ['Space'], action: 'Attack' }],
  [
    { keys: ['P'], action: 'Pause' },
    { keys: ['M'], action: 'Sound' },
    { keys: ['H'], action: 'Help' },
  ],
];

let startScreenElement = null;

function createControl({ keys, action }) {
  const control = document.createElement('div');
  control.className = 'start-screen-control';

  for (const key of keys) {
    const keyElement = document.createElement('kbd');
    keyElement.textContent = key;
    control.appendChild(keyElement);
  }

  const label = document.createElement('span');
  label.textContent = action;
  control.appendChild(label);

  return control;
}

function createControlRow(controls) {
  const row = document.createElement('div');
  row.className = 'start-screen-control-row';
  row.append(...controls.map(createControl));

  return row;
}

// Shown as soon as the page opens; the game waits behind it
export function createStartScreen() {
  startScreenElement = document.createElement('div');
  startScreenElement.className = 'start-screen';

  const title = document.createElement('h1');
  title.textContent = 'Tode the Frog';

  const story = document.createElement('p');
  story.className = 'start-screen-story';
  story.textContent =
    "Monsters are closing in on Tode's home. Fight them off, and grab a cup of his tea for a boost.";

  const controls = document.createElement('div');
  controls.className = 'start-screen-controls';
  controls.append(...CONTROL_ROWS.map(createControlRow));

  const hint = document.createElement('p');
  hint.className = 'start-screen-hint';
  hint.textContent = isTouchDevice() ? 'Tap to start' : 'Press Space to start';

  // Tode stands in the middle of the screen, so the text is split into
  // a block above him and a block below him
  const top = document.createElement('div');
  top.className = 'start-screen-top';
  top.append(title, story);

  const bottom = document.createElement('div');
  bottom.className = 'start-screen-bottom';
  bottom.append(controls, hint, createHighScoreHint(true));

  startScreenElement.append(top, bottom);
  document.body.appendChild(startScreenElement);

  return startScreenElement;
}

export function hideStartScreen() {
  startScreenElement.hidden = true;
}
