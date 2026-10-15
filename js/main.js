// Wiring: connects the pads, the keyboard and the recorder to the audio engine.
import { load, play, stopAll } from './audio-engine.js';
import { pads, soundOf, keyOf, findPad, flash } from './pads.js';
import { listenForKeys } from './keyboard.js';
import { createRecorder } from './recorder.js';

const recordButton = document.querySelector('#record-btn');
const playButton = document.querySelector('#play-btn');
const clearButton = document.querySelector('#clear-btn');
const recorderStatus = document.querySelector('#recorder-status');

const statusText = {
  idle: (hits) => (hits === 0
    ? 'No beat recorded yet.'
    : `Beat recorded: ${hits} ${hits === 1 ? 'hit' : 'hits'}. Press Play to hear it.`),
  recording: () => 'Recording. Play some pads, then press Record again to stop.',
  playing: () => 'Playing back your beat.',
};

// Sound + light, used by live hits and by playback
function hit(pad) {
  play(soundOf(pad));
  flash(pad);
}

// A hit made by the user: also offered to the recorder (it ignores it unless recording)
function liveHit(pad) {
  hit(pad);
  recorder.capture(keyOf(pad));
}

function renderRecorder(state, hits) {
  recordButton.setAttribute('aria-pressed', String(state === 'recording'));
  playButton.setAttribute('aria-pressed', String(state === 'playing'));
  recordButton.disabled = state === 'playing';
  playButton.disabled = state === 'recording' || hits === 0;
  clearButton.disabled = state !== 'idle' || hits === 0;
  recorderStatus.textContent = statusText[state](hits);
}

const recorder = createRecorder({
  onHit: (key) => {
    const pad = findPad(key);
    if (pad) hit(pad);
  },
  onChange: renderRecorder,
});

for (const pad of pads) {
  // pointerdown fires the moment a finger or mouse button goes down; click would wait for release
  pad.addEventListener('pointerdown', (event) => {
    if (event.button === 0) liveHit(pad);
  });
  // Enter/Space on a focused pad produce a click with detail 0; mouse clicks (detail >= 1)
  // were already handled by pointerdown, so they are ignored here to avoid a double hit
  pad.addEventListener('click', (event) => {
    if (event.detail === 0) liveHit(pad);
  });
}

listenForKeys((key) => {
  const pad = findPad(key);
  if (!pad) return false;
  liveHit(pad);
  return true;
});

recordButton.addEventListener('click', () => {
  if (recorder.state === 'recording') recorder.stopRecording();
  else recorder.startRecording();
});

playButton.addEventListener('click', () => {
  if (recorder.state === 'playing') {
    recorder.stopPlayback();
    stopAll();
  } else {
    recorder.play();
  }
});

clearButton.addEventListener('click', () => {
  recorder.clear();
  recordButton.focus(); // Clear is now disabled; keep keyboard focus on a usable control
});

load(pads.map(soundOf)).catch((error) => console.error(error));
