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

// Weapon variants: each power gives the hero a different weapon (sheet "<hero>_<power>").
// wood: [light, dark] shaft; glow: [outer, inner, core] for the casting flame; top: ornament drawer.
let VARIANT = "base";
const MAGE_STAFFS = {
  base:       { wood: ["#a8693a", "#6e4022"], glow: ["#ff6a3d", "#ffc14d", "#fff7d6"], top: "fire" },
  triplo:     { wood: ["#c0703a", "#7a3e1e"], glow: ["#ff8a2a", "#ffd04a", "#fff7d6"], top: "trident" },
  ricochete:  { wood: ["#5a3a7a", "#38204e"], glow: ["#9a48ec", "#c684ff", "#ffffff"], top: "orb" },
  gelo:       { wood: ["#cfe8f4", "#7aa8c4"], glow: ["#5ac8ff", "#bff0ff", "#ffffff"], top: "crystal" },
  bumerangue: { wood: ["#4a8a4a", "#2a5a2e"], glow: ["#3ee08a", "#a8ffcc", "#ffffff"], top: "crescent" },
  rajada:     { wood: ["#e0b040", "#9a6a18"], glow: ["#ffd84a", "#fff09a", "#ffffff"], top: "bolt" },
};
const STAFF_LEN = 26, STAFF_GRIP = 0.38;
function staffTip(hx, hy, ang) { return [hx + Math.cos(ang) * STAFF_LEN * (1 - STAFF_GRIP), hy + Math.sin(ang) * STAFF_LEN * (1 - STAFF_GRIP)]; }
function drawStaff(c, hx, hy, ang, W) {
  const ux = Math.cos(ang), uy = Math.sin(ang), px = -uy, py = ux;
  const [tx, ty] = staffTip(hx, hy, ang), bx = hx - ux * STAFF_LEN * STAFF_GRIP, by = hy - uy * STAFF_LEN * STAFF_GRIP;
  c.line(bx, by, tx, ty, W.wood[1]); c.line(bx - px * 0.8, by - py * 0.8, tx - px * 0.8, ty - py * 0.8, W.wood[0]);
  const [g0, g1, g2] = W.glow, at = (a, b) => [tx + ux * a + px * b, ty + uy * a + py * b];
  switch (W.top) {
    case "fire": {
      const o = at(2.5, 0);
      c.line(...at(0, -2.5), ...at(3, -3), W.wood[1]); c.line(...at(0, 2.5), ...at(3, 3), W.wood[1]);
      c.ellipse(o[0] + 0.5, o[1] + 0.5, 2.6, 2.6, (x, y) => (x + y < o[0] + o[1] - 1 ? g2 : x + y < o[0] + o[1] + 1.5 ? g1 : g0));
      break;
    }
    case "trident":
      for (const b of [-3, 0, 3]) { const a0 = at(0, b * 0.4), a1 = at(b ? 5 : 7, b); c.line(a0[0], a0[1], a1[0], a1[1], "#d8d8e8"); c.set(Math.round(a1[0]), Math.round(a1[1]), g1); }
      c.line(...at(0, -3), ...at(0, 3), W.wood[1]);
      break;
    case "orb": {
      const o = at(3.5, 0);
      c.ellipse(o[0] + 0.5, o[1] + 0.5, 3.4, 3.4, W.wood[1]);
      c.ellipse(o[0] + 0.5, o[1] + 0.5, 2.4, 2.4, (x, y) => (x + y < o[0] + o[1] ? g1 : g0)); c.set(Math.round(o[0]) - 1, Math.round(o[1]) - 1, g2);
      break;
    }
    case "crystal":
      c.poly([at(-1, 0), at(3, -2.6), at(9, 0), at(3, 2.6)], (x, y) => ((x - tx) * px + (y - ty) * py < 0 ? g2 : g1));
      c.line(...at(0, 0), ...at(8, 0), g0);
      break;
    case "crescent":
      for (let k = -1; k <= 1.01; k += 0.1) { const q = at(3 + Math.cos(k * 1.6) * 4, Math.sin(k * 1.6) * 5); c.set(Math.round(q[0]), Math.round(q[1]), Math.abs(k) > 0.8 ? g2 : g0); const q2 = at(3.6 + Math.cos(k * 1.6) * 4, Math.sin(k * 1.6) * 5); c.set(Math.round(q2[0]), Math.round(q2[1]), g1); }
      break;
    case "bolt": {
      const pts = [at(0, 0), at(2.5, 2), at(4, -1.5), at(6.5, 1.5), at(8.5, -0.5)];
      for (let i = 0; i < pts.length - 1; i++) { c.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], g0); c.line(pts[i][0] + px, pts[i][1] + py, pts[i + 1][0] + px, pts[i + 1][1] + py, g1); }
      break;
    }
  }
}

function drawMage(pose) {
  const D = new Doll(CELL, "#1b1024"), J = joints(pose, DIMS), P = MAGE_PAL, W = MAGE_STAFFS[VARIANT];
  const X = (v) => CELL.ox + v, Y = (v) => CELL.oy + v;
  const it = J.p.item ?? {};
  // far arm: an open hand
  D.layer((c) => {
    const a = J.arms.far, hx = X(a.ex), hy = Y(a.ey);
    capsule(c, X(J.shF[0]), Y(J.shF[1]), X(a.jx), Y(a.jy), 1.7, [P.Q, P.q, P.z]);
    capsule(c, X(a.jx), Y(a.jy), hx, hy, 1.7, [P.Q, P.q, P.z]);
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
  D.layer((c) => stamp(c, MAGE_HEAD, X(J.neck[0]) - 7, Y(J.neck[1]) - 12, P));
  D.layer((c) => stamp(c, MAGE_BEARD, X(J.neck[0]) - 5, Y(J.neck[1]) - 1, P));
  D.layer((c) => stamp(c, MAGE_HAT, X(J.neck[0]) - 10, Y(J.neck[1]) - 27, P));
  // the staff, held in the near hand: spells come out of its top
  const a = J.arms.near, hx = X(a.ex), hy = Y(a.ey), ang = it.staffAngle ?? -1.45;
  D.layer((c) => drawStaff(c, hx, hy, ang, W));
  D.layer((c) => {
    capsule(c, X(J.shN[0]), Y(J.shN[1]), X(a.jx), Y(a.jy), 2, [P.R, P.Q, P.q]);
    capsule(c, X(a.jx), Y(a.jy), hx, hy, 2, [P.R, P.Q, P.q]);
    c.ellipse(hx + 0.5, hy + 0.5, 1.8, 1.8, (x, y) => (x + y < hx + hy ? P.s : P.S));
  });
  if (it.flame) D.layer((c) => {
    const [tx, ty] = staffTip(hx, hy, ang), ox = tx + Math.cos(ang) * 3, oy = ty + Math.sin(ang) * 3;
    c.ellipse(ox + 0.5, oy + 0.5, 3.6, 3.6, W.glow[0]); c.ellipse(ox + 0.5, oy, 2.4, 2.4, W.glow[1]); c.set(Math.round(ox), Math.round(oy) - 1, W.glow[2]);
  }, { ink: "#2a0e18" });
  return D.out;
}
function mageMuzzle(pose) {
  const J = joints(pose, DIMS), ang = (pose.item ?? {}).staffAngle ?? -1.45, [tx, ty] = staffTip(J.arms.near.ex, J.arms.near.ey, ang);
  return [Math.round(tx + Math.cos(ang) * 4), Math.round(ty + Math.sin(ang) * 4)];
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

// Bow variants per power: arc colors [body, tips], shape tweaks; rajada swaps the bow for a repeating crossbow.
const ARCHER_BOWS = {
  base:       { body: "#94603a", tips: "#ffd75e", half: 10, bulge: 4 },
  triplo:     { body: "#c86a2a", tips: "#ffd04a", half: 10, bulge: 4, stack: 3 },
  ricochete:  { body: "#6a3aa0", tips: "#c684ff", half: 10, bulge: 4, orb: "#b06aff" },
  gelo:       { body: "#9ad8f4", tips: "#ffffff", half: 11, bulge: 3, crystal: "#5ac8ff" },
  bumerangue: { body: "#3a8a4a", tips: "#a8ffcc", half: 9, bulge: 7 },
  rajada:     { body: "#c89a30", tips: "#fff09a", crossbow: true },
};
function drawBow(c, hx, hy, ang, it, P, J, X, Y) {
  const B = ARCHER_BOWS[VARIANT];
  const ax = Math.cos(ang), ay = Math.sin(ang), px = -ay, py = ax;
  if (B.crossbow) {
    // a stock along the shot, a short bow across its front, a drum magazine on top
    c.line(hx - ax * 6, hy - ay * 6, hx + ax * 6, hy + ay * 6, "#6e4022");
    c.line(hx - ax * 6 + px, hy - ay * 6 + py, hx + ax * 6 + px, hy + ay * 6 + py, B.body);
    const fx = hx + ax * 6, fy = hy + ay * 6;
    for (let u = -1; u <= 1.001; u += 0.1) c.set(Math.round(fx + px * u * 6 - ax * (1 - u * u) * 2), Math.round(fy + py * u * 6 - ay * (1 - u * u) * 2), Math.abs(u) > 0.7 ? B.tips : B.body);
    c.ellipse(hx - px * 2.5, hy - py * 2.5, 2.2, 2.2, B.body); c.set(Math.round(hx - px * 3), Math.round(hy - py * 3), B.tips);
    if (it.nocked !== false) { c.set(Math.round(fx + ax), Math.round(fy + ay), "#ffffff"); }
    return;
  }
  const arcs = B.stack ?? 1;
  for (let s = 0; s < arcs; s++) {
    const half = B.half - s * 2.5, bulge = B.bulge - s * 0.6, back = s * 2;
    const pt = (u) => [hx + px * u * half + ax * bulge * (1 - u * u) - ax * (1 + back), hy + py * u * half + ay * bulge * (1 - u * u) - ay * (1 + back)];
    let prev = pt(-1);
    for (let k = 1; k <= 24; k++) {
      const q = pt(-1 + (2 * k) / 24);
      c.line(prev[0], prev[1], q[0], q[1], Math.abs(k - 12) > 9 ? B.tips : B.body);
      prev = q;
    }
    if (s === 0) {
      const tipA = pt(-1), tipB = pt(1);
      const pull = it.drawn ? [X(J.arms.far.ex), Y(J.arms.far.ey)] : [hx - ax * 1.5, hy - ay * 1.5];
      c.line(tipA[0], tipA[1], pull[0], pull[1], "#e8e8f0");
      c.line(tipB[0], tipB[1], pull[0], pull[1], "#e8e8f0");
      if (B.crystal) for (const t of [tipA, tipB]) { c.set(Math.round(t[0]), Math.round(t[1]), B.crystal); c.set(Math.round(t[0] - ax), Math.round(t[1] - ay), "#ffffff"); }
      if (it.nocked) {
        const tipx = hx + ax * 7, tipy = hy + ay * 7;
        c.line(pull[0], pull[1], tipx, tipy, P.T);
        c.set(Math.round(tipx), Math.round(tipy), "#ffffff"); c.set(Math.round(tipx + ax), Math.round(tipy + ay), "#c0c8d8");
      }
    }
  }
  if (B.orb) c.ellipse(hx + ax * 2 + 0.5, hy + ay * 2 + 0.5, 1.8, 1.8, B.orb);
}
function archerMuzzle(pose) {
  const J = joints(pose, DIMS), ang = (pose.item ?? {}).bowAngle ?? 0;
  return [Math.round(J.arms.near.ex + Math.cos(ang) * 8), Math.round(J.arms.near.ey + Math.sin(ang) * 8)];
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

const MAGE_STAFF = { hf: [3, 6], hb: [-2, 6], item: { staffAngle: -1.45 } };
const cast = (hf, ang, extra = {}) => ({ lean: 2, ff: [4, 0], fb: [-3, 0], hb: [2, 4], hf, ...extra, item: { staffAngle: ang, ...(extra.item ?? {}) } });
const mageAnims = [
  { name: "idle", fps: 4, poses: idle(4, MAGE_STAFF) },
  { name: "run", fps: 12, poses: run(8, (i, s) => ({ hf: [4, 5], hb: [-1 + 3 * s, 6], item: { staffAngle: -1.25 - 0.1 * s } })) },
  { name: "jump", fps: 6, loop: false, poses: JUMP.map((p) => ({ ...p, hf: [3, 1], item: { staffAngle: -1.3 } })) },
  { name: "crouch", fps: 6, poses: [{ ...CROUCH, hf: [5, 3], item: { staffAngle: -1.2 } }] },
  { name: "shoot", fps: 16, loop: false, poses: [cast([-1, -2], -2.3), cast([7, 0], -0.1, { lean: 3, item: { flame: true } }), cast([6, 1], -0.35)] },
  { name: "shoot_up", fps: 16, loop: false, poses: [cast([0, 2], -2.0), cast([2, -7], -1.57, { lean: 0, item: { flame: true } }), cast([2, -6], -1.6, { lean: 0 })] },
  { name: "crouch_shoot", fps: 16, loop: false, poses: [{ ...CROUCH, hf: [0, 0], item: { staffAngle: -2.2 } }, { ...CROUCH, hf: [7, 1], item: { staffAngle: -0.05, flame: true } }, { ...CROUCH, hf: [6, 2], item: { staffAngle: -0.3 } }] },
  { name: "shoot_down", fps: 16, loop: false, poses: [{ ...JUMP[1], hf: [3, 2], item: { staffAngle: 0.9 } }, { ...JUMP[1], hf: [2, 7], item: { staffAngle: 1.57, flame: true } }, { ...JUMP[1], hf: [2, 6], item: { staffAngle: 1.4 } }] },
  { name: "special", fps: 10, loop: false, poses: [cast([1, -7], -1.57, { hb: [0, -7], lean: -1 }), cast([1, -8], -1.57, { hb: [0, -8], item: { flame: true } }), cast([8, -1], -0.3, { lean: 4, item: { flame: true } }), cast([6, 1], -0.5)] },
  { name: "hurt", fps: 8, loop: false, poses: [{ ...HURT, item: { staffAngle: -2.3 } }] },
  { name: "death", fps: 8, loop: false, poses: [{ ...HURT, item: { staffAngle: -2.3 } }, { ...KNEEL, item: { staffAngle: -0.4 } }, lying(drawMage, { item: { staffAngle: -1.57 } })] },
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
// heroes get one sheet per weapon variant: mage.png (base), mage_triplo.png, ... (Player swaps them with the power)
const CAST = {
  mage: [drawMage, mageAnims, mageMuzzle, Object.keys(MAGE_STAFFS)],
  archer: [drawArcher, archerAnims, archerMuzzle, Object.keys(ARCHER_BOWS)],
  zombie: [drawZ, zombieAnims(drawZ), null, ["base"]],
  spitter: [drawS, zombieAnims(drawS), null, ["base"]],
};

function build(draw, anims, muzzleOf) {
  const cols = Math.max(...anims.map((a) => a.poses.length));
  const sheet = new Canvas(cols * CELL.w, anims.length * CELL.h);
  const meta = { cell: [CELL.w, CELL.h], pivot: [CELL.ox, CELL.oy], animations: {}, muzzles: {} };
  anims.forEach((a, row) => {
    a.poses.forEach((p, i) => sheet.blit(typeof p === "function" ? p() : draw(p), i * CELL.w, row * CELL.h));
    meta.animations[a.name] = { row, frames: a.poses.length, fps: a.fps, loop: a.loop ?? true };
    const rel = a.poses[1];
    if (/shoot|special|spit/.test(a.name) && rel && typeof rel === "object") {
      const J = joints(rel, DIMS);
      meta.muzzles[a.name] = muzzleOf ? muzzleOf(rel) : a.name === "spit" ? [Math.round(J.neck[0] + 9), Math.round(J.neck[1] - 3)] : [Math.round(J.arms.near.ex + 2), Math.round(J.arms.near.ey)];
    }
  });
  return { sheet, meta };
}

const preview = process.argv.includes("--preview");
const only = process.argv.slice(2).filter((a) => !a.startsWith("--"));
mkdirSync(OUT, { recursive: true });
for (const [name, [draw, anims, muzzleOf, variants]] of Object.entries(CAST)) {
  if (only.length && !only.includes(name)) continue;
  for (const v of variants) {
    VARIANT = v;
    const file = v === "base" ? name : name + "_" + v;
    const { sheet, meta } = build(draw, anims, muzzleOf);
    sheet.save(join(OUT, file + ".png"));
    writeFileSync(join(OUT, file + ".json"), JSON.stringify(meta, null, 1));
    if (preview) sheet.scaled(4).save(join(ROOT, "tools", "art", "out", file + "-preview.png"));
    console.log(file, sheet.w + "x" + sheet.h);
  }
}
