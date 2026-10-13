// All sounds are generated in the browser with the Web Audio API, so the game needs no sound files.

// Overall loudness, from 0 (silent) to 1 (full)
const MASTER_VOLUME = 0.25;

// The names the two sound choices are saved under in the browser's storage
const SOUND_KEY = 'tode-the-frog-sound';
const MUSIC_KEY = 'tode-the-frog-music';

let context = null;
// Everything goes through `master`. In front of it sit two switches:
// one for the sound effects and one for the music, so each can be turned off on its own.
let master = null;
let effectsOutput = null;
let musicOutput = null;

// Both are on unless the player switched them off before
let soundOn = loadChoice(SOUND_KEY);
let musicOn = loadChoice(MUSIC_KEY);
// Called whenever one of the two choices changes
const changeListeners = [];

// While the game is paused, the audio is frozen and key presses must not wake it up
let isPaused = false;

// The choices are kept in the browser, so they are still there after the page is closed.
// Storage can be switched off (some private windows), so every use is guarded.
function loadChoice(key) {
  try {
    return localStorage.getItem(key) !== 'off';
  } catch {
    return true;
  }
}

function saveChoice(key, isOn) {
  try {
    localStorage.setItem(key, isOn ? 'on' : 'off');
  } catch {
    // Without storage the choice still counts until the page is closed
  }
}

// Applies the two choices to the audio and tells the settings screen about them
function applyChoices() {
  if (context) {
    effectsOutput.gain.value = soundOn ? 1 : 0;
    musicOutput.gain.value = musicOn ? 1 : 0;
  }
  for (const listener of changeListeners) {
    listener();
  }
}

// Browsers only allow sound after the player has pressed a key or clicked,
// so the audio context is created on first use and woken up on every key press
function getContext() {
  if (!context) {
    const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;
    if (!AudioContextClass) return null;

    context = new AudioContextClass();
    master = context.createGain();
    master.gain.value = MASTER_VOLUME;
    master.connect(context.destination);

    effectsOutput = context.createGain();
    effectsOutput.gain.value = soundOn ? 1 : 0;
    effectsOutput.connect(master);

    musicOutput = context.createGain();
    musicOutput.gain.value = musicOn ? 1 : 0;
    musicOutput.connect(master);
  }
  if (context.state === 'suspended' && !isPaused) context.resume();

  return context;
}

// Gives the music access to the audio context and to the output its notes go to.
// Returns null if the browser has no audio support.
export function getAudio() {
  const audio = getContext();
  return audio ? { context: audio, musicOutput } : null;
}

// A volume curve that rises quickly and fades out, so sounds start and end without a click
function createEnvelope(audio, start, duration, volume, output = effectsOutput) {
  const gain = audio.createGain();
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  gain.connect(output);

  return gain;
}

// A single note that slides from one pitch (`from`, in hertz) to another (`to`).
// It starts `delay` seconds from now, or at the exact audio time `start` if one is given.
// `output` is where the note is sent; the sound effects output by default.
export function playTone({
  type = 'sine',
  from,
  to = from,
  duration,
  volume = 1,
  delay = 0,
  start,
  output,
}) {
  const audio = getContext();
  if (!audio) return;

  start ??= audio.currentTime + delay;
  const oscillator = audio.createOscillator();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(from, start);
  oscillator.frequency.exponentialRampToValueAtTime(to, start + duration);

  oscillator.connect(createEnvelope(audio, start, duration, volume, output));
  oscillator.start(start);
  oscillator.stop(start + duration + 0.05);
}

// A burst of hiss, filtered so it sweeps from one pitch to another: a "whoosh"
function playNoise({ from, to, duration, volume = 1 }) {
  const audio = getContext();
  if (!audio) return;

  const start = audio.currentTime;
  const length = Math.ceil(audio.sampleRate * duration);
  const buffer = audio.createBuffer(1, length, audio.sampleRate);
  const samples = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    samples[i] = Math.random() * 2 - 1;
  }

  const source = audio.createBufferSource();
  source.buffer = buffer;

  const filter = audio.createBiquadFilter();
  filter.type = 'bandpass';
  filter.Q.value = 1.5;
  filter.frequency.setValueAtTime(from, start);
  filter.frequency.exponentialRampToValueAtTime(to, start + duration);

  source.connect(filter);
  filter.connect(createEnvelope(audio, start, duration, volume));
  source.start(start);
}

// Wakes the audio up on the first key press and lets M switch the sound off and on
export function createSound() {
  window.addEventListener('keydown', (event) => {
    getContext();
    if (event.code === 'KeyM' && !event.repeat) toggleMute();
  });
}

// Wakes the audio up; call it from a tap or a click
export function unlockAudio() {
  getContext();
}

// Freezes all sound, including the music and notes that are already scheduled
export function pauseAudio() {
  isPaused = true;
  context?.suspend();
}

// Carries on exactly where the sound was frozen
export function resumeAudio() {
  isPaused = false;
  context?.resume();
}

export function isSoundOn() {
  return soundOn;
}

export function isMusicOn() {
  return musicOn;
}

// Turns the sound effects on or off, and remembers the choice
export function setSoundOn(isOn) {
  soundOn = isOn;
  saveChoice(SOUND_KEY, isOn);
  applyChoices();
}

// Turns the music on or off, and remembers the choice
export function setMusicOn(isOn) {
  musicOn = isOn;
  saveChoice(MUSIC_KEY, isOn);
  applyChoices();
}

// The M key: silences everything, or brings everything back if all of it was off
export function toggleMute() {
  const isAnythingOn = soundOn || musicOn;
  setSoundOn(!isAnythingOn);
  setMusicOn(!isAnythingOn);
}

// Calls `listener` every time the sound or the music is switched on or off
export function onSoundChange(listener) {
  changeListeners.push(listener);
}

// Two rising notes when a game begins
export function playStart() {
  playTone({ type: 'triangle', from: 440, duration: 0.12, volume: 0.6 });
  playTone({ type: 'triangle', from: 660, duration: 0.2, volume: 0.6, delay: 0.1 });
}

// A short, quiet "boing"; quiet because it plays several times a second
export function playHop() {
  playTone({ from: 260, to: 520, duration: 0.09, volume: 0.25 });
}

export function playAttack() {
  playNoise({ from: 500, to: 2400, duration: 0.25, volume: 0.9 });
  playTone({ type: 'triangle', from: 220, to: 110, duration: 0.2, volume: 0.5 });
}

// One "pop" per attack, a little higher the more enemies it defeated
export function playDefeat(count) {
  const pitch = 520 + Math.min(count, 6) * 70;
  playTone({ type: 'square', from: pitch, to: pitch * 1.6, duration: 0.12, volume: 0.3, delay: 0.05 });
}

// Three quick rising notes when Tode picks up a tea cup
export function playPowerUp() {
  playTone({ type: 'triangle', from: 523, duration: 0.1, volume: 0.6 });
  playTone({ type: 'triangle', from: 659, duration: 0.1, volume: 0.6, delay: 0.07 });
  playTone({ type: 'triangle', from: 784, duration: 0.2, volume: 0.6, delay: 0.14 });
}

// A glassy "ping" that drops away when the shield blocks an enemy
export function playShieldBreak() {
  playTone({ type: 'triangle', from: 1200, to: 300, duration: 0.3, volume: 0.6 });
  playNoise({ from: 3000, to: 800, duration: 0.2, volume: 0.5 });
}

// A short low "thunk" when an attack hits an enemy but doesn't defeat it
export function playEnemyHurt() {
  playTone({ type: 'square', from: 180, to: 120, duration: 0.1, volume: 0.3, delay: 0.05 });
}

// A door closing behind Tode: a low knock with a short rustle
export function playEnterHouse() {
  playTone({ from: 140, to: 90, duration: 0.14, volume: 0.9 });
  playNoise({ from: 700, to: 300, duration: 0.1, volume: 0.4 });
}

// A rising whoosh as Tode bursts back out
export function playLeaveHouse() {
  playNoise({ from: 300, to: 1800, duration: 0.3, volume: 0.8 });
  playTone({ type: 'triangle', from: 300, to: 600, duration: 0.2, volume: 0.5 });
}

// A dull thump when the headbutt lands
export function playHit() {
  playTone({ from: 160, to: 50, duration: 0.25, volume: 1 });
  playNoise({ from: 900, to: 200, duration: 0.15, volume: 0.6 });
}

// Three falling notes for the "Game Over" screen
export function playGameOver() {
  playTone({ type: 'triangle', from: 392, duration: 0.2, volume: 0.6 });
  playTone({ type: 'triangle', from: 330, duration: 0.2, volume: 0.6, delay: 0.18 });
  playTone({ type: 'triangle', from: 262, duration: 0.45, volume: 0.6, delay: 0.36 });
}

// A rising fanfare, played instead of the falling notes when the game ends with a new high score
export function playHighScore() {
  // The notes C, E, G and the C above: a bright, happy chord played one note at a time
  [523, 659, 784, 1047].forEach((pitch, index) => {
    const isLast = index === 3;
    playTone({
      type: 'triangle',
      from: pitch,
      duration: isLast ? 0.6 : 0.16,
      volume: 0.6,
      delay: index * 0.12,
    });
  });
  // A soft high shimmer on top of the last note
  playTone({ from: 2093, duration: 0.5, volume: 0.2, delay: 0.36 });
}
