# HW2 – Drum Kit Engine

**Play it:** https://hvh1110.github.io/hw2-drum-kit/

A browser drum kit built for Lab 1 of Web Application Development
(University of Information Technology – VNUHCM), using only HTML, CSS and JavaScript:
no frameworks, libraries or build step.

## How to Play

Press the key shown on each pad, tap a pad, or Tab to it and press Enter.

| Key | A | S | D | F | G | H | J | K | L |
|-----|---|---|---|---|---|---|---|---|---|
| Sound | Kick | Snare | Clap | Hi-hat | Open hat | Low tom | High tom | Rim | Cowbell |

**Beat recorder:** press Record, play a rhythm, press Record again to stop, then press Play.

## Highlights

- **Contract-first HTML:** every key binding and sound file is defined by `data-key` and `data-sound`
  attributes on the pads. Changing a binding needs no JavaScript change.
- **Polyphonic Web Audio engine:** each sample is decoded once; every hit is an independent source,
  so sounds overlap instead of cutting each other off.
- **Keyboard input:** `keydown` + `event.key`, with `event.repeat` so a held key plays once.
- **FIFO beat recorder:** a timestamped event queue, replayed in order. Each hit is scheduled from
  the same start time, so timing errors do not build up (measured ≤ 3.6 ms).
- **Accessible and secure:** real `<button>` pads, visible focus ring, strict Content-Security-Policy
  with Trusted Types, no inline scripts or handlers.
- **Lighthouse 100** in Performance, Accessibility, Best Practices and SEO (mobile, light and dark).

## Project Structure

```
index.html            the pad contract (data-key, data-sound) and recorder controls
css/tokens.css        colors and spacing for light and dark (the only file with color values)
css/reset.css         box-sizing reset, base typography, focus ring
css/kit.css           page layout, 3×3 pad grid, hit flash, recorder buttons
js/audio-engine.js    Web Audio playback: load, play, stopAll (no DOM, no keyboard)
js/pads.js            the only file that reads data-key / data-sound
js/keyboard.js        keydown listener (event.key, event.repeat, shortcuts ignored)
js/recorder.js        FIFO beat recorder (no DOM)
js/main.js            wiring between the modules and the page
sounds/               9 drum samples
tools/make_drum_samples.py   generates the samples (not loaded by the page)
```

## Sounds

All nine samples are synthesized for this project (no recorded or third-party audio).
To regenerate them, run `python tools/make_drum_samples.py` from the repository root. The output
is identical on every run.

## Run Locally

The page uses ES modules, so it must be served over HTTP (opening the file directly does not work):

```
npx serve
```

Then open http://localhost:3000. VS Code Live Server also works for editing, but its injected
auto-reload script is blocked by the CSP and logs one console error that is not from this project.

## How It Was Built

Each sub-task is one commit. [TASK_DECOMPOSITION.md](TASK_DECOMPOSITION.md) contains the plan and
contracts, the audit results, and the AI usage log.
