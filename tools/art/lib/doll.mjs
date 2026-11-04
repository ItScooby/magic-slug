// Paper-doll characters: chibi proportions (big head, short body), hand-drawn pixel templates for the head, hat,
// torso and props, and limbs drawn as shaded capsules between joints. Each layer gets its own outline, so
// overlapping parts stay readable. Faces right; the game flips it.
import { Canvas, rgb } from "./canvas.mjs";

// ---------- templates: rows of characters, each mapped to a color by the character's palette ('.' = empty)
export function tpl(rows) {
  return { w: Math.max(...rows.map((r) => r.length)), h: rows.length, rows };
}
export function stamp(c, t, x, y, pal, { flipY = false } = {}) {
  for (let j = 0; j < t.h; j++) {
    const row = t.rows[flipY ? t.h - 1 - j : j];
    for (let i = 0; i < row.length; i++) {
      const ch = row[i];
      if (ch === "." || ch === " ") continue;
      const col = pal[ch];
      if (!col) throw new Error(`no color for '${ch}'`);
      c.set(Math.round(x) + i, Math.round(y) + j, col);
    }
  }
}

// ---------- two-bone limb: from a root to an end, bending toward `bend` (+1 forward / -1 back)
export function ik(ax, ay, bx, by, l1, l2, bend = 1) {
  let dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy);
  const reach = l1 + l2 - 0.01;
  if (d > reach) { dx *= reach / d; dy *= reach / d; d = reach; }
  const a = Math.atan2(dy, dx), cos = (l1 * l1 + d * d - l2 * l2) / (2 * l1 * Math.max(d, 0.01));
  const ang = a - bend * Math.acos(Math.max(-1, Math.min(1, cos)));
  return { jx: ax + Math.cos(ang) * l1, jy: ay + Math.sin(ang) * l1, ex: ax + dx, ey: ay + dy };
}

// a shaded capsule: ramp [lit, mid, dark]; light comes from the upper left
export function capsule(c, ax, ay, bx, by, r, ramp) {
  const x0 = Math.floor(Math.min(ax, bx) - r - 1), x1 = Math.ceil(Math.max(ax, bx) + r + 1);
  const y0 = Math.floor(Math.min(ay, by) - r - 1), y1 = Math.ceil(Math.max(ay, by) + r + 1);
  const vx = bx - ax, vy = by - ay, L2 = vx * vx + vy * vy || 1;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const px = x + 0.5, py = y + 0.5;
    const t = Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / L2));
    const cx = ax + vx * t, cy = ay + vy * t, dx = px - cx, dy = py - cy, d = Math.hypot(dx, dy);
    if (d > r) continue;
    const lit = (-dx - dy) / (r || 1); // -1..1, upper-left is lit
    c.set(x, y, lit > 0.45 ? ramp[0] : lit < -0.35 ? ramp[2] : ramp[1]);
  }
}

// ---------- layers with their own outline
export class Doll {
  constructor(cell, ink) {
    this.cell = cell; this.ink = ink;
    this.out = new Canvas(cell.w, cell.h);
  }
  layer(fn, { outline = true, ink } = {}) {
    const L = new Canvas(this.cell.w, this.cell.h);
    fn(L);
    if (outline) L.outline(ink ?? this.ink);
    this.out.blit(L, 0, 0);
  }
}

// ---------- poses
// A pose, in px from the feet (y negative up), facing right:
//   bob (hips up/down), lean (shoulders forward), ff/fb: near/far foot [x, y], hf/hb: near/far hand [x, y]
//   relative to the shoulder, head: [dx, dy] nudge, item: what the near hand does (see each character)
export const BASE = { bob: 0, lean: 0, ff: [2, 0], fb: [-2, 0], hf: [1, 7], hb: [-1, 7], head: [0, 0] };

export function joints(pose, dims) {
  const p = { ...BASE, ...pose };
  const hipY = -dims.leg + p.bob, hip = [p.x ?? 0, hipY + (p.y ?? 0)];
  const sh = [hip[0] + p.lean, hip[1] - dims.torso];
  const foot = (f, side) => [hip[0] + f[0] + side * 1, (p.y ?? 0) + f[1]];
  const legs = {
    near: ik(hip[0] + 1, hip[1], ...foot(p.ff, 0), dims.thigh, dims.shin, 1),
    far: ik(hip[0] - 1, hip[1], ...foot(p.fb, 0), dims.thigh, dims.shin, 1),
  };
  const shN = [sh[0] + 1, sh[1] + 1], shF = [sh[0] - 2, sh[1] + 1];
  const arms = {
    near: ik(shN[0], shN[1], shN[0] + p.hf[0], shN[1] + p.hf[1], dims.upper, dims.fore, -1),
    far: ik(shF[0], shF[1], shF[0] + p.hb[0], shF[1] + p.hb[1], dims.upper, dims.fore, -1),
  };
  const neck = [sh[0] + p.head[0], sh[1] + p.head[1]];
  return { p, hip, sh, shN, shF, legs, arms, neck };
}

export { Canvas, rgb };
