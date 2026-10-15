// The ONLY file that knows the pad contract's attribute names.
// Renaming an attribute in index.html means changing one constant here.
const KEY_ATTRIBUTE = 'data-key';
const SOUND_ATTRIBUTE = 'data-sound';
const FLASH_MS = 100;

export const pads = [...document.querySelectorAll('.drum-pad')];
const flashTimers = new Map();

export function soundOf(pad) {
  return pad.getAttribute(SOUND_ATTRIBUTE);
}

export function keyOf(pad) {
  return pad.getAttribute(KEY_ATTRIBUTE);
}

// A plain comparison instead of querySelector(`[data-key="${key}"]`): keys such as " or \
// would make that selector invalid and throw.
export function findPad(key) {
  return pads.find((pad) => pad.getAttribute(KEY_ATTRIBUTE) === key) ?? null;
}

// Light the pad briefly. A re-hit while it is lit restarts the timer instead of stacking timers.
export function flash(pad) {
  pad.classList.add('is-playing');
  clearTimeout(flashTimers.get(pad));
  flashTimers.set(pad, setTimeout(() => pad.classList.remove('is-playing'), FLASH_MS));
}
