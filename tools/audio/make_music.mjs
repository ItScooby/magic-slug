// Original chiptune music in a Mega Drive (YM2612 FM) style with a synthwave touch: FM bass and lead, bell
// arpeggios, a detuned saw pad and drums. All melodies here are original.
//   node tools/audio/make_music.mjs            all songs -> game/assets/audio/music/<name>.wav (loops)
//
// Song format: chords = one chord per bar ("Em", "C", "D", "Bm", "B", "Am", "G"...).
// Melody lines are "NOTE:len" tokens, len in 16th notes; "r:len" is a rest. Each bar must add up to 16.
import { buffer, tone, drum, finish, saveWav, lowpass, echo, mix, transpose, RATE } from "./synth.mjs";

const OUT = new URL("../../game/assets/audio/music/", import.meta.url).pathname;

const CHORDS = {
  Em: ["E", "G", "B"], C: ["C", "E", "G"], D: ["D", "F#", "A"], Bm: ["B", "D", "F#"], B: ["B", "D#", "F#"],
  Am: ["A", "C", "E"], G: ["G", "B", "D"], A: ["A", "C#", "E"], F: ["F", "A", "C"], Dm: ["D", "F", "A"],
  "F#m": ["F#", "A", "C#"], E: ["E", "G#", "B"], Cmaj7: ["C", "E", "G", "B"], Gsus: ["G", "C", "D"],
};

// Instruments (2-op FM like the Genesis, plus a saw pad for the synthwave feel)
const INST = {
  bass: { fm: { ratio: 1, index: 3.2, decay: 0.09 }, vol: 0.55, a: 0.002, d: 0.08, s: 0.6, r: 0.03 },
  lead: { fm: { ratio: 1, index: 1.8, decay: 0.35 }, vol: 0.32, a: 0.008, d: 0.15, s: 0.75, r: 0.06, vib: [5.5, 0.006] },
  lead2: { fm: { ratio: 2, index: 1.1, decay: 0.5 }, vol: 0.18, a: 0.01, d: 0.2, s: 0.7, r: 0.08, vib: [5.5, 0.008] },
  bell: { fm: { ratio: 3.5, index: 1.6, decay: 0.07 }, vol: 0.12, a: 0.001, d: 0.12, s: 0.15, r: 0.08 },
  pad: { wave: "saw", detune: 0.006, vol: 0.06, a: 0.25, d: 0.3, s: 0.8, r: 0.3 },
};

function play(buf, at, inst, note, dur) {
  tone(buf, at, { ...INST[inst], note, dur });
}

function parse(line) {
  return line.trim().split(/\s+/).map((t) => { const [n, l] = t.split(":"); return [n, Number(l)]; });
}

function render(song) {
  const step = 60 / song.bpm / 4;               // one 16th
  const bars = song.chords.length;
  const len = bars * 16 * step;
  const music = buffer(len + 1.5);
  const pad = buffer(len + 1.5);
  const leads = buffer(len + 1.5);

  song.chords.forEach((name, bar) => {
    const chord = CHORDS[name];
    const t0 = bar * 16 * step;
    const root = chord[0];
    // pad: chord held the whole bar
    chord.forEach((n) => tone(pad, t0, { ...INST.pad, note: n + "4", dur: 16 * step - 0.05 }));
    // bass: syncopated octave pattern (the bouncy Genesis bass)
    const pat = song.bass ?? "o.Oo.oO.o.Oo.Oo";
    for (let i = 0; i < 16; i++) {
      const c = pat[i];
      if (c === ".") continue;
      const note = root + (c === "O" ? "3" : "2");
      play(music, t0 + i * step, "bass", note, step * 0.8);
    }
    // arpeggio: 16ths up and down the chord (bell)
    if (song.arp !== false) {
      const notes = [...chord.map((n) => n + "5"), transpose(chord[0] + "5", 12), ...chord.slice(1).reverse().map((n) => n + "5")];
      for (let i = 0; i < 16; i++) play(music, t0 + i * step, "bell", notes[i % notes.length], step * 0.7);
    }
    // drums
    const d = song.drums ?? "full";
    const fill = (bar % 8) === 7;
    for (let i = 0; i < 16; i++) {
      const t = t0 + i * step;
      if (d === "half") {
        if (i === 0) drum.kick(music, t, 0.8);
        if (i === 8) drum.snare(music, t, 0.4);
        if (i % 4 === 2) drum.hat(music, t, 0.08);
        continue;
      }
      if (fill && i >= 12) { drum.tom(music, t, ["A3", "F3", "D3", "A2"][i - 12], 0.5); continue; }
      if (i === 0 || i === 6 || i === 10) drum.kick(music, t);
      if (i === 4 || i === 12) drum.snare(music, t);
      if (i % 2 === 0) drum.hat(music, t, i % 4 === 2 ? 0.14 : 0.08, i === 14);
    }
    if (bar % 8 === 0 && d !== "half") drum.crash(music, t0, 0.18);
  });

  // melody (+ a quieter second FM voice an octave down for body)
  for (const [voice, lines] of Object.entries(song.melody)) {
    let t = 0;
    for (const bar of lines) {
      let sum = 0;
      for (const [n, l] of parse(bar)) {
        if (n !== "r") {
          play(leads, t, voice, n, l * step * 0.92);
          if (voice === "lead") play(leads, t, "lead2", transpose(n, -12), l * step * 0.92);
        }
        t += l * step;
        sum += l;
      }
      if (sum !== 16) throw new Error(`${song.name}: a ${voice} bar adds to ${sum}, not 16: ${bar}`);
    }
  }

  lowpass(pad, 0.12);
  echo(leads, step * 3, 0.25, 0.25);        // synthwave-style dotted-8th echo
  mix(music, pad);
  mix(music, leads);

  // wrap the tail (echo/release past the end) to the start so the loop is seamless
  const n = Math.floor(len * RATE);
  const out = music.slice(0, n);
  for (let i = n; i < music.length; i++) out[i - n] += music[i];
  return finish(out, 0.8, 0);
}

// ---------------------------------------------------------------- songs
const SONGS = {
  // Level theme: fast and bouncy, E minor, heroic. 16 bars (~26 s) then loops.
  masmorra: {
    bpm: 148,
    chords: ["Em", "C", "D", "Bm", "Em", "C", "Am", "B", "C", "D", "Em", "Em", "C", "D", "B", "B"],
    melody: {
      lead: [
        "E5:3 G5:3 B5:2 A5:2 G5:2 F#5:2 G5:2",
        "E5:4 r:2 C5:2 D5:2 E5:2 G5:4",
        "F#5:3 A5:3 D6:2 C6:2 B5:2 A5:4",
        "B5:6 A5:2 F#5:4 D5:4",
        "E5:3 G5:3 B5:2 E6:4 D6:2 B5:2",
        "C6:3 B5:3 G5:2 E5:4 G5:4",
        "A5:3 C6:3 E6:2 D6:2 C6:2 B5:2 A5:2",
        "B5:4 D#6:4 F#6:4 r:4",
        "G5:2 E5:2 G5:2 C6:4 B5:2 G5:4",
        "A5:2 F#5:2 A5:2 D6:4 C6:2 A5:4",
        "B5:3 G5:3 E5:2 G5:2 B5:2 E6:4",
        "D6:2 E6:2 D6:2 B5:6 r:4",
        "E6:4 D6:2 C6:2 B5:4 G5:4",
        "F#6:4 E6:2 D6:2 C6:4 A5:4",
        "D#6:3 F#6:3 B6:4 A6:2 F#6:2 D#6:2",
        "B5:8 r:4 F#5:2 A5:2",
      ],
    },
  },
  // Title theme: slower, dreamy synthwave, half-time drums. 8 bars.
  titulo: {
    bpm: 112,
    drums: "half",
    bass: "o...O.o.o...O.o.",
    chords: ["Em", "C", "G", "D", "Em", "C", "Am", "B"],
    melody: {
      lead: [
        "B5:6 A5:2 G5:4 E5:4",
        "G5:6 E5:2 C5:8",
        "D5:4 G5:4 B5:4 D6:4",
        "C6:6 B5:2 A5:8",
        "B5:6 A5:2 G5:4 B5:4",
        "E6:6 D6:2 C6:4 G5:4",
        "A5:4 C6:4 E6:4 D6:4",
        "D#6:8 B5:4 F#5:4",
      ],
    },
  },
};

for (const [name, song] of Object.entries(SONGS)) {
  song.name = name;
  const out = render(song);
  saveWav(OUT + name + ".wav", out);
  console.log("music", name, (out.length / RATE).toFixed(1) + "s");
}
