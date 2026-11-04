// Generates every sound effect as a WAV in game/assets/audio/sfx/.
//   node tools/audio/make_sfx.mjs            all of them
//   node tools/audio/make_sfx.mjs jump hit   only some
// Each recipe below is a few notes/noise bursts. To add a sound: add a recipe here, run the script, then map it
// to a game event in game/data/audio.json.
import { buffer, tone, hiss, drum, finish, saveWav, echo, lowpass, rand } from "./synth.mjs";

const OUT = new URL("../../game/assets/audio/sfx/", import.meta.url).pathname;

const SFX = {
  // --- hero attacks
  fireball(b) { // whoosh + crackle + low FM growl
    hiss(b, 0, { dur: 0.18, vol: 0.6, lp: 0.15, to: 0.6, a: 0.01, r: 0.08 });
    tone(b, 0, { hz: 180, to: 90, dur: 0.16, vol: 0.5, fm: { ratio: 0.5, index: 4, decay: 0.1 }, r: 0.05 });
    for (let i = 0; i < 5; i++) hiss(b, 0.03 + i * 0.03, { dur: 0.008, vol: 0.4, lp: 1, crush: 3 });
    return 0.28;
  },
  arrow(b) { // bow twang + air
    tone(b, 0, { hz: 520, to: 260, dur: 0.07, vol: 0.45, fm: { ratio: 2, index: 3, decay: 0.03 }, r: 0.06 });
    hiss(b, 0.01, { dur: 0.12, vol: 0.25, lp: 0.5, to: 0.1, hp: true });
    return 0.2;
  },
  zap(b) { // generic power shot: short laser
    tone(b, 0, { wave: "square", hz: 1400, to: 300, dur: 0.09, vol: 0.35, curve: 0.5, r: 0.03 });
    return 0.13;
  },
  orb(b) { // ricochet orb: wobbly blip
    tone(b, 0, { wave: "sine", hz: 300, to: 700, dur: 0.12, vol: 0.5, vib: [30, 0.1], r: 0.05 });
    return 0.18;
  },
  ice(b) { // ice lance: glassy FM bell + shimmer
    tone(b, 0, { hz: 1760, dur: 0.05, vol: 0.4, fm: { ratio: 3.5, index: 2.5, decay: 0.08 }, d: 0.1, s: 0.2, r: 0.2 });
    hiss(b, 0, { dur: 0.15, vol: 0.18, lp: 1, hp: true, r: 0.1 });
    return 0.3;
  },
  disc(b) { // boomerang: spinning whirr
    for (let i = 0; i < 4; i++) tone(b, i * 0.045, { wave: "tri", hz: 500 + i * 60, to: 300, dur: 0.04, vol: 0.35, r: 0.02 });
    return 0.22;
  },
  bolt(b) { // rapid fire: tiny pew
    tone(b, 0, { wave: "pulse25", hz: 1800, to: 700, dur: 0.04, vol: 0.28, r: 0.02 });
    return 0.07;
  },
  meteor(b) { // big falling roar
    hiss(b, 0, { dur: 0.6, vol: 0.7, lp: 0.05, to: 0.4, a: 0.2, r: 0.2 });
    tone(b, 0, { hz: 900, to: 120, dur: 0.7, vol: 0.35, fm: { ratio: 0.5, index: 5 }, a: 0.1, r: 0.15 });
    return 0.9;
  },
  rain(b) { // volley of arrows
    for (let i = 0; i < 6; i++) tone(b, i * 0.05, { hz: 700 - i * 40, to: 300, dur: 0.05, vol: 0.3, fm: { ratio: 2, index: 2.5, decay: 0.03 }, r: 0.04 });
    hiss(b, 0, { dur: 0.35, vol: 0.2, lp: 0.6, hp: true, a: 0.05, r: 0.1 });
    return 0.5;
  },
  // --- impacts
  hit(b) { // shot connects: punchy thud + crunch
    tone(b, 0, { wave: "sine", hz: 220, to: 60, dur: 0.07, vol: 0.8, curve: 0.5, r: 0.04 });
    hiss(b, 0, { dur: 0.04, vol: 0.5, lp: 0.8, crush: 4 });
    return 0.13;
  },
  squish(b) { // zombie goo
    tone(b, 0, { wave: "sine", hz: 160, to: 380, dur: 0.06, vol: 0.5, vib: [40, 0.3], r: 0.03 });
    hiss(b, 0.02, { dur: 0.08, vol: 0.4, lp: 0.2, crush: 2 });
    return 0.15;
  },
  enemy_die(b) { // groan + splat
    tone(b, 0, { wave: "saw", hz: 180, to: 70, dur: 0.3, vol: 0.35, vib: [9, 0.06], r: 0.1 });
    lowpass(b, 0.3);
    hiss(b, 0, { dur: 0.1, vol: 0.5, lp: 0.3, crush: 3 });
    return 0.45;
  },
  bat_die(b) { // squeak + poof
    tone(b, 0, { wave: "square", hz: 2000, to: 2600, dur: 0.05, vol: 0.25, r: 0.02 });
    hiss(b, 0.04, { dur: 0.12, vol: 0.35, lp: 0.4, to: 0.1 });
    return 0.22;
  },
  explosion(b) { // meteor/area boom
    drum.kick(b, 0, 1);
    hiss(b, 0, { dur: 0.5, vol: 0.9, lp: 0.5, to: 0.04, crush: 2, a: 0.001, d: 0.2, s: 0.5, r: 0.3 });
    return 0.9;
  },
  acid(b) { // spitter's lob
    tone(b, 0, { wave: "sine", hz: 300, to: 120, dur: 0.12, vol: 0.4, vib: [25, 0.2], r: 0.05 });
    hiss(b, 0, { dur: 0.06, vol: 0.2, lp: 0.3 });
    return 0.2;
  },
  claw(b) { // zombie swipe
    hiss(b, 0, { dur: 0.1, vol: 0.4, lp: 0.2, to: 0.8, hp: true, a: 0.03, r: 0.04 });
    return 0.16;
  },
  // --- hero
  jump(b) {
    tone(b, 0, { wave: "square", hz: 260, to: 620, dur: 0.1, vol: 0.25, curve: 0.6, r: 0.03 });
    return 0.14;
  },
  hurt(b) { // ouch: falling FM with crunch
    tone(b, 0, { hz: 600, to: 200, dur: 0.18, vol: 0.5, fm: { ratio: 1.5, index: 4, decay: 0.1 }, r: 0.05 });
    hiss(b, 0, { dur: 0.05, vol: 0.4, lp: 0.9, crush: 5 });
    return 0.26;
  },
  player_die(b) { // classic descending tune
    const notes = ["B4", "A#4", "A4", "G#4", "G4", "F#4", "F4", "E4"];
    notes.forEach((n, i) => tone(b, i * 0.07, { wave: "square", note: n, dur: 0.06, vol: 0.3, vib: [12, 0.02], r: 0.02 }));
    tone(b, notes.length * 0.07, { wave: "square", note: "E3", dur: 0.35, vol: 0.3, vib: [6, 0.03], r: 0.2 });
    return 1.2;
  },
  power_get(b) { // rising FM arpeggio + sparkle
    ["C5", "E5", "G5", "C6", "E6", "G6"].forEach((n, i) => tone(b, i * 0.045, { note: n, dur: 0.06, vol: 0.4, fm: { ratio: 2, index: 1.5, decay: 0.1 }, r: 0.12 }));
    hiss(b, 0.15, { dur: 0.2, vol: 0.1, lp: 1, hp: true, r: 0.2 });
    echo(b, 0.09, 0.3, 0.3);
    return 0.65;
  },
  power_lost(b) {
    ["G5", "E5", "C5"].forEach((n, i) => tone(b, i * 0.06, { wave: "tri", note: n, dur: 0.05, vol: 0.35, r: 0.05 }));
    return 0.3;
  },
  gem(b) { // two-note ding
    tone(b, 0, { note: "B5", dur: 0.05, vol: 0.4, fm: { ratio: 4, index: 1.2, decay: 0.08 }, r: 0.05 });
    tone(b, 0.06, { note: "E6", dur: 0.12, vol: 0.4, fm: { ratio: 4, index: 1.2, decay: 0.08 }, r: 0.2 });
    return 0.4;
  },
  mana(b) { // shimmer up
    for (let i = 0; i < 8; i++) tone(b, i * 0.03, { wave: "sine", hz: 600 + i * 150 + rand() * 40, dur: 0.05, vol: 0.25, r: 0.08 });
    return 0.4;
  },
  splash(b) {
    hiss(b, 0, { dur: 0.35, vol: 0.8, lp: 0.6, to: 0.08, a: 0.005, d: 0.1, s: 0.5, r: 0.3 });
    for (let i = 0; i < 6; i++) tone(b, 0.1 + rand() * 0.3, { wave: "sine", hz: 900 + rand() * 900, to: 1800 + rand() * 600, dur: 0.03, vol: 0.15, r: 0.02 });
    return 0.75;
  },
  swap(b) {
    tone(b, 0, { wave: "square", note: "E5", dur: 0.04, vol: 0.25, r: 0.01 });
    tone(b, 0.05, { wave: "square", note: "B5", dur: 0.06, vol: 0.25, r: 0.03 });
    return 0.15;
  },
  // --- menus and jingles
  select(b) {
    tone(b, 0, { note: "A5", dur: 0.04, vol: 0.35, fm: { ratio: 1, index: 1.5 }, r: 0.03 });
    return 0.08;
  },
  start(b) {
    ["E5", "G#5", "B5", "E6"].forEach((n, i) => tone(b, i * 0.06, { note: n, dur: 0.08, vol: 0.4, fm: { ratio: 1, index: 2, decay: 0.15 }, r: 0.15 }));
    return 0.5;
  },
  pause(b) {
    tone(b, 0, { wave: "square", note: "E6", dur: 0.04, vol: 0.2, r: 0.01 });
    tone(b, 0.07, { wave: "square", note: "E6", dur: 0.04, vol: 0.2, r: 0.01 });
    return 0.13;
  },
  win(b) { // victory fanfare (FM brass)
    const brass = { ratio: 1, index: 2.2, decay: 0.3 };
    const seq = [["E5", 0.12], ["E5", 0.12], ["E5", 0.12], ["C5", 0.36], ["D5", 0.36], ["E5", 0.24], ["D5", 0.12], ["E5", 0.9]];
    let t = 0;
    for (const [n, d] of seq) { tone(b, t, { note: n, dur: d * 0.9, vol: 0.4, fm: brass, r: 0.1 }); tone(b, t, { note: n.replace("5", "4"), dur: d * 0.9, vol: 0.2, fm: brass, r: 0.1 }); t += d; }
    [["C3", 0], ["G3", 0.36], ["A3", 0.72], ["E3", 1.32]].forEach(([n, at]) => tone(b, at, { note: n, dur: 0.3, vol: 0.4, fm: { ratio: 1, index: 3, decay: 0.08 }, r: 0.1 }));
    drum.crash(b, t - 0.9, 0.2);
    return t + 0.5;
  },
  game_over(b) {
    const seq = [["C5", 0.3], ["G4", 0.3], ["E4", 0.3], ["A4", 0.2], ["B4", 0.2], ["A4", 0.2], ["G#4", 0.25], ["A#4", 0.25], ["G#4", 0.25], ["G4", 0.15], ["F4", 0.15], ["G4", 0.9]];
    let t = 0;
    for (const [n, d] of seq) { tone(b, t, { note: n, dur: d * 0.9, vol: 0.35, fm: { ratio: 1, index: 1.4, decay: 0.4 }, r: 0.1 }); t += d; }
    return t + 0.4;
  },
};

const want = process.argv.slice(2);
for (const [name, make] of Object.entries(SFX)) {
  if (want.length && !want.includes(name)) continue;
  const b = buffer(5);
  const len = make(b);
  const out = finish(b.slice(0, Math.ceil(len * 22050)), 0.85, 0.02);
  saveWav(OUT + name + ".wav", out);
  console.log("sfx", name, len.toFixed(2) + "s");
}
