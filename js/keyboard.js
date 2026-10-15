// Keyboard input. Turns key presses into onKey(key) calls; it does not know which keys are
// bound to pads. onKey returns true when the key was used, so the browser's default action
// for that key (for example Firefox's quick-find on ') is cancelled only for bound keys.
export function listenForKeys(onKey) {
  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;                                   // a held key plays once, not a flood
    if (event.ctrlKey || event.altKey || event.metaKey) return; // keep browser shortcuts working
    if (onKey(event.key.toLowerCase())) event.preventDefault();
  });
}
