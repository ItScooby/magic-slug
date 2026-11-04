// Tiny sound synth: oscillators, 2-operator FM (Mega Drive style), noise, envelopes, filters, WAV writer.
// No dependencies. Everything works on Float32Array buffers at RATE samples per second.
import fs from "node:fs";
import path from "node:path";

export const RATE = 22050;

// Seeded random so every build gives the same sounds.
let seed = 1234567;
export function rand() {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
}
export const noise = () => rand() * 2 - 1;

export const buffer = (seconds) => new Float32Array(Math.ceil(seconds * RATE));

const NOTE = { C: 0, "C#": 1, Db: 1, D: 2, "D#": 3, Eb: 3, E: 4, F: 5, "F#": 6, Gb: 6, G: 7, "G#": 8, Ab: 8, A: 9, "A#": 10, Bb: 10, B: 11 };
/** "A4" -> 440. Numbers pass through as Hz. */
export function hz(note) {
  if (typeof note === "number") return note;
  const m = /^([A-G][#b]?)(-?\d)$/.exec(note);
  if (!m) throw new Error("bad note " + note);
  const midi = NOTE[m[1]] + (Number(m[2]) + 1) * 12;
  return 440 * Math.pow(2, (midi - 69) / 12);
}
/** Shift a note name by semitones. */
export function transpose(note, semis) {
  const m = /^([A-G][#b]?)(-?\d)$/.exec(note);
  const midi = NOTE[m[1]] + (Number(m[2]) + 1) * 12 + semis;
  const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  return names[((midi % 12) + 12) % 12] + (Math.floor(midi / 12) - 1);
}

/** Attack/decay/sustain/release envelope value at time t for a note held `hold` seconds. */
export function adsr(t, hold, a = 0.005, d = 0.1, s = 0.7, r = 0.08) {
  if (t < 0) return 0;
  let v;
  if (t < a) v = t / a;
  else if (t < a + d) v = 1 - (1 - s) * ((t - a) / d);
  else v = s;
  if (t > hold) {
    const k = 1 - (t - hold) / r;
    return k <= 0 ? 0 : v * k;
  }
  return v;
}

const wave = {
  sine: (p) => Math.sin(2 * Math.PI * p),
  square: (p) => ((p % 1) < 0.5 ? 1 : -1),
  pulse25: (p) => ((p % 1) < 0.25 ? 1 : -1),
  saw: (p) => 2 * (p % 1) - 1,
  tri: (p) => 1 - 4 * Math.abs((p % 1) - 0.5),
};

/**
 * Adds one note into `buf` starting at `start` seconds.
 * o = {wave, hz | note, dur, vol, slide (Hz/s or end note via to), vib, a,d,s,r, fm: {ratio, index, decay}, detune}
 * fm makes it a 2-operator FM voice: carrier sine modulated by a sine at ratio*freq (Mega Drive sound).
 */
export function tone(buf, start, o) {
  const f0 = hz(o.note ?? o.hz);
  const f1 = o.to !== undefined ? hz(o.to) : f0;
  const dur = o.dur ?? 0.2;
  const r = o.r ?? 0.08;
  const vol = o.vol ?? 0.5;
  const w = wave[o.wave ?? "square"];
  const i0 = Math.floor(start * RATE);
  const n = Math.ceil((dur + r) * RATE);
  let phase = 0, mphase = 0;
  const voices = o.detune ? [-o.detune, 0, o.detune] : [0];
  const phases = voices.map(() => rand());
  for (let i = 0; i < n && i0 + i < buf.length; i++) {
    const t = i / RATE;
    const k = Math.min(t / dur, 1);
    const curve = o.curve ?? 1;
    let f = f0 + (f1 - f0) * Math.pow(k, curve);
    if (o.vib) f *= 1 + o.vib[1] * Math.sin(2 * Math.PI * o.vib[0] * t) * Math.min(t / 0.15, 1);
    const env = adsr(t, dur, o.a ?? 0.004, o.d ?? 0.08, o.s ?? 0.7, r);
    if (env <= 0 && t > dur) break;
    let v = 0;
    if (o.fm) {
      const idx = o.fm.index * (o.fm.decay ? Math.exp(-t / o.fm.decay) : 1);
      mphase += (f * o.fm.ratio) / RATE;
      phase += f / RATE;
      v = Math.sin(2 * Math.PI * phase + idx * Math.sin(2 * Math.PI * mphase));
    } else {
      for (let j = 0; j < voices.length; j++) {
        phases[j] += (f * (1 + voices[j])) / RATE;
        v += w(phases[j]);
      }
      v /= Math.sqrt(voices.length);
    }
    buf[i0 + i] += v * env * vol;
  }
}

/** Noise burst. o = {dur, vol, a, d, s, r, lp (0..1 smoothing, low = darker), hp, to (lp at end), crush} */
export function hiss(buf, start, o) {
  const dur = o.dur ?? 0.2, r = o.r ?? 0.05, vol = o.vol ?? 0.5;
  const i0 = Math.floor(start * RATE);
  const n = Math.ceil((dur + r) * RATE);
  let lp = 0, prev = 0, hold = 0;
  const crush = o.crush ?? 1;
  for (let i = 0; i < n && i0 + i < buf.length; i++) {
    const t = i / RATE;
    const k = Math.min(t / dur, 1);
    const a = (o.lp ?? 1) + ((o.to ?? o.lp ?? 1) - (o.lp ?? 1)) * k;
    if (i % crush === 0) hold = noise();
    lp += (hold - lp) * a;
    let v = lp;
    if (o.hp) { v = lp - prev; prev = lp; }
    buf[i0 + i] += v * adsr(t, dur, o.a ?? 0.002, o.d ?? 0.05, o.s ?? 0.6, r) * vol;
  }
}

/** Simple drum kit. */
export const drum = {
  kick(buf, t, vol = 0.9) { tone(buf, t, { wave: "sine", hz: 150, to: 40, curve: 0.4, dur: 0.12, vol, a: 0.001, d: 0.1, s: 0.3, r: 0.06 }); hiss(buf, t, { dur: 0.01, vol: vol * 0.3, lp: 0.5 }); },
  snare(buf, t, vol = 0.5) { hiss(buf, t, { dur: 0.08, vol, lp: 0.7, a: 0.001, d: 0.06, s: 0.3, r: 0.08 }); tone(buf, t, { wave: "tri", hz: 220, to: 150, dur: 0.05, vol: vol * 0.6, r: 0.03 }); },
  hat(buf, t, vol = 0.18, open = false) { hiss(buf, t, { dur: open ? 0.09 : 0.015, vol, lp: 1, hp: true, a: 0.001, d: 0.02, s: 0.4, r: open ? 0.08 : 0.02 }); },
  tom(buf, t, note = "A2", vol = 0.5) { tone(buf, t, { wave: "sine", note, to: transpose(note, -7), dur: 0.12, vol, d: 0.1, s: 0.4, r: 0.06 }); },
  crash(buf, t, vol = 0.25) { hiss(buf, t, { dur: 0.4, vol, lp: 0.9, hp: true, a: 0.001, d: 0.3, s: 0.3, r: 0.6 }); },
};

/** One-pole lowpass in place. a in 0..1 (smaller = darker). */
export function lowpass(buf, a) {
  let y = 0;
  for (let i = 0; i < buf.length; i++) { y += (buf[i] - y) * a; buf[i] = y; }
  return buf;
}

/** Feedback echo in place. */
export function echo(buf, seconds, feedback = 0.3, mix = 0.3) {
  const d = Math.floor(seconds * RATE);
  const out = Float32Array.from(buf);
  for (let i = d; i < buf.length; i++) out[i] += out[i - d] * feedback;
  for (let i = 0; i < buf.length; i++) buf[i] = buf[i] * (1 - mix) + out[i] * mix;
  return buf;
}

export function mix(dst, src, vol = 1, at = 0) {
  const i0 = Math.floor(at * RATE);
  for (let i = 0; i < src.length && i0 + i < dst.length; i++) dst[i0 + i] += src[i] * vol;
  return dst;
}

/** Normalizes to `peak`, with a soft clip so loud parts stay punchy, and fades the very end. */
export function finish(buf, peak = 0.9, fadeOut = 0.01) {
  let m = 0;
  for (const v of buf) m = Math.max(m, Math.abs(v));
  const g = m > 0 ? peak / m : 1;
  const fade = Math.floor(fadeOut * RATE);
  for (let i = 0; i < buf.length; i++) {
    let v = Math.tanh(buf[i] * g * 1.2) / Math.tanh(1.2);
    if (i > buf.length - fade) v *= (buf.length - i) / fade;
    buf[i] = v * peak;
  }
  return buf;
}

/** Writes 16-bit mono PCM WAV. Optional `bits` crush (8 = crunchy retro). */
export function saveWav(file, buf, bits = 16) {
  const n = buf.length;
  const data = Buffer.alloc(44 + n * 2);
  data.write("RIFF", 0); data.writeUInt32LE(36 + n * 2, 4); data.write("WAVE", 8);
  data.write("fmt ", 12); data.writeUInt32LE(16, 16); data.writeUInt16LE(1, 20); data.writeUInt16LE(1, 22);
  data.writeUInt32LE(RATE, 24); data.writeUInt32LE(RATE * 2, 28); data.writeUInt16LE(2, 32); data.writeUInt16LE(16, 34);
  data.write("data", 36); data.writeUInt32LE(n * 2, 40);
  const steps = Math.pow(2, bits - 1);
  for (let i = 0; i < n; i++) {
    let v = Math.max(-1, Math.min(1, buf[i]));
    if (bits < 16) v = Math.round(v * steps) / steps;
    data.writeInt16LE(Math.round(v * 32767), 44 + i * 2);
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, data);
}
