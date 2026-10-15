// Wiring: connects the pads and the keyboard to the audio engine.
import { load, play } from './audio-engine.js';
import { pads, soundOf, findPad, flash } from './pads.js';
import { listenForKeys } from './keyboard.js';

function hit(pad) {
  play(soundOf(pad));
  flash(pad);
}

for (const pad of pads) {
  // pointerdown fires the moment a finger or mouse button goes down; click would wait for release
  pad.addEventListener('pointerdown', (event) => {
    if (event.button === 0) hit(pad);
  });
  // Enter/Space on a focused pad produce a click with detail 0; mouse clicks (detail >= 1)
  // were already handled by pointerdown, so they are ignored here to avoid a double hit
  pad.addEventListener('click', (event) => {
    if (event.detail === 0) hit(pad);
  });
}

listenForKeys((key) => {
  const pad = findPad(key);
  if (!pad) return false;
  hit(pad);
  return true;
});

load(pads.map(soundOf)).catch((error) => console.error(error));
