"""Generate the drum kit's 9 samples as 16-bit mono WAV files.

Run from the repository root:  python tools/make_drum_samples.py
Uses only the Python standard library. Not loaded by the web page.
"""

import math
import random
import struct
import wave
from pathlib import Path

SAMPLE_RATE = 44100
OUT_DIR = Path(__file__).resolve().parent.parent / "sounds"
random.seed(1110)  # same noise every run, so the files are reproducible


def times(seconds):
    return [i / SAMPLE_RATE for i in range(int(seconds * SAMPLE_RATE))]


def decay(t, seconds):
    """Exponential fade that reaches about 1% after `seconds`."""
    return math.exp(-4.6 * t / seconds)


def noise(n):
    return [random.uniform(-1, 1) for _ in range(n)]


def low_pass(samples, cutoff):
    a = 1 - math.exp(-2 * math.pi * cutoff / SAMPLE_RATE)
    out, y = [], 0.0
    for x in samples:
        y += a * (x - y)
        out.append(y)
    return out


def high_pass(samples, cutoff):
    return [x - lp for x, lp in zip(samples, low_pass(samples, cutoff))]


def swept_sine(ts, start_hz, end_hz, sweep_seconds):
    """Sine whose pitch glides from start_hz to end_hz (kick and tom 'thump')."""
    out, phase = [], 0.0
    for t in ts:
        progress = min(t / sweep_seconds, 1.0)
        freq = end_hz + (start_hz - end_hz) * (1 - progress) ** 2
        phase += 2 * math.pi * freq / SAMPLE_RATE
        out.append(math.sin(phase))
    return out


def square(t, hz):
    return 1.0 if math.sin(2 * math.pi * hz * t) >= 0 else -1.0


def kick():
    ts = times(0.6)
    body = swept_sine(ts, 150, 45, 0.12)
    return [s * decay(t, 0.5) for s, t in zip(body, ts)]


def snare():
    ts = times(0.3)
    rattle = high_pass(noise(len(ts)), 1500)
    return [0.7 * r * decay(t, 0.2)
            + 0.5 * (math.sin(2 * math.pi * 180 * t) + math.sin(2 * math.pi * 330 * t)) * decay(t, 0.08)
            for r, t in zip(rattle, ts)]


def clap():
    ts = times(0.35)
    hiss = low_pass(high_pass(noise(len(ts)), 800), 3000)
    out = []
    for h, t in zip(hiss, ts):
        bursts = sum(decay(t - start, 0.012) for start in (0.0, 0.011, 0.022) if t >= start)
        tail = decay(t - 0.03, 0.15) if t >= 0.03 else 0.0
        out.append(h * (bursts + tail))
    return out


def hi_hat(seconds):
    ts = times(seconds)
    metal = [sum(square(t, hz) for hz in (205.3, 304.4, 369.6, 522.7, 540.0, 800.0)) / 6 for t in ts]
    mixed = [0.6 * m + 0.4 * n for m, n in zip(metal, noise(len(ts)))]
    return [s * decay(t, seconds) for s, t in zip(high_pass(mixed, 7000), ts)]


def tom(start_hz, end_hz, seconds):
    ts = times(seconds)
    body = swept_sine(ts, start_hz, end_hz, 0.1)
    return [s * decay(t, seconds * 0.8) for s, t in zip(body, ts)]


def rim():
    ts = times(0.08)
    click = high_pass(noise(len(ts)), 2000)
    return [(0.6 * math.sin(2 * math.pi * 1700 * t) + 0.4 * math.sin(2 * math.pi * 400 * t) + 0.3 * c)
            * decay(t, 0.03) for c, t in zip(click, ts)]


def cowbell():
    ts = times(0.4)
    tone = [0.5 * square(t, 540) + 0.5 * square(t, 800) for t in ts]
    return [s * decay(t, 0.3) for s, t in zip(low_pass(tone, 3500), ts)]


def write_wav(name, samples):
    peak = max(abs(s) for s in samples) or 1.0
    fade = int(0.005 * SAMPLE_RATE)  # 5ms fade-out avoids a click at the end
    frames = bytearray()
    for i, s in enumerate(samples):
        gain = min(1.0, (len(samples) - i) / fade)
        frames += struct.pack("<h", int(32767 * 0.9 * s / peak * gain))
    with wave.open(str(OUT_DIR / f"{name}.wav"), "wb") as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(SAMPLE_RATE)
        f.writeframes(bytes(frames))
    print(f"sounds/{name}.wav  {len(samples) / SAMPLE_RATE:.2f}s")


if __name__ == "__main__":
    OUT_DIR.mkdir(exist_ok=True)
    write_wav("kick", kick())
    write_wav("snare", snare())
    write_wav("clap", clap())
    write_wav("hihat", hi_hat(0.08))
    write_wav("openhat", hi_hat(0.45))
    write_wav("tom-low", tom(130, 80, 0.5))
    write_wav("tom-high", tom(230, 160, 0.4))
    write_wav("rim", rim())
    write_wav("cowbell", cowbell())
