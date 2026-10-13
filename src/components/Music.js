import { getAudio, playTone } from './Sound.js';

// Loudness of the music compared to the sound effects, from 0 to 1
const MUSIC_VOLUME = 0.35;
// Beats per minute at the start of the game
const TEMPO = 96;
// Every step is half a beat. This is its length at the starting tempo.
const STEP_DURATION = 60 / TEMPO / 2;
// Notes are scheduled this many seconds ahead, so the rhythm stays even when a frame runs late
const LOOKAHEAD = 0.15;
// Seconds the music takes to fade out when it stops
const FADE_OUT = 0.08;
// Seconds before the first note, leaving room for the start sound
const START_DELAY = 0.4;

// The tune, as note numbers (60 is middle C, each step up is one piano key); null is a rest.
// Four bars of eight steps, over the chords C, A minor, F and G.
const MELODY = [
  76, null, 79, null, 76, 74, 72, null,
  69, null, 72, null, 76, null, 74, null,
  77, null, 76, null, 72, null, 69, null,
  74, null, 71, null, 74, 76, 74, null,
];
const BASS = [
  48, null, null, null, 55, null, null, null,
  45, null, null, null, 52, null, null, null,
  41, null, null, null, 48, null, null, null,
  43, null, null, null, 50, null, null, null,
];

let musicGain = null;
let isPlaying = false;
let nextStep = 0;
let nextStepTime = 0;
// How much faster than the starting tempo the tune is playing: 1 is normal, 1.5 is half as fast again
let tempoScale = 1;

// Turns a note number into its pitch in hertz
function noteToFrequency(note) {
  return 440 * 2 ** ((note - 69) / 12);
}

// `stepDuration` is the current length of one step; the notes shorten with it so they never smear together
function scheduleStep(step, start, stepDuration) {
  const melodyNote = MELODY[step];
  if (melodyNote !== null) {
    playTone({
      type: 'triangle',
      from: noteToFrequency(melodyNote),
      duration: stepDuration * 1.8,
      volume: 0.5,
      start,
      output: musicGain,
    });
  }

  const bassNote = BASS[step];
  if (bassNote !== null) {
    playTone({
      from: noteToFrequency(bassNote),
      duration: stepDuration * 3.5,
      volume: 0.7,
      start,
      output: musicGain,
    });
  }
}

// Starts the tune from the beginning
export function startMusic() {
  const audio = getAudio();
  if (!audio) return;

  if (!musicGain) {
    musicGain = audio.context.createGain();
    musicGain.connect(audio.musicOutput);
  }

  const now = audio.context.currentTime;
  musicGain.gain.cancelScheduledValues(now);
  musicGain.gain.setValueAtTime(MUSIC_VOLUME, now);

  isPlaying = true;
  tempoScale = 1;
  nextStep = 0;
  nextStepTime = now + START_DELAY;
}

// Sets how fast the tune plays compared to its starting tempo. Takes effect from the next note.
export function setMusicTempo(scale) {
  tempoScale = scale;
}

export function stopMusic() {
  if (!isPlaying) return;
  isPlaying = false;

  // A quick fade also silences the few notes that were already scheduled
  const audio = getAudio();
  if (audio) musicGain.gain.setTargetAtTime(0, audio.context.currentTime, FADE_OUT / 3);
}

// Called on every frame: schedules the notes that are due soon
export function updateMusic() {
  if (!isPlaying) return;

  const audio = getAudio();
  if (!audio) return;

  const now = audio.context.currentTime;
  // After a long pause (a hidden tab), carry on from now instead of rushing through the missed notes
  if (nextStepTime < now) nextStepTime = now;

  const stepDuration = STEP_DURATION / tempoScale;
  while (nextStepTime < now + LOOKAHEAD) {
    scheduleStep(nextStep, nextStepTime, stepDuration);
    nextStep = (nextStep + 1) % MELODY.length;
    nextStepTime += stepDuration;
  }
}
