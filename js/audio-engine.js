// Polyphonic playback engine (Web Audio API).
// It knows nothing about the page: no DOM, no keyboard. It only loads URLs and plays them.

// Decoding needs no user permission, so an OfflineAudioContext decodes the files up front.
// The real output context is created on the first play(), which always runs inside a user
// gesture (click, tap or key press), so the browser's autoplay policy allows it to start.
const decoder = new OfflineAudioContext(1, 1, 44100);
const buffers = new Map(); // url -> decoded AudioBuffer
const active = new Set();  // sources currently sounding, so stopAll() can reach them
let output = null;         // { context, master } once audio has started

export async function load(urls) {
  await Promise.all(urls.map(async (url) => {
    if (buffers.has(url)) return;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Could not load ${url} (HTTP ${response.status})`);
    buffers.set(url, await decoder.decodeAudioData(await response.arrayBuffer()));
  }));
}

function getOutput() {
  if (!output) {
    const context = new AudioContext();
    // Master volume below 1 leaves headroom, so several overlapping hits do not clip
    const master = new GainNode(context, { gain: 0.7 });
    master.connect(context.destination);
    output = { context, master };
  }
  return output;
}

// Every call starts a new, independent source node: hits overlap instead of cutting each other off.
export function play(url) {
  const buffer = buffers.get(url);
  if (!buffer) return false;
  const { context, master } = getOutput();
  const source = new AudioBufferSourceNode(context, { buffer });
  source.connect(master);
  source.addEventListener('ended', () => active.delete(source));
  active.add(source);
  source.start();
  return true;
}

export function stopAll() {
  for (const source of active) source.stop();
  active.clear();
}

export function activeCount() {
  return active.size;
}
