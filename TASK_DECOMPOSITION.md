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

- [x] Every pad plays from its key, from Tab + Enter, and from a click/tap (T-04, T-05)
- [x] Several sounds overlap without cutting each other off (T-04: 4 at once, re-hit does not cut)
- [x] Holding a key plays once (no flood) (T-05: 1 press + 5 repeats → 1 hit)
- [x] Recorder plays hits back in recorded order with matching timing (T-06: FIFO order, ≤ 3.6 ms error)
- [x] Renders at 375px with zero horizontal scroll (T-07: also 320 and 1280px, both themes)
- [x] Text contrast ≥ 4.5:1 in light and dark (T-07: Lighthouse Accessibility 100 in both)
- [x] Zero console errors; zero CSP violations (served with `npx serve`) (T-07: also zero warnings)
- [x] No inline handlers, no `innerHTML`, no external dependencies (T-07: code scan)

## 7. Audit Results (T-07)

Served with `npx serve` (Live Server's injected script conflicts with the CSP).

| Check | Result |
|-------|--------|
| Horizontal overflow at 320 / 375 / 1280px, light + dark | None (scrollWidth = viewport in all 6) |
| Console errors / warnings / CSP violations | 0 / 0 / 0 in all 6 runs |
| Keyboard: Tab reaches every enabled control | 10/10 (9 pads + Record; Play and Clear are disabled until a beat exists) |
| Keyboard: visible focus, Shift+Tab mirrors, no trap | Yes: 3px accent ring in both themes |
| Lighthouse (mobile), light | Performance 100, Accessibility 100, Best Practices 100, SEO 100 |
| Lighthouse (mobile), dark | Performance 100, Accessibility 100, Best Practices 100, SEO 100 |
| LCP (budget 2.0s) | Simulated: 1.8s, then 1.2s and 1.2s on re-runs. Real throttling (`--throttling-method=devtools`): 1.3s |
| CLS / TBT | 0 / 0 ms |
| Code scan: JS `var`, `innerHTML`, `on*=`, `style=`, external URLs | None |

- **No code changes were needed.**
- **Rejected change:** loading the sounds after the `load` event, to move them off the critical
  path. Measured result: simulated LCP got worse (2.1s, Performance 99) and real LCP did not
  change (1.3s), so it was reverted. The first 1.8s reading was run-to-run variance of
  Lighthouse's simulation, not a real problem.
- **Reports:** `../lighthouse-reports/hw2-light.report.html`, `../lighthouse-reports/hw2-dark.report.html`
  (outside the repo).

## 8. AI Log

AI assistant: Claude Code. Workflow: one sub-task per request; I reviewed each result in the
browser (and listened to the sounds) before it was committed.

| Task | What I asked the AI | What I checked, changed or rejected |
|------|---------------------|-------------------------------------|
| T-00 | Draft the HW2 plan, contracts and WBS from slide 24 | Agreed decisions: synthesize our own samples (no licensing question), Web Audio API instead of slide 23's `new Audio()`, only `pads.js` reads the `data-*` attributes, home-row keys A–L, theme follows the OS, CSP from the first HTML commit |
| T-01 | Generate 9 drum samples with a reproducible script | Listened to all 9. Checked that Chrome decodes each file and that each sound's frequency profile matches its drum (kick 100% below 200 Hz, hi-hats 98% above 2 kHz) |
| T-02 | HTML pad contract only (no JS) | Script check: 9 pads, unique keys, every `data-sound` file exists, `<kbd>` and `aria-keyshortcuts` match `data-key`. No skip-link: nothing repeated before `<main>` |
| T-03 | Tokens, reset, pad grid, pad states | Grid changed to a fixed 3×3 (`auto-fit` gave 4 + 4 + 1 on wide screens). Pad outline color chosen for 3:1 contrast. Hit flash was too faint (Defect 1) |
| T-04 | Web Audio engine + click/tap wiring | Engine has no DOM code (grep). Tested polyphony (4 at once), `stopAll()`, one hit per input type, and real Tab + Enter with the normal autoplay policy. Avoided slide 23's `querySelector(`[data-key="${key}"]`)`, which throws on the `"` key |
| T-05 | `keydown` + `event.key` + `event.repeat` | Tested all keys, Shift/Caps Lock, 5 auto-repeats → 1 hit, Ctrl+D ignored, `"` and `\` safe. Known limit: Unikey (Telex) rewrites keys, so switch it to English while playing |
| T-06 | FIFO beat recorder | Changed: time measured from the first hit, not from pressing Record; Play also stops. Tested order (FIFO), timing error ≤ 3.6 ms with no build-up, all button states, focus after Clear |
| T-07 | Quality audit | Everything passed. Rejected the AI's own performance change after measuring it (Defect 2). A failing test turned out to be test timing, not a bug (Defect 3) |

### AI-Induced Defects

**Defect 1 — Pad flash never reached full color (T-03)**
- **What went wrong:** the hit color used an 80 ms transition in both directions. JS removes the
  class after ~100 ms, so the flash was still fading in when it started fading out: a pale blue
  instead of the accent color.
- **How it was found:** screenshot with a pad forced into the hit state, then
  `getComputedStyle()` on the pad.
- **Fix:** `transition: none` on the hit state, so the hit appears instantly and only the release
  fades (150 ms). Commit `feat(css): tokens & pad grid`.

**Defect 2 — Performance change made LCP worse (T-07)**
- **What went wrong:** the first Lighthouse run showed LCP 1.8s. The AI assumed the sound downloads
  were delaying the first paint and moved them after the `load` event.
- **How it was found:** measured before and after, with both simulated and real throttling. After:
  simulated LCP 2.1s (worse), real LCP unchanged (1.3s). Two re-runs of the original code gave 1.2s.
- **Fix:** reverted (never committed). The 1.8s was simulation variance. Lesson: measure several
  times, and with real throttling, before changing code for a metric.

**Defect 3 — A flaky test looked like a memory leak (T-07)**
- **What went wrong:** the T-04 regression test reported one sound still "playing" after it should
  have ended, which would mean finished sounds are never cleaned up.
- **How it was found:** traced `activeCount()` every 250 ms on two different servers: the count
  always returned to 0 within 500 ms. Re-ran the test 3 times: 3/3 passed. The failure happened
  right after back-to-back Lighthouse runs, when the busy machine slowed the headless audio clock.
- **Fix:** none needed in the code. The test's fixed 900 ms wait was too tight under heavy CPU load.
