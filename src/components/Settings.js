import { ENEMY_BRUTE, ENEMY_NORMAL, ENEMY_SCOUT, ENEMY_TYPES } from './Enemy.js';
import {
  POWER_UP_ATTACK,
  POWER_UP_SHIELD,
  POWER_UP_SPEED,
  POWER_UP_TYPES,
} from './PowerUp.js';
import { HIDE_TIME, HOUSE_COOLDOWN } from './Shelter.js';
import { isMusicOn, isSoundOn, onSoundChange, setMusicOn, setSoundOn } from './Sound.js';
import { isTouchDevice } from './Touch.js';

// The normal enemy has no tint of its own, so its dot uses the yellow of its stripes
const NORMAL_ENEMY_COLOR = 0xe0b03c;
// Points for defeating one normal enemy; stronger types are worth a multiple of it
const POINTS_PER_ENEMY = 10;

const KEYBOARD_CONTROLS = [
  ['Arrow keys', 'Hop one tile'],
  ['Space', 'Attack every monster close to Tode'],
  ['P or Esc', 'Pause and continue'],
  ['M', 'All sound off or on'],
  ['H', 'Open and close this help'],
];
const TOUCH_CONTROLS = [
  ['↖ ↗ ↙ ↘', 'Hop one tile. Hold to keep hopping.'],
  ['Attack', 'Hit every monster close to Tode'],
  ['II', 'Pause'],
  ['♪', 'All sound off or on'],
  ['⚙', 'Open and close this help'],
];

const ENEMY_DESCRIPTIONS = {
  [ENEMY_NORMAL]: 'Normal',
  [ENEMY_SCOUT]: 'Scout: small and fast',
  [ENEMY_BRUTE]: 'Brute: big and slow, takes two hits',
};
const POWER_UP_DESCRIPTIONS = {
  [POWER_UP_SPEED]: 'Tode hops faster',
  [POWER_UP_ATTACK]: 'The attack reaches further and recharges sooner',
  [POWER_UP_SHIELD]: 'Stops the next monster that catches Tode',
};

let settingsElement = null;

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;

  return element;
}

function toCssColor(color) {
  return `#${color.toString(16).padStart(6, '0')}`;
}

// A heading followed by its content
function createSection(title, ...content) {
  const section = createElement('section', 'settings-section');
  section.append(createElement('h3', null, title), ...content);

  return section;
}

// A list of rows, each with a short label on the left and an explanation on the right
function createTable(rows) {
  const table = createElement('dl', 'settings-table');
  for (const [label, explanation] of rows) {
    table.append(createElement('dt', null, label), createElement('dd', null, explanation));
  }
  return table;
}

// A list of rows that each start with a dot in the colour seen in the game
function createColorList(rows) {
  const list = createElement('ul', 'settings-color-list');
  for (const { color, text } of rows) {
    const item = createElement('li');
    const dot = createElement('span', 'settings-dot');
    dot.style.backgroundColor = toCssColor(color);
    item.append(dot, createElement('span', null, text));
    list.appendChild(item);
  }
  return list;
}

// An on/off switch. `isOn` reads the current choice, `setOn` changes it.
function createSwitch(label, isOn, setOn) {
  const button = createElement('button', 'settings-switch');
  button.type = 'button';
  button.setAttribute('role', 'switch');

  const name = createElement('span', null, label);
  const state = createElement('span', 'settings-switch-state');
  button.append(name, state);

  const render = () => {
    button.setAttribute('aria-checked', String(isOn()));
    state.textContent = isOn() ? 'On' : 'Off';
  };
  button.addEventListener('click', () => setOn(!isOn()));
  // Also keeps the switch right when the M key changes the sound
  onSoundChange(render);
  render();

  return button;
}

function createHowToPlay() {
  const goal = createElement(
    'p',
    null,
    'Keep the monsters away from Tode for as long as you can. If one touches him, the game is over. ' +
      'The higher your score, the faster everything gets.'
  );

  const enemies = createColorList(
    [ENEMY_NORMAL, ENEMY_SCOUT, ENEMY_BRUTE].map((name) => ({
      color: ENEMY_TYPES[name].tint ?? NORMAL_ENEMY_COLOR,
      text: `${ENEMY_DESCRIPTIONS[name]}: ${ENEMY_TYPES[name].value * POINTS_PER_ENEMY} points`,
    }))
  );
  const survival = createElement('p', null, 'You also get 1 point for every 10 seconds you survive.');

  const powerUps = createColorList(
    [POWER_UP_SPEED, POWER_UP_ATTACK, POWER_UP_SHIELD].map((name) => {
      const { label, color, duration } = POWER_UP_TYPES[name];
      // The shield has no timer, so it gets no "for N seconds"
      const time = Number.isFinite(duration) ? `, for ${duration} seconds` : '';
      return { color, text: `${label}: ${POWER_UP_DESCRIPTIONS[name]}${time}` };
    })
  );
  const cups = createElement('p', null, 'Hop onto a tea cup to drink it. The colour of the tea shows what it does.');

  const houses = createElement(
    'p',
    null,
    `A house with a glowing frame around it is open. Hop into it to hide for up to ${HIDE_TIME} seconds. ` +
      `The monsters lose track of you and wait. ${isTouchDevice() ? 'Tap' : 'Press'} an arrow to leave early; ` +
      `monsters near the door are pushed back as you come out. The house then stays closed for ${HOUSE_COOLDOWN} seconds. ` +
      'You earn no points while hiding.'
  );

  return [
    createSection('Goal', goal),
    createSection('Controls', createTable(isTouchDevice() ? TOUCH_CONTROLS : KEYBOARD_CONTROLS)),
    createSection('Monsters', enemies, survival),
    createSection('Tea cups', cups, powerUps),
    createSection('Houses', houses),
  ];
}

// Creates the round button that opens the screen, and the screen itself: the sound switches
// and a "how to play" guide. `onToggle` is called when the player asks to open or close it.
export function createSettings(onToggle) {
  const openButton = createElement('button', 'settings-button', '⚙');
  openButton.type = 'button';
  openButton.setAttribute('aria-label', 'Help and settings');
  openButton.addEventListener('click', () => {
    // Without this the button keeps the keyboard's attention, and Space would press it again mid-game
    openButton.blur();
    onToggle();
  });

  settingsElement = createElement('div', 'settings');
  settingsElement.hidden = true;

  const panel = createElement('div', 'settings-panel');

  const header = createElement('div', 'settings-header');
  const closeButton = createElement('button', 'settings-close', 'Close');
  closeButton.type = 'button';
  closeButton.addEventListener('click', onToggle);
  header.append(createElement('h2', null, 'Help and settings'), closeButton);

  const switches = createElement('div', 'settings-switches');
  switches.append(
    createSwitch('Music', isMusicOn, setMusicOn),
    createSwitch('Sound effects', isSoundOn, setSoundOn)
  );

  const guide = createElement('div', 'settings-guide');
  guide.append(...createHowToPlay());

  panel.append(
    header,
    createSection('Settings', switches),
    createElement('h2', 'settings-guide-title', 'How to play'),
    guide
  );
  settingsElement.appendChild(panel);

  // A click on the dark area around the panel closes it too
  settingsElement.addEventListener('click', (event) => {
    if (event.target === settingsElement) onToggle();
  });

  document.body.append(openButton, settingsElement);

  return settingsElement;
}

export function isSettingsOpen() {
  return !settingsElement.hidden;
}

export function openSettings() {
  settingsElement.hidden = false;
  // Always opens at the top, also when it was scrolled down last time
  settingsElement.firstElementChild.scrollTop = 0;
}

export function closeSettings() {
  settingsElement.hidden = true;
}
