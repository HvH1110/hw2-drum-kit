# HW2 – Drum Kit Engine: Task Decomposition

## 1. Goal

A browser drum kit in vanilla HTML, CSS and JavaScript. Nine pads play drum sounds from the
keyboard or by click/tap; several sounds can play at once (polyphony); a beat recorder captures
a rhythm with timestamps and plays it back in order (FIFO). Every key binding and sound file is
defined in HTML, so changing a binding never requires touching JavaScript.

## 2. File Structure

```
index.html
css/tokens.css          colors and spacing (light + dark via prefers-color-scheme)
css/reset.css           box-sizing reset, base typography, focus ring
css/kit.css             pad grid, pad states, recorder controls
js/audio-engine.js      Web Audio playback: load, play, stopAll. No DOM, no keyboard.
js/pads.js              the ONLY file that reads data-key / data-sound; finds and flashes pads
js/keyboard.js          keydown listener: event.key, event.repeat, modifier filtering
js/recorder.js          FIFO beat recorder: timestamped event queue, record, play back
js/main.js              wiring: connects pads, keyboard and recorder to the engine
sounds/*.wav            9 drum samples, synthesized for this project (no third-party audio)
tools/make_drum_samples.py   script that generated the samples (not loaded by the page)
```

Each JS/CSS commit adds the `<script>` or `<link>` tag for its own file to `index.html`.

## 3. Contracts

### 3.1 Pad Contract (HTML) — the single source of truth for bindings

```html
<button type="button" class="drum-pad" data-key="a" data-sound="sounds/kick.wav"
        aria-keyshortcuts="A">
  <kbd>A</kbd> <span class="pad-name">Kick</span>
</button>
```

- `data-key`: lowercase value of `KeyboardEvent.key` that triggers the pad.
- `data-sound`: URL of the sample, relative to `index.html`.
- `aria-keyshortcuts` and `<kbd>` show the binding to screen-reader and sighted users.
- Pads are real `<button>`s: Tab focuses them, Enter/Space plays them, a click or tap plays them.
- Default layout (home row):

| Key | A | S | D | F | G | H | J | K | L |
|-----|---|---|---|---|---|---|---|---|---|
| Sound | Kick | Snare | Clap | Hi-hat | Open hat | Low tom | High tom | Rim | Cowbell |

### 3.2 Audio Engine API (`js/audio-engine.js`)

| Function | Contract |
|----------|----------|
| `load(urls)` | Fetches and decodes each URL once into an `AudioBuffer`. Returns a Promise. |
| `play(url)` | Starts a new `AudioBufferSourceNode` for that buffer. Every call is independent, so sounds overlap (polyphony) and a re-hit restarts nothing. Resumes the `AudioContext` on first use (browser autoplay policy). |
| `stopAll()` | Stops every sound that is currently playing. |
| `activeCount()` | Number of sounds currently playing (used by tests to prove polyphony). |

The engine never touches the DOM or keyboard events.

### 3.3 Keyboard (`js/keyboard.js`)

- Listens to `keydown` on `window` and reads `event.key` (never `keypress` / `keyCode`).
- `if (event.repeat) return;` so a held key plays once instead of flooding audio.
- Ignores presses with Ctrl, Alt or Meta held, so browser shortcuts keep working.
- Calls a callback with `event.key.toLowerCase()`; it does not know which keys are bound.

### 3.4 FIFO Beat Recorder (`js/recorder.js`)

- Recording: each hit is **enqueued** as `{ key, t }`, where `t` = ms after the **first hit**
  (`performance.now()` based, monotonic), so the silence before the first hit is not replayed.
  (Changed in T-06 from "ms since Record was pressed".)
- Playback: events are **dequeued in insertion order** (first in, first out). Each hit is scheduled
  relative to the playback start time, so timing errors do not accumulate.
- States: `idle` → `recording` → `idle` → `playing` → `idle`. Only one state at a time.
- Controls: Record button (`aria-pressed` while recording; press again to stop), Play button
  (`aria-pressed` while playing; press again to stop), Clear button, status text in
  `<p id="recorder-status" role="status">` (announced on state changes only).
- Buttons that cannot act in the current state are `disabled` (e.g. Play while recording).

### 3.5 Layout & Quality

- Mobile-first; pad grid fixed at `repeat(3, minmax(0, 1fr))` with square pads → always 3×3, like a
  hardware drum machine. (Changed in T-03: `auto-fit` gave a ragged 4 + 4 + 1 layout on wide screens.)
- Colors only from tokens; WCAG 2.2 AA contrast in light and dark.
- Strict CSP `<meta>` from the first HTML commit (same policy as HW1).
- No `innerHTML`, no inline handlers, no external libraries or CDNs.

## 4. Work Breakdown

| ID | Sub-task | Done when | Commit |
|----|----------|-----------|--------|
| T-00 | This spec | Reviewed and agreed | `docs(spec): define component contracts & WBS table` |
| T-01 | Synthesized drum samples + generator script | 9 WAV files, each plays in the browser | `feat(assets): synthesized drum samples` |
| T-02 | **HTML data-sound contract** (pads, recorder controls, CSP) — before any JS | 9 pads with `data-key` + `data-sound` that point to real files; 0 divs | `feat(html): drum pad data-sound contract` |
| T-03 | Tokens, reset, pad grid, pad states | 3×3 at 375px, no horizontal scroll, contrast passes | `feat(css): tokens & pad grid` |
| T-04 | **Polyphonic audio engine** + click/tap wiring | Rapid clicks on different pads overlap; console API test passes; no DOM code in the engine | `feat(js): polyphonic audio engine` |
| T-05 | **keydown binding with event.repeat throttling** | Each bound key plays its pad; a held key plays once; Ctrl+key ignored | `feat(js): bind keydown events with repeat throttling` |
| T-06 | **FIFO beat recorder** | Record → play reproduces the hits in order with matching timing; states never overlap | `feat(js): FIFO beat recorder` |
| T-07 | Quality audit: 375px, keyboard, CSP, Lighthouse (both themes) | All acceptance criteria below pass; fixes committed if needed | `fix(...)` / `perf(...)` as needed |

## 5. Live Defense Readiness

| Likely request | Where the change goes |
|----------------|-----------------------|
| "Change a key binding" | One `data-key` (+ `aria-keyshortcuts`, `<kbd>`) in `index.html`. No JS change. |
| "Rename `data-sound` to `data-audio-src`" | The attribute in `index.html` + one constant in `js/pads.js`. |
| "Spacebar stops all audio" | One branch in `js/main.js` calling the existing `stopAll()`. |
| "Swap the grid to a container query" | `css/kit.css` only. |

## 6. Acceptance Criteria

- [ ] Every pad plays from its key, from Tab + Enter, and from a click/tap
- [ ] Several sounds overlap without cutting each other off
- [ ] Holding a key plays once (no flood)
- [ ] Recorder plays hits back in recorded order with matching timing
- [ ] Renders at 375px with zero horizontal scroll
- [ ] Text contrast ≥ 4.5:1 in light and dark
- [ ] Zero console errors; zero CSP violations (served with `npx serve`)
- [ ] No inline handlers, no `innerHTML`, no external dependencies

## 7. AI Log

| Task | What I asked the AI | What I checked, changed or rejected |
|------|---------------------|-------------------------------------|
|      |                     |                                     |
