// The cast, drawn as chibi paper dolls (see lib/doll.mjs). Each character = palette + templates + a draw() that
// places the parts for one pose + its animation list.
//   node tools/art/characters.mjs [name...] [--preview]  -> game/assets/sprites/characters/<name>.png + .json
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Canvas } from "./lib/canvas.mjs";
import { tpl, stamp, capsule, Doll, joints } from "./lib/doll.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const OUT = join(ROOT, "game", "assets", "sprites", "characters");
const CELL = { w: 64, h: 64, ox: 32, oy: 60 };
const DIMS = { leg: 10, thigh: 5.5, shin: 5.5, torso: 9, upper: 4, fore: 4.5 };
const TAU = Math.PI * 2;

// ======================================================================= MAGE: Zacarias, the old fire wizard
// red bulb nose, eyebrows like brooms, a beard to the belly, a hat taller than he is
const MAGE_PAL = {
  s: "#f7c9a3", S: "#e09a74", d: "#b06a52", e: "#ffffff", k: "#1b1024", r: "#e8798a",
  N: "#ff8a7a", n: "#d4574f", m: "#ffd0c0",
  W: "#ffffff", w: "#d9dcf2", v: "#9ea2c8",
  R: "#7a5cf0", Q: "#5a3fd0", q: "#3a2896", z: "#24185e", g: "#ffd75e", G: "#c98a24", y: "#fff2b0",
  t: "#a8693a", T: "#6e4022", o: "#ff6a3d", O: "#ffc14d", h: "#fff7d6",
};
const MAGE_HEAD = tpl([
  "...wwwwwwwww....",
  "..wwssssssssw...",
  ".wwsssssssssss..",
  ".wsWWWWWWsWWWWW.",
  "wwsWWWWWWsWWWWWW",
  "wwsssekksssekks.",
  "wwssskkssssskkS.",
  ".wsrrsssssNNNNN.",
  ".wsrrssssNNmmNNN",
  "..wssssssNNmNNNN",
  "..wwWWWWWNNNNNNn",
  "..WWWWWWWWnNNNn.",
  "...WWWWWWWWWWW..",
]);
const MAGE_BEARD = tpl([
  "WWWWWWWWWWWWW",
  "wWWWWWWWWWWWw",
  "wwWWWWWWWWWww",
  ".wwWWWWWWWww.",
  ".vwWWWWWWWwv.",
  "..vwWWWWWwv..",
  "..vwwWWWwwv..",
  "...vwwWwwv...",
  "....vwwwv....",
  ".....vwv.....",
  "......v......",
]);
const MAGE_HAT = tpl([
  "zz...................",
  "zQz..................",
  ".zRQz................",
  "..zRRQz..............",
  "...zRRQz.............",
  "....zRRQz............",
  "....zRRRQz...........",
  "....zRyRRQz..........",
  "....zRRRRRQz.........",
  "...zQRRRRRRQz........",
  "...zQRRRRyRRQz.......",
  "..zQRRRRRRRRRQz......",
  "..zQRRRRRRRRRRQz.....",
  "..zggggggggggggz.....",
  ".zGGGGGGGGOGGGGGz....",
  "zQRRRRRRRRRRRRRRRQzz.",
  "zqQQQQQQQQQQQQQQQQqqz",
  ".zzqqqqqqqqqqqqqqqzz.",
]);
const MAGE_ROBE = tpl([
  "..qRRRRRRq..",
  ".qRRRRRRRRq.",
  "qRRRRRRRRRQq",
  "qRRyRRRRRRQq",
  "qRRRRRRRRRQq",
  "qRRRRRRRRRQq",
  "GggggggOgggG",
  "qRRRRRRRRRQq",
  "qRRRRRRRRRQq",
]);

function drawMage(pose) {
  const D = new Doll(CELL, "#1b1024"), J = joints(pose, DIMS), P = MAGE_PAL;
  const X = (v) => CELL.ox + v, Y = (v) => CELL.oy + v;
  const it = J.p.item ?? {};
  // far arm + staff
  D.layer((c) => {
    const a = J.arms.far;
    const hx = X(a.ex), hy = Y(a.ey), ang = it.staffAngle ?? -1.45, len = 30;
    const tx = hx + Math.cos(ang) * (len * 0.62), ty = hy + Math.sin(ang) * (len * 0.62);
    const bx = hx - Math.cos(ang) * (len * 0.38), by = hy - Math.sin(ang) * (len * 0.38);
    c.line(bx, by, tx, ty, P.T); c.line(bx + 1, by, tx + 1, ty, P.t);
    // a forked top holding the fire stone
    c.ellipse(tx + 0.5, ty - 0.5, 3.2, 3.2, (x, y) => ((x - tx) + (y - ty) < -2 ? P.h : (x - tx) + (y - ty) < 1 ? P.O : P.o));
    capsule(c, X(J.shF[0]), Y(J.shF[1]), X(a.jx), Y(a.jy), 1.6, [P.Q, P.q, P.z]);
    capsule(c, X(a.jx), Y(a.jy), hx, hy, 1.6, [P.Q, P.q, P.z]);
    c.ellipse(hx, hy, 1.7, 1.7, P.S);
  });
  // legs: little curled slippers under the robe
  D.layer((c) => {
    for (const [leg, ramp] of [[J.legs.far, [P.Q, P.q, P.z]], [J.legs.near, [P.R, P.Q, P.q]]]) {
      capsule(c, X(leg.jx), Y(leg.jy), X(leg.ex), Y(leg.ey) - 1, 1.8, ramp);
      const fx = X(leg.ex), fy = Y(leg.ey);
      c.rect(fx - 1, fy - 2, 5, 2, ramp[1]); c.set(fx + 4, fy - 3, ramp[0]); c.set(fx + 3, fy - 2, ramp[0]);
    }
  });
  // robe: torso + a bell skirt that swings with the legs
  D.layer((c) => {
    const hx = X(J.hip[0]), hy = Y(J.hip[1]), sx = X(J.sh[0]), sy = Y(J.sh[1]);
    const lo = Y(Math.min(J.legs.near.ey, J.legs.far.ey)) - 2;
    const l = Math.min(X(J.legs.near.ex), X(J.legs.far.ex)) - 3, r = Math.max(X(J.legs.near.ex), X(J.legs.far.ex)) + 4;
    c.poly([[hx - 6, hy - 2], [hx + 6, hy - 2], [r, lo], [l, lo]], (x, y) => {
      if (y >= lo - 1) return P.g;
      if (y >= lo - 2) return P.G;
      const u = (x - l) / (r - l);
      return u < 0.25 ? P.Q : u > 0.8 ? P.q : (x + y) % 9 === 0 && y > hy + 2 ? P.y : P.R;
    });
    stamp(c, MAGE_ROBE, sx - 6, sy - 1, P);
  });
  // head, beard, hat
  D.layer((c) => {
    const nx = X(J.neck[0]), ny = Y(J.neck[1]);
    stamp(c, MAGE_HEAD, nx - 7, ny - 12, P);
  });
  D.layer((c) => stamp(c, MAGE_BEARD, X(J.neck[0]) - 5, Y(J.neck[1]) - 1, P));
  D.layer((c) => stamp(c, MAGE_HAT, X(J.neck[0]) - 10, Y(J.neck[1]) - 27, P));
  // near arm (sleeve) and hand, a spark when casting
  D.layer((c) => {
    const a = J.arms.near, hx = X(a.ex), hy = Y(a.ey);
    capsule(c, X(J.shN[0]), Y(J.shN[1]), X(a.jx), Y(a.jy), 2, [P.R, P.Q, P.q]);
    capsule(c, X(a.jx), Y(a.jy), hx, hy, 2, [P.R, P.Q, P.q]);
    c.ellipse(hx + 0.5, hy + 0.5, 1.8, 1.8, (x, y) => (x + y < hx + hy ? P.s : P.S));
  });
  if (it.flame) D.layer((c) => {
    const a = J.arms.near, hx = X(a.ex), hy = Y(a.ey);
    c.ellipse(hx + 1, hy, 3.4, 3.4, P.o); c.ellipse(hx + 1, hy - 0.5, 2.2, 2.2, P.O); c.set(Math.round(hx) + 1, Math.round(hy) - 1, P.h);
  }, { ink: "#7a1e10" });
  return D.out;
}

// ======================================================================= ARCHER: Tico, the ginger with the chin
// a chin like a shovel, freckles, buck teeth, a feathered cap and a quiver bigger than his back
const ARCHER_PAL = {
  s: "#f6c6a0", S: "#dd9670", d: "#a8644c", e: "#ffffff", k: "#1b1024", f: "#c8683e", W: "#ffffff",
  h: "#ff8a3a", H: "#ffb35c", j: "#c8541e",
  G: "#7cc04a", g: "#4f9a35", x: "#2f6a24", X: "#1d4418",
  F: "#ff4a3a", E: "#b8241c",
  L: "#c88a50", l: "#94603a", b: "#603a24", B: "#3a2216",
  t: "#d8b88a", T: "#a88a62", u: "#706048", y: "#ffd75e",
};
const ARCHER_HEAD = tpl([
  "...hhhhhhhh....",
  "..hHHhhhhhhh...",
  ".hHhhssssssss..",
  ".hhhssssssssss.",
  "hhhsssseksseks.",
  "hjhsssskksskkS.",
  ".jssffssssssSs.",
  ".jssfsfsssssSSs",
  "..sssssssssssss",
  "..ssssskkkkkkks",
  "..sssssskWWkkS.",
  "...ssssssssssS.",
  "...sssssssssSS.",
  "....dSSSSSSSS..",
]);
const ARCHER_CAP = tpl([
  "..............FF..",
  ".............FEF..",
  "............FEF...",
  "....xxxxxxxFEF....",
  "..xgGGGGGGgxF.....",
  ".xgGGGGGGGGGgx....",
  "xgGGGGGGGGGGGGxx..",
  "XxxxxxxxxxxxxxxxxX",
]);
const ARCHER_TUNIC = tpl([
  "..gGGGGGGg..",
  ".gGGGGlGGGx.",
  "gGGGGlGGGGGx",
  "gGGGlGGGGGGx",
  "gGGlGGGGGGGx",
  "gGlGGGGGGGgx",
  "bbbbbybbbbbb",
  "xgGGGGGGGGgx",
  ".xgGGGGGGgx.",
]);

function drawArcher(pose) {
  const D = new Doll(CELL, "#1b1024"), J = joints(pose, DIMS), P = ARCHER_PAL;
  const X = (v) => CELL.ox + v, Y = (v) => CELL.oy + v;
  const it = J.p.item ?? {};
  // quiver on the back, arrows sticking out
  D.layer((c) => {
    const sx = X(J.sh[0]) - 5, sy = Y(J.sh[1]) - 3;
    capsule(c, sx - 1, sy, sx + 2, sy + 10, 2.2, [P.L, P.l, P.b]);
    for (const [dx, col] of [[-2, P.F], [0, P.W], [1, P.F]]) { c.line(sx + dx - 1, sy - 1, sx + dx - 2, sy - 4, P.t); c.set(sx + dx - 2, sy - 5, col); }
  });
  // far arm
  D.layer((c) => {
    const a = J.arms.far;
    capsule(c, X(J.shF[0]), Y(J.shF[1]), X(a.jx), Y(a.jy), 1.5, [P.g, P.x, P.X]);
    capsule(c, X(a.jx), Y(a.jy), X(a.ex), Y(a.ey), 1.5, [P.l, P.b, P.B]);
    c.ellipse(X(a.ex), Y(a.ey), 1.6, 1.6, P.S);
  });
  // legs: tights + big boots
  D.layer((c) => {
    for (const [leg, tight, boot] of [[J.legs.far, [P.T, P.u, P.u], [P.b, P.B, P.B]], [J.legs.near, [P.t, P.T, P.u], [P.l, P.b, P.B]]]) {
      capsule(c, X(J.hip[0]), Y(J.hip[1]), X(leg.jx), Y(leg.jy), 1.8, tight);
      capsule(c, X(leg.jx), Y(leg.jy), X(leg.ex), Y(leg.ey) - 2, 2.1, boot);
      const fx = X(leg.ex), fy = Y(leg.ey);
      c.rect(fx - 2, fy - 2, 6, 2, boot[1]); c.rect(fx - 2, fy - 2, 6, 1, boot[0]);
    }
  });
  D.layer((c) => stamp(c, ARCHER_TUNIC, X(J.sh[0]) - 6, Y(J.sh[1]) - 1, P));
  D.layer((c) => stamp(c, ARCHER_HEAD, X(J.neck[0]) - 7, Y(J.neck[1]) - 13, P));
  D.layer((c) => stamp(c, ARCHER_CAP, X(J.neck[0]) - 9, Y(J.neck[1]) - 18, P));
  // near arm + bow
  D.layer((c) => {
    const a = J.arms.near, hx = X(a.ex), hy = Y(a.ey);
    capsule(c, X(J.shN[0]), Y(J.shN[1]), X(a.jx), Y(a.jy), 1.7, [P.G, P.g, P.x]);
    capsule(c, X(a.jx), Y(a.jy), hx, hy, 1.7, [P.L, P.l, P.b]);
    drawBow(c, hx, hy, it.bowAngle ?? 0.0, it, P, J, X, Y);
    c.ellipse(hx + 0.5, hy + 0.5, 1.8, 1.8, (x, y) => (x + y < hx + hy ? P.s : P.S));
  });
  return D.out;
}

function drawBow(c, hx, hy, ang, it, P, J, X, Y) {
  // the bow is an arc across `ang` (the direction the arrow flies), held at its grip
  const ax = Math.cos(ang), ay = Math.sin(ang), px = -ay, py = ax, half = 10, bulge = 4;
  const pt = (u) => [hx + px * u * half + ax * bulge * (1 - u * u) - ax * 1, hy + py * u * half + ay * bulge * (1 - u * u) - ay * 1];
  let prev = pt(-1);
  for (let k = 1; k <= 24; k++) {
    const p = pt(-1 + (2 * k) / 24);
    c.line(prev[0], prev[1], p[0], p[1], Math.abs(k - 12) > 9 ? P.y : P.l);
    prev = p;
  }
  const tipA = pt(-1), tipB = pt(1);
  const pull = it.drawn ? [X(J.arms.far.ex), Y(J.arms.far.ey)] : [hx - ax * 1.5, hy - ay * 1.5];
  c.line(tipA[0], tipA[1], pull[0], pull[1], "#e8e8f0");
  c.line(tipB[0], tipB[1], pull[0], pull[1], "#e8e8f0");
  if (it.nocked) {
    const tipx = hx + ax * 7, tipy = hy + ay * 7;
    c.line(pull[0], pull[1], tipx, tipy, P.T);
    c.set(Math.round(tipx), Math.round(tipy), "#ffffff"); c.set(Math.round(tipx + ax), Math.round(tipy + ay), "#c0c8d8");
  }
}

// ======================================================================= ZOMBIES
// Zumbi: a head too big for the neck, one eye popped out on a string, the brain showing, jaw hanging open
const ZOMBIE_PAL = {
  s: "#a8c890", S: "#7fa06c", d: "#56744c", D: "#3a5034", e: "#fffbe0", r: "#e02020", k: "#1b1024",
  p: "#f08aa8", P: "#c0587a", W: "#f0ecd0", m: "#5a1a24",
  c: "#9a8f80", C: "#746a5c", K: "#4e463c", b: "#5a6a8a", B: "#3e4a64", n: "#262c40",
};
const ZOMBIE_HEAD = tpl([
  "....ppPpp.......",
  "...pPppPpp......",
  "..sspPpPssss....",
  ".ssssssssssss...",
  ".sssssssssssss..",
  "ssDsssssseeeSs..",
  "sssDssssseerSs..",
  "ssssssDsseeeSsS.",
  "ssssssssssssSkSs",
  ".sssssssssmmmmS.",
  ".ssdsssssmWmWmS.",
  "..ssssssSmmmmmS.",
  "...ssSssSSWSWS..",
  "....SSSSSSSSS...",
]);
const ZOMBIE_SHIRT = tpl([
  "..cCccccC...",
  ".cccCccccK..",
  "ccccCccccK..",
  "cccCcscccKK.",
  "cccccsscccK.",
  "ccCcccsccKK.",
  "cKcccccKccK.",
  "bbbbbbbbbbB.",
  "bbbbBbbbbBB.",
]);
const SPITTER_PAL = {
  ...ZOMBIE_PAL,
  s: "#c4a8d8", S: "#9a80b4", d: "#76608e", D: "#523e68", c: "#a85a5a", C: "#7e4040", K: "#542a2a", g: "#a8e04a",
};
// Cuspidor: bloated, big lips, a drool of acid
const SPITTER_HEAD = tpl([
  "....ssssss......",
  "..ssssssssss....",
  ".ssssssssssss...",
  "sssDssssssssss..",
  "ssssssssseekss..",
  "ssDsssssseekSs..",
  "sssssssssssSSss.",
  "ssssssssssmmmmss",
  "sssssssssmPPPPms",
  ".ssssssssmmmmmms",
  ".ssssssssssssgs.",
  "..ssssSSSSSSgS..",
  "...SSSSSSSS.g...",
]);

function drawZombie(pose, head, pal, belly = 0) {
  const D = new Doll(CELL, "#1b1024"), J = joints(pose, DIMS), P = pal;
  const X = (v) => CELL.ox + v, Y = (v) => CELL.oy + v;
  D.layer((c) => {
    const a = J.arms.far;
    capsule(c, X(J.shF[0]), Y(J.shF[1]), X(a.jx), Y(a.jy), 1.5, [P.s, P.S, P.d]);
    capsule(c, X(a.jx), Y(a.jy), X(a.ex), Y(a.ey), 1.5, [P.s, P.S, P.d]);
  });
  D.layer((c) => {
    for (const [leg, ramp] of [[J.legs.far, [P.B, P.n, P.n]], [J.legs.near, [P.b, P.B, P.n]]]) {
      capsule(c, X(J.hip[0]), Y(J.hip[1]), X(leg.jx), Y(leg.jy), 2, ramp);
      capsule(c, X(leg.jx), Y(leg.jy), X(leg.ex), Y(leg.ey) - 1, 1.8, ramp);
      c.rect(X(leg.ex) - 1, Y(leg.ey) - 2, 4, 2, P.K);
    }
  });
  D.layer((c) => {
    stamp(c, ZOMBIE_SHIRT, X(J.sh[0]) - 6, Y(J.sh[1]) - 1, P);
    if (belly) c.ellipse(X(J.sh[0]) + 1, Y(J.sh[1]) + 5, 6 + belly, 5, (x, y) => (x + y < X(J.sh[0]) + Y(J.sh[1]) + 5 ? P.s : P.S));
  });
  D.layer((c) => {
    stamp(c, head, X(J.neck[0]) - 7, Y(J.neck[1]) - 13, P);
    // the popped eye dangling on its string
    if (head === ZOMBIE_HEAD) {
      const ex = X(J.neck[0]) + 6, ey = Y(J.neck[1]) - 4, dy = J.p.eye ?? 0;
      c.line(ex, ey, ex + 2, ey + 3 + dy, P.r); c.ellipse(ex + 2.5, ey + 4.5 + dy, 1.6, 1.6, P.e); c.set(ex + 3, ey + 5 + dy, P.r);
    }
  });
  D.layer((c) => {
    const a = J.arms.near;
    capsule(c, X(J.shN[0]), Y(J.shN[1]), X(a.jx), Y(a.jy), 1.8, [P.c, P.C, P.K]);
    capsule(c, X(a.jx), Y(a.jy), X(a.ex), Y(a.ey), 1.6, [P.s, P.S, P.d]);
    c.ellipse(X(a.ex) + 0.5, Y(a.ey), 1.9, 1.6, P.S);
    if (J.p.spit) { c.ellipse(X(J.neck[0]) + 9, Y(J.neck[1]) - 3, 2.5, 2, P.g ?? "#a8e04a"); }
  });
  return D.out;
}

// ======================================================================= animations
const range = (n, f) => Array.from({ length: n }, (_, i) => f(i, n));
const run = (n, extra = () => ({})) => range(n, (i) => {
  const a = (i / n) * TAU, s = Math.sin(a), c = Math.cos(a);
  return { bob: Math.abs(c) > 0.7 ? 0 : -1, lean: 1, ff: [1 + 5 * s, -Math.max(0, 3 * c)], fb: [1 - 5 * s, -Math.max(0, -3 * c)], hf: [3 - 3 * s, 6], hb: [-1 + 3 * s, 6], head: [1, Math.abs(c) > 0.7 ? 0 : -1], ...extra(i, s, c) };
});
const idle = (n, base = {}) => range(n, (i) => ({ ...base, bob: i % n < n / 2 ? 0 : 1, head: [0, i % n < n / 2 ? 0 : 1] }));
const JUMP = [{ bob: -1, ff: [3, -5], fb: [-3, -2], hf: [-2, -2], hb: [-4, 1], head: [0, -1] }, { ff: [2, -1], fb: [-3, -4], hf: [-3, 1], hb: [-3, 3] }];
const CROUCH = { bob: 5, lean: 2, ff: [4, 0], fb: [-3, 0], hf: [4, 4], hb: [2, 4], head: [1, 1] };
const HURT = { bob: 0, lean: -2, x: -1, hf: [-4, -4], hb: [-5, -2], head: [-1, 0], ff: [3, 0], fb: [-3, 0] };
const KNEEL = { bob: 6, lean: 3, ff: [4, 0], fb: [-4, 0], hf: [4, 6], hb: [3, 6], head: [1, 2] };
// lying on the floor: drawn standing, turned a quarter about the feet
const lying = (draw, pose = {}) => () => {
  const up = draw(pose), out = new Canvas(CELL.w, CELL.h), px = [];
  let maxY = -1e9;
  for (let y = 0; y < CELL.h; y++) for (let x = 0; x < CELL.w; x++) {
    const p = up.get(x, y);
    if (!p[3]) continue;
    const nx = CELL.ox + (y - CELL.oy) + 14, ny = CELL.oy - (x - CELL.ox);
    px.push([nx, ny, p]); maxY = Math.max(maxY, ny);
  }
  for (const [x, y, p] of px) out.set(x, y - (maxY - CELL.oy), p);
  return out;
};

const MAGE_STAFF = { hb: [-6, 4], item: { staffAngle: -1.45 } };
const cast = (hf, extra = {}) => ({ lean: 2, ff: [4, 0], fb: [-3, 0], hb: [-6, 4], hf, ...extra, item: { staffAngle: -1.6, ...(extra.item ?? {}) } });
const mageAnims = [
  { name: "idle", fps: 4, poses: idle(4, MAGE_STAFF) },
  { name: "run", fps: 12, poses: run(8, (i, s) => ({ hb: [-6, 3], item: { staffAngle: -1.3 - 0.12 * s } })) },
  { name: "jump", fps: 6, loop: false, poses: JUMP.map((p) => ({ ...p, ...MAGE_STAFF })) },
  { name: "crouch", fps: 6, poses: [{ ...CROUCH, ...MAGE_STAFF }] },
  { name: "shoot", fps: 16, loop: false, poses: [cast([-3, 2]), cast([8, -1], { item: { flame: true } }), cast([7, 1])] },
  { name: "shoot_up", fps: 16, loop: false, poses: [cast([-2, 2]), cast([2, -9], { lean: 0, item: { flame: true } }), cast([2, -8], { lean: 0 })] },
  { name: "crouch_shoot", fps: 16, loop: false, poses: [{ ...CROUCH, hf: [-2, 2] }, { ...CROUCH, hf: [8, 1], item: { flame: true } }, { ...CROUCH, hf: [7, 2] }] },
  { name: "shoot_down", fps: 16, loop: false, poses: [{ ...JUMP[1], hf: [2, 4] }, { ...JUMP[1], hf: [2, 9], item: { flame: true } }, { ...JUMP[1], hf: [2, 8] }] },
  { name: "special", fps: 10, loop: false, poses: [cast([-1, -8], { hb: [1, -8], lean: -1 }), cast([0, -9], { hb: [1, -9], item: { flame: true, staffAngle: -1.7 } }), cast([8, -2], { lean: 3, item: { flame: true } }), cast([7, 0])] },
  { name: "hurt", fps: 8, loop: false, poses: [{ ...HURT, ...MAGE_STAFF }] },
  { name: "death", fps: 8, loop: false, poses: [{ ...HURT }, { ...KNEEL }, lying(drawMage, {})] },
];

const BOW = (o = {}) => ({ item: { bowAngle: -0.9, ...o } });
const aim = (ang, hf, drawn, nocked = true, extra = {}) => ({ lean: 1, ff: [4, 0], fb: [-3, 0], hf, hb: drawn ? [hf[0] - 6 * Math.cos(ang) - 1, hf[1] - 6 * Math.sin(ang)] : [hf[0] - 2, hf[1] + 1], ...extra, item: { bowAngle: ang, drawn, nocked } });
const archerAnims = [
  { name: "idle", fps: 4, poses: idle(4, { hf: [3, 5], ...BOW() }) },
  { name: "run", fps: 12, poses: run(8, () => ({ hf: [4, 4], ...BOW({ bowAngle: -0.7 }) })) },
  { name: "jump", fps: 6, loop: false, poses: JUMP.map((p) => ({ ...p, hf: [3, 0], ...BOW() })) },
  { name: "crouch", fps: 6, poses: [{ ...CROUCH, hf: [5, 3], ...BOW({ bowAngle: -0.6 }) }] },
  { name: "shoot", fps: 16, loop: false, poses: [aim(0, [8, 1], false), aim(0, [8, 1], true), aim(0, [8, 1], false, false)] },
  { name: "shoot_up", fps: 16, loop: false, poses: [aim(-Math.PI / 2, [2, -8], false), aim(-Math.PI / 2, [2, -8], true), aim(-Math.PI / 2, [2, -8], false, false)] },
  { name: "crouch_shoot", fps: 16, loop: false, poses: [aim(0, [8, 2], false, true, CROUCH), aim(0, [8, 2], true, true, CROUCH), aim(0, [8, 2], false, false, CROUCH)] },
  { name: "shoot_down", fps: 16, loop: false, poses: [aim(Math.PI / 2, [2, 8], false, true, JUMP[1]), aim(Math.PI / 2, [2, 8], true, true, JUMP[1]), aim(Math.PI / 2, [2, 8], false, false, JUMP[1])] },
  { name: "special", fps: 10, loop: false, poses: [aim(-1, [6, -5], false), aim(-1, [6, -5], true), aim(-1, [6, -5], false, false), { hf: [3, 5], ...BOW() }] },
  { name: "hurt", fps: 8, loop: false, poses: [{ ...HURT, ...BOW({ bowAngle: -1.6 }) }] },
  { name: "death", fps: 8, loop: false, poses: [{ ...HURT, ...BOW({ bowAngle: -1.6 }) }, { ...KNEEL, ...BOW({ bowAngle: -0.3 }) }, lying(drawArcher, BOW({ bowAngle: -1.57 }))] },
];

const shamble = (n) => range(n, (i) => {
  const a = (i / n) * TAU, s = Math.sin(a), c = Math.cos(a);
  return { lean: 2, bob: Math.abs(s) > 0.5 ? 1 : 0, ff: [1 + 3 * s, -Math.max(0, 1.5 * c)], fb: [1 - 3 * s, 0], hf: [8 + c, -1 + s], hb: [7 - c, 0 - s], head: [2, s > 0 ? 1 : 0], eye: s > 0 ? 1 : 0 };
});
const zAttack = [{ ...shamble(1)[0], hf: [3, -9], hb: [2, -8], lean: -1, head: [0, -1] }, { ...shamble(1)[0], hf: [9, 3], hb: [8, 4], lean: 4, head: [3, 1], eye: 2 }, { ...shamble(1)[0], hf: [8, 4], lean: 3 }];
const zSpit = [{ ...shamble(1)[0], lean: -2, head: [-1, -1] }, { ...shamble(1)[0], lean: 4, head: [3, 1], spit: true }, { ...shamble(1)[0], lean: 3, head: [2, 1] }];
const zombieAnims = (draw) => [
  { name: "walk", fps: 6, poses: shamble(6) },
  { name: "attack", fps: 10, loop: false, poses: zAttack },
  { name: "spit", fps: 8, loop: false, poses: zSpit },
  { name: "hurt", fps: 8, loop: false, poses: [{ ...shamble(1)[0], lean: -2, x: -1, head: [0, -1], eye: 3 }] },
  { name: "death", fps: 8, loop: false, poses: [{ ...shamble(1)[0], lean: -3, x: -1 }, { ...KNEEL, hf: [6, 4] }, lying(draw, {})] },
];
const drawZ = (p) => drawZombie(p, ZOMBIE_HEAD, ZOMBIE_PAL);
const drawS = (p) => drawZombie(p, SPITTER_HEAD, SPITTER_PAL, 2);

// ======================================================================= build
const CAST = {
  mage: [drawMage, mageAnims],
  archer: [drawArcher, archerAnims],
  zombie: [drawZ, zombieAnims(drawZ)],
  spitter: [drawS, zombieAnims(drawS)],
};

function build(draw, anims) {
  const cols = Math.max(...anims.map((a) => a.poses.length));
  const sheet = new Canvas(cols * CELL.w, anims.length * CELL.h);
  const meta = { cell: [CELL.w, CELL.h], pivot: [CELL.ox, CELL.oy], animations: {}, muzzles: {} };
  anims.forEach((a, row) => {
    a.poses.forEach((p, i) => sheet.blit(typeof p === "function" ? p() : draw(p), i * CELL.w, row * CELL.h));
    meta.animations[a.name] = { row, frames: a.poses.length, fps: a.fps, loop: a.loop ?? true };
    const rel = a.poses[1];
    if (/shoot|special|spit/.test(a.name) && rel && typeof rel === "object") {
      const J = joints(rel, DIMS);
      meta.muzzles[a.name] = a.name === "spit" ? [Math.round(J.neck[0] + 9), Math.round(J.neck[1] - 3)] : [Math.round(J.arms.near.ex + 2), Math.round(J.arms.near.ey)];
    }
  });
  return { sheet, meta };
}

const preview = process.argv.includes("--preview");
const only = process.argv.slice(2).filter((a) => !a.startsWith("--"));
mkdirSync(OUT, { recursive: true });
for (const [name, [draw, anims]] of Object.entries(CAST)) {
  if (only.length && !only.includes(name)) continue;
  const { sheet, meta } = build(draw, anims);
  sheet.save(join(OUT, name + ".png"));
  writeFileSync(join(OUT, name + ".json"), JSON.stringify(meta, null, 1));
  if (preview) sheet.scaled(4).save(join(ROOT, "tools", "art", "out", name + "-preview.png"));
  console.log(name, sheet.w + "x" + sheet.h);
}
