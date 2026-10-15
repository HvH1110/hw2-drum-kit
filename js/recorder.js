// FIFO beat recorder: a timestamped event queue. No DOM: it stores keys and replays them
// through the onHit callback; onChange reports every state change so the UI can update.
//
// States: 'idle' -> 'recording' -> 'idle' -> 'playing' -> 'idle'. Exactly one at a time.
export function createRecorder({ onHit, onChange }) {
  let state = 'idle';
  let queue = [];         // [{ key, t }] in the order played; t = ms after the first hit
  let firstHitAt = null;  // performance.now() of the first hit, so leading silence is not kept
  let timer = null;

  function setState(next) {
    state = next;
    onChange(state, queue.length);
  }

  function startRecording() {
    if (state !== 'idle') return;
    queue = [];
    firstHitAt = null;
    setState('recording');
  }

  function stopRecording() {
    if (state === 'recording') setState('idle');
  }

  // Called for every live hit; ignored unless recording. Enqueue = push to the back.
  function capture(key) {
    if (state !== 'recording') return;
    const now = performance.now();
    firstHitAt ??= now;
    queue.push({ key, t: now - firstHitAt });
  }

  // Dequeue = shift from the front, so hits come out in the order they went in.
  // Every delay is measured from the same playback start, so small timer delays never add up.
  function play() {
    if (state !== 'idle' || queue.length === 0) return;
    const pending = [...queue]; // copy: the recording survives playback
    const startedAt = performance.now();
    setState('playing');

    const playDue = () => {
      const elapsed = performance.now() - startedAt;
      while (pending.length > 0 && pending[0].t <= elapsed) onHit(pending.shift().key);
      if (pending.length === 0) {
        timer = null;
        setState('idle');
        return;
      }
      timer = setTimeout(playDue, pending[0].t - elapsed);
    };
    playDue();
  }

  function stopPlayback() {
    clearTimeout(timer);
    timer = null;
    if (state === 'playing') setState('idle');
  }

  function clear() {
    if (state !== 'idle') return;
    queue = [];
    setState('idle');
  }

  return {
    get state() { return state; },
    get length() { return queue.length; },
    startRecording, stopRecording, capture, play, stopPlayback, clear,
  };
}
