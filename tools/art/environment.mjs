// Builds the dungeon / temple environment art: tiles and parallax backgrounds.
//   node tools/art/environment.mjs  -> game/assets/sprites/environment/*.png
// Everything is drawn in code (like pixelfx): change a color or a shape here and re-run.
import { Canvas, hash, rgb } from "./lib/canvas.mjs";
import { join, dirname } from "node:path";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const OUT = join(ROOT, "game", "assets", "sprites", "environment");
const W = 480, H = 270, T = 16;

// stone ramp: lit -> dark
const STONE = ["#8a86a0", "#6c6884", "#524e68", "#3c384f", "#2a2638", "#1b1826"];
const SAND = ["#e0c08a", "#c09a62", "#9a7448", "#6e5034", "#4a3424"];
const MOSS = ["#7a9a4a", "#55743a", "#3a522a"];
const pick = (ramp, i) => ramp[Math.max(0, Math.min(ramp.length - 1, i))];

// ---- one stone block with bevel and noise
function block(c, x, y, w, h, ramp, seed, { moss = false } = {}) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const n = hash(x + i, y + j, seed), edgeT = j === 0, edgeL = i === 0, edgeB = j === h - 1, edgeR = i === w - 1;
    let k = 2 + (n > 0.86 ? 1 : n < 0.1 ? -1 : 0);
    if (edgeT || edgeL) k = 1;
    if (edgeB || edgeR) k = 4;
    if (j === 1 && !edgeL && !edgeR) k = Math.min(k, 1) + (n > 0.5 ? 1 : 0);
    c.set(x + i, y + j, pick(ramp, k));
  }
  // a crack now and then
  if (hash(x, y, seed + 9) > 0.7) {
    let cx = x + 2 + Math.floor(hash(x, y, seed + 1) * (w - 4)), cy = y + 2;
    for (let s = 0; s < h - 4; s++) { c.set(cx, cy + s, pick(ramp, 4)); if (hash(cx, cy + s, 3) > 0.6) cx += hash(cx, s, 4) > 0.5 ? 1 : -1; }
  }
  if (moss) for (let i = 0; i < w; i++) if (hash(x + i, y, 77) > 0.45) {
    const d = 1 + Math.floor(hash(x + i, y, 78) * 3);
    for (let j = 0; j < d; j++) c.set(x + i, y + j, MOSS[Math.min(2, j)]);
  }
}

// ---- tileset: row of 16x16 tiles
// 0 floor top (moss)   1 floor fill   2 platform ledge   3 temple block   4 temple top (gold trim)   5 dark wall fill
function tiles() {
  const c = new Canvas(T * 6, T);
  block(c, 0, 0, 16, 8, STONE, 1, { moss: true }); block(c, 0, 8, 8, 8, STONE, 2); block(c, 8, 8, 8, 8, STONE, 3);
  block(c, 16, 0, 8, 8, STONE, 4); block(c, 24, 0, 8, 8, STONE, 5); block(c, 16, 8, 16, 8, STONE, 6);
  // ledge: thin slab with shadow under
  block(c, 32, 0, 16, 6, STONE, 7, { moss: true });
  for (let i = 0; i < 16; i++) { c.set(32 + i, 6, STONE[5]); if (hash(i, 0, 5) > 0.5) c.set(32 + i, 7, STONE[5]); }
  block(c, 48, 0, 16, 8, SAND, 8); block(c, 48, 8, 8, 8, SAND, 9); block(c, 56, 8, 8, 8, SAND, 10);
  block(c, 64, 3, 16, 13, SAND, 11);
  for (let i = 0; i < 16; i++) { c.set(64 + i, 0, "#ffe9a0"); c.set(64 + i, 1, "#f2c14e"); c.set(64 + i, 2, "#a8742a"); }
  for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) c.set(80 + i, j, pick(STONE, 4 + (hash(i, j, 12) > 0.8 ? 1 : 0)));
  c.save(join(OUT, "tiles.png"));
}

// ---- far layer: deep cavern with a ruined temple in the haze (tiles horizontally)
function far() {
  const c = new Canvas(W, H);
  const sky = ["#0d0b16", "#120f20", "#17142a", "#1d1934", "#241f3e"];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const band = Math.min(4, Math.floor((y / H) * 5 + (hash(x, y, 1) - 0.5) * 0.35));
    c.set(x, y, sky[Math.max(0, band)]);
  }
  // distant stalactites
  for (let x = 0; x < W; x += 6) {
    const len = 6 + Math.floor(hash(x, 0, 2) * 34);
    for (let j = 0; j < len; j++) { const w = Math.max(0, Math.round(3 * (1 - j / len))); for (let i = -w; i <= w; i++) c.set(x + i, j, "#0a0812"); }
  }
  // temple silhouette: stepped pyramid with a glowing door, plus side columns
  const base = 210, temple = "#2c2648", templeD = "#231e3a", glow = ["#ffd27a", "#f29a3a", "#a8502a"];
  for (let s = 0; s < 6; s++) {
    const w = 170 - s * 26, h = 14, x0 = 240 - w / 2, y0 = base - (s + 1) * h;
    c.rect(x0, y0, w, h, s % 2 ? temple : templeD);
    for (let i = 0; i < w; i += 8) c.set(x0 + i, y0, "#3a3360");
  }
  c.rect(232, base - 104, 16, 20, "#3a3360");
  c.rect(234, base - 24, 12, 24, glow[2]); c.rect(236, base - 22, 8, 22, glow[1]); c.rect(238, base - 20, 4, 20, glow[0]);
  for (const cx of [60, 110, 370, 420]) {
    const h = 70 + Math.floor(hash(cx, 1, 3) * 40), broken = hash(cx, 2, 3) > 0.5;
    c.rect(cx - 6, base - h, 12, h, templeD); c.rect(cx - 8, base - h - (broken ? 0 : 4), 16, 4, temple);
    for (let j = base - h; j < base; j += 10) c.rect(cx - 6, j, 12, 1, "#1a1630");
  }
  // ground haze
  for (let y = base; y < H; y++) for (let x = 0; x < W; x++) c.set(x, y, hash(x, y, 4) > 0.5 ? "#1e1a33" : "#1b172e");
  c.save(join(OUT, "bg_far.png"));
}

// ---- mid layer: dungeon arcade (arches on pillars), transparent sky
function mid() {
  const c = new Canvas(W, H);
  const top = 40, floor = 230, span = 120;
  for (let ax = 0; ax < W; ax += span) {
    // wall above the arch
    for (let y = top; y < top + 30; y++) for (let x = ax; x < ax + span; x++) c.set(x, y, pick(STONE, 4 + (hash(x, y, 5) > 0.85 ? 1 : 0)));
    // arch (semicircle cut)
    const cx = ax + span / 2, r = span / 2 - 14;
    for (let y = top + 30; y < top + 30 + r; y++) for (let x = ax; x < ax + span; x++) {
      const dx = x - cx, dy = top + 30 + r - y;
      if (dx * dx + dy * dy > r * r) c.set(x, y, pick(STONE, 4 + (hash(x, y, 6) > 0.85 ? 1 : 0)));
      else if (dx * dx + dy * dy > (r - 3) * (r - 3)) c.set(x, y, STONE[3]);
    }
    // pillar
    for (let y = top; y < floor; y++) for (let x = ax - 10; x < ax + 10; x++) {
      const e = x - (ax - 10);
      c.set(x, y, e < 2 ? STONE[2] : e > 16 ? STONE[5] : pick(STONE, 3 + (hash(x, y, 7) > 0.8 ? 1 : 0)));
    }
    c.rect(ax - 13, floor - 8, 26, 8, STONE[3]); c.rect(ax - 13, top + 26, 26, 6, STONE[3]);
    // chains hanging in the arch
    if ((ax / span) % 2 === 0) for (let y = top + 30; y < top + 30 + 40; y += 2) c.set(cx + 20, y, (y / 2) % 2 ? "#4a4660" : "#2e2a40");
  }
  // brick rows across the top
  for (let y = 0; y < top; y++) for (let x = 0; x < W; x++) {
    const row = Math.floor(y / 6), off = row % 2 ? 6 : 0, edge = y % 6 === 5 || (x + off) % 12 === 0;
    c.set(x, y, edge ? STONE[5] : pick(STONE, 4 - (hash(x, y, 8) > 0.9 ? 1 : 0)));
  }
  c.save(join(OUT, "bg_mid.png"));
}

// ---- props: pillar (16x96), skull pile (24x12), banner (16x40), gate (48x64)
function props() {
  const p = new Canvas(16, 96);
  for (let y = 0; y < 96; y++) for (let x = 0; x < 16; x++) p.set(x, y, x < 2 ? SAND[1] : x > 12 ? SAND[4] : pick(SAND, 2 + (hash(x, y, 9) > 0.85 ? 1 : 0)));
  for (let y = 0; y < 96; y += 12) p.rect(0, y, 16, 1, SAND[4]);
  p.rect(0, 0, 16, 4, "#f2c14e"); p.rect(0, 92, 16, 4, SAND[3]);
  p.save(join(OUT, "pillar.png"));

  const s = new Canvas(24, 12);
  for (const [x, y] of [[4, 6], [12, 6], [20, 6], [8, 2], [16, 2]]) {
    s.ellipse(x, y + 1, 3.5, 3, (px, py) => (py < y ? "#e8e0c8" : "#b8ac90"));
    s.set(x - 1, y + 1, "#2a2020"); s.set(x + 1, y + 1, "#2a2020");
  }
  s.outline("#0e0c14"); s.save(join(OUT, "skulls.png"));

  const b = new Canvas(16, 40);
  b.rect(0, 0, 16, 2, "#5a3420");
  b.poly([[2, 2], [14, 2], [14, 36], [8, 31], [2, 36]], (x) => (x < 5 ? "#8a1a2a" : "#b02a3a"));
  b.ellipse(8, 14, 3, 3, "#f2c14e"); b.set(8, 14, "#8a1a2a");
  b.outline("#0e0c14"); b.save(join(OUT, "banner.png"));

  const g = new Canvas(48, 64);
  g.poly([[0, 64], [0, 20], [6, 8], [24, 0], [42, 8], [48, 20], [48, 64]], (x, y) => pick(SAND, 1 + (hash(x, y, 10) > 0.8 ? 1 : 0)));
  g.poly([[8, 64], [8, 24], [14, 14], [24, 9], [34, 14], [40, 24], [40, 64]], "#140f10");
  for (let x = 10; x < 40; x += 5) g.rect(x, 22, 2, 42, "#4a4660");
  g.rect(8, 40, 32, 2, "#4a4660");
  g.outline("#0e0c14"); g.save(join(OUT, "gate.png"));
}

// ---- power icons: a glowing rune stone with the power's letter (game/data/powers.json: letter, color)
const FONT = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"], B: ["11110", "10001", "11110", "10001", "10001", "10001", "11110"],
  C: ["01111", "10000", "10000", "10000", "10000", "10000", "01111"], F: ["11111", "10000", "11110", "10000", "10000", "10000", "10000"],
  G: ["01111", "10000", "10000", "10011", "10001", "10001", "01111"], H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"], R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"], T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  X: ["10001", "01010", "00100", "00100", "00100", "01010", "10001"],
};
const shade = (hex, k) => { const c = rgb(hex); return [Math.round(c[0] * k), Math.round(c[1] * k), Math.round(c[2] * k), 255].map((v, i) => (i < 3 ? Math.min(255, v) : v)); };
function powerIcons() {
  const data = JSON.parse(readFileSync(join(ROOT, "game", "data", "powers.json"), "utf8"));
  for (const [id, p] of Object.entries(data.list)) {
    const c = new Canvas(20, 20), cx = 10, cy = 10;
    // diamond-shaped stone with a bevel
    c.poly([[cx, 1], [19, cy], [cx, 19], [1, cy]], (x, y) => {
      const u = (x - cx) + (y - cy);
      return u < -5 ? shade(p.color, 1.35) : u < 2 ? shade(p.color, 1.0) : shade(p.color, 0.62);
    });
    c.poly([[cx, 4], [16, cy], [cx, 16], [4, cy]], shade(p.color, 0.42));
    const g = FONT[p.letter] ?? FONT.X;
    g.forEach((row, j) => [...row].forEach((b, i) => { if (b === "1") c.set(cx - 2 + i, cy - 3 + j, "#ffffff"); }));
    c.set(cx - 3, 5, "#ffffff"); c.set(cx - 4, 6, shade(p.color, 1.6));
    c.outline("#120c1c");
    c.save(join(ROOT, "game", "assets", "sprites", "powers", id + ".png"));
  }
}

tiles(); far(); mid(); props(); powerIcons();
console.log("environment art ->", OUT);
void rgb;
