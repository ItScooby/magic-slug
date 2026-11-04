// Builds the character sprite sheets (mage, archer, zombies) from the pixelfx skeleton.
//   node tools/art/characters.mjs            -> game/assets/sprites/characters/<name>.png + .json
//   node tools/art/characters.mjs --preview  -> also writes a 4x preview to tools/art/out/
// To add a character: add a costume and an `anims` list below, then add it to CHARACTERS.
import { skeleton } from "../pixelfx/src/core/index.js";
import { buildSheet, lying } from "./lib/dress.mjs";
import { range, runCycle, shamble, idle, JUMP_UP, JUMP_DOWN, CROUCH, HURT, KNEEL } from "./lib/poses.mjs";
import { Canvas } from "./lib/canvas.mjs";
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const OUT = join(ROOT, "game", "assets", "sprites", "characters");
const CELL = { w: 64, h: 64, ox: 32, oy: 58 };

// ---------- palettes (lit, mid, dark, darkest)
const SKIN = ["#f6c9a0", "#dca07c", "#a86a52", "#6a3c34"];
const ROBE = ["#6f7cf2", "#4c55c9", "#33358f", "#20205a"];
const ROBE_D = ["#4c55c9", "#33358f", "#20205a", "#151438"];
const GOLD = "#f2c14e", GOLD_D = "#a8742a";
const BOOT = ["#8a5a3a", "#6a402a", "#4a2a1e", "#2e1a14"];
const GREEN = ["#7fbf4d", "#5a9a35", "#3c6f27", "#24461a"];
const LEATHER = ["#b07a4a", "#8a5634", "#5e3824", "#3a2016"];
const TAN = ["#d8b98a", "#b8946a", "#8a6a4a", "#5a442e"];
const ZSKIN = ["#9fc08a", "#7a9a6a", "#56704c", "#344832"];
const ZSHIRT = ["#9a8f80", "#776c60", "#544a42", "#342c28"];
const ZPANTS = ["#5a6a8a", "#44506a", "#30384c", "#1e2230"];
const SSKIN = ["#c0a8d0", "#9a80ae", "#705a86", "#463656"];
const SSHIRT = ["#8a5a5a", "#6a4040", "#4a2c2c", "#2e1a1a"];

const arms = (c) => ({ upperN: c, elbowN: c, foreN: c, upperF: c, elbowF: c, foreF: c });
const legs = (thigh, shin, foot) => ({ thighN: thigh, kneeN: thigh, thighF: thigh, kneeF: thigh, shinN: shin, shinF: shin, footN: foot, footF: foot });
const skin = (c) => ({ head: c, face: c, neck: c, handN: c, handF: c });
const mid = (a, b, t = 0.5) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

// ---------- mage: blue robe, pointed hat, white beard, staff with a fire stone
const MAGE = {
  parts: { ...skin(SKIN), chest: ROBE, waist: ROBE_D, pelvis: ROBE, ...arms(ROBE), ...legs(ROBE, ROBE_D, BOOT) },
  back(c, J) {
    // staff in the far hand, leaning forward
    const [hx, hy] = J.handF, top = [hx + 3, hy - 17], bot = [hx - 2, hy + 12];
    c.line(bot[0], bot[1], top[0], top[1], "#7a4a2a");
    c.line(bot[0] + 1, bot[1], top[0] + 1, top[1], "#5a3420");
    c.ellipse(top[0] + 0.5, top[1] - 1.5, 2.6, 2.6, (x, y) => (x + y < top[0] + top[1] - 2 ? "#ffe9a0" : "#ff8a2a"));
  },
  front(c, J) {
    // robe skirt from the hips to below the knees
    const p = J.pelvis, kn = J.kneeN, kf = J.kneeF, lo = Math.max(kn[1], kf[1]) + 4;
    const left = Math.min(kn[0], kf[0], p[0]) - 3, right = Math.max(kn[0], kf[0], p[0]) + 3;
    c.poly([[p[0] - 4, p[1] - 2], [p[0] + 4, p[1] - 2], [right, lo], [left, lo]], (x, y) => (y >= lo - 1 ? GOLD : x < p[0] - 1 ? ROBE[2] : ROBE[1]));
  },
  top(c, J) {
    const h = J.head, cr = J.crown;
    // beard
    c.poly([[h[0] - 1, h[1] + 1], [h[0] + 4, h[1] + 1], [h[0] + 3, h[1] + 7], [h[0], h[1] + 5]], (x, y) => (y > h[1] + 4 ? "#c8c8d8" : "#f0f0f8"));
    // hat: brim, cone leaning back, gold band
    c.poly([[cr[0] - 7, cr[1] + 1], [cr[0] + 7, cr[1] + 1], [cr[0] + 6, cr[1] + 3], [cr[0] - 6, cr[1] + 3]], ROBE_D[1]);
    c.poly([[cr[0] - 4, cr[1] + 1], [cr[0] + 4, cr[1] + 1], [cr[0] - 3, cr[1] - 8], [cr[0] - 7, cr[1] - 10]], (x, y) => (y >= cr[1] - 1 ? GOLD : x > cr[0] - 1 ? ROBE[1] : ROBE[2]));
  },
};

// ---------- archer: green hood and tunic, leather bracers, quiver, short cloak
const ARCHER = {
  parts: {
    head: GREEN, face: SKIN, neck: GREEN, handN: SKIN, handF: SKIN,
    chest: GREEN, waist: LEATHER, pelvis: GREEN,
    upperN: GREEN, elbowN: GREEN, upperF: GREEN, elbowF: GREEN, foreN: LEATHER, foreF: LEATHER,
    ...legs(TAN, BOOT, BOOT),
  },
  back(c, J) {
    const sf = J.shoulderF, sn = J.shoulderN, w = J.waist, cr = J.crown, n = J.neck;
    // cloak behind the shoulders
    c.poly([[Math.min(sn[0], sf[0]) - 2, n[1]], [Math.max(sn[0], sf[0]) + 1, n[1]], [w[0] - 1, w[1] + 4], [w[0] - 8, w[1] + 3]], (x, y) => (x < w[0] - 4 ? GREEN[3] : GREEN[2]));
    // quiver across the back, arrows poking out
    const q0 = [sf[0] - 5, sf[1] - 4], q1 = [w[0] - 6, w[1] + 2];
    for (let k = -1; k <= 1; k++) c.line(q0[0] + k, q0[1], q1[0] + k, q1[1], k < 1 ? LEATHER[1] : LEATHER[2]);
    c.set(q0[0] - 1, q0[1] - 2, "#e8e8e8"); c.set(q0[0] + 1, q0[1] - 3, "#d84a3a"); c.set(q0[0], q0[1] - 2, "#e8e8e8");
    // hood tip falling back
    c.poly([[cr[0] - 2, cr[1] + 1], [cr[0] - 4, cr[1] + 2], [cr[0] - 7, cr[1] + 7]], GREEN[2]);
  },
};

// ---------- zombies
const ZOMBIE = {
  parts: { ...skin(ZSKIN), chest: ZSHIRT, waist: ZSHIRT, pelvis: ZPANTS, upperN: ZSHIRT, upperF: ZSHIRT, elbowN: ZSKIN, elbowF: ZSKIN, foreN: ZSKIN, foreF: ZSKIN, ...legs(ZPANTS, ZPANTS, ZPANTS.map((c, i) => ZSHIRT[Math.min(3, i + 1)])) },
  top(c, J) {
    const h = J.head;
    c.set(h[0] + 2, h[1] - 1, "#ff3b30"); c.set(h[0] + 3, h[1] - 1, "#ffb04a");
  },
};
ZOMBIE.top.noOutline = true;
const SPITTER = { ...ZOMBIE, parts: { ...ZOMBIE.parts, ...skin(SSKIN), chest: SSHIRT, waist: SSHIRT, upperN: SSHIRT, upperF: SSHIRT, elbowN: SSKIN, elbowF: SSKIN, foreN: SSKIN, foreF: SSKIN } };

// ---------- animations
const MAGE_HOLD = { bx: 7, by: -18 }; // the far hand keeps the staff
const CAST = (fx, fy, extra = {}) => ({ ...MAGE_HOLD, crouch: 2, lean: 2, ffx: 7, fbx: -6, fx, fy, ...extra });

const mageAnims = [
  { name: "idle", fps: 4, poses: idle(4, { fx: -2, fy: -15, ...MAGE_HOLD }) },
  { name: "run", fps: 12, poses: runCycle(8, {}, (i, s) => ({ bx: 8, by: -19 + Math.abs(s) })) },
  { name: "jump", fps: 6, loop: false, poses: [{ ...JUMP_UP, ...MAGE_HOLD }, { ...JUMP_DOWN, ...MAGE_HOLD }] },
  { name: "crouch", fps: 6, poses: [{ ...CROUCH, bx: 9, by: -11 }] },
  { name: "shoot", fps: 16, loop: false, poses: [CAST(-4, -25), CAST(17, -25, { lean: 4 }), CAST(14, -23)] },
  { name: "shoot_up", fps: 16, loop: false, poses: [CAST(-2, -26), CAST(4, -43, { lean: -1 }), CAST(4, -40, { lean: -1 })] },
  { name: "crouch_shoot", fps: 16, loop: false, poses: [{ ...CROUCH, fx: -2, fy: -14 }, { ...CROUCH, fx: 17, fy: -16 }, { ...CROUCH, fx: 14, fy: -15 }] },
  { name: "shoot_down", fps: 16, loop: false, poses: [{ ...JUMP_DOWN, fx: 6, fy: -16 }, { ...JUMP_DOWN, fx: 6, fy: -4 }, { ...JUMP_DOWN, fx: 6, fy: -6 }] },
  { name: "special", fps: 10, loop: false, poses: [CAST(-2, -38, { bx: 4, by: -38, crouch: 1, lean: -1 }), CAST(-1, -42, { bx: 5, by: -42, lean: -2 }), CAST(16, -30, { lean: 5 }), CAST(14, -27)] },
  { name: "hurt", fps: 8, loop: false, poses: [{ ...HURT, ...MAGE_HOLD }] },
  { name: "death", fps: 8, loop: false, poses: [{ ...HURT }, { ...KNEEL }, lying({}, 0)] },
];

const BOW = { weapon: "bow" };
const BOW_REST = { ...BOW, sa: -0.4, fx: 12, fy: -20, bx: 6, by: -17 };
const AIM = (o = {}) => ({ ...BOW, crouch: 3, lean: 1, fx: 18, fy: -28, sa: 0, bx: 10, by: -27, nocked: true, ffx: 9, fbx: -8, ...o });
const DRAWN = (o = {}) => AIM({ crouch: 4, lean: -1, bx: -3, by: -29, pull: true, ...o });
const AIM_UP = (o = {}) => ({ ...BOW, crouch: 3, lean: -2, fx: 5, fy: -45, sa: -Math.PI / 2, bx: 4, by: -36, nocked: true, ffx: 6, fbx: -6, ...o });
const AIM_LOW = (o = {}) => AIM({ ...CROUCH, fx: 18, fy: -18, bx: 10, by: -17, ...o });
const AIM_DOWN = (o = {}) => ({ ...JUMP_DOWN, ...BOW, fx: 7, fy: -4, sa: Math.PI / 2, bx: 6, by: -14, nocked: true, ...o });

const archerAnims = [
  { name: "idle", fps: 4, poses: idle(4, BOW_REST) },
  { name: "run", fps: 12, poses: runCycle(8, {}, (i, s) => ({ ...BOW_REST, fx: 11 + s, fy: -20 + Math.abs(s) })) },
  { name: "jump", fps: 6, loop: false, poses: [{ ...JUMP_UP, ...BOW_REST, fy: -26 }, { ...JUMP_DOWN, ...BOW_REST }] },
  { name: "crouch", fps: 6, poses: [{ ...CROUCH, ...BOW, sa: -0.4, fx: 11, fy: -12, bx: 6, by: -11 }] },
  { name: "shoot", fps: 16, loop: false, poses: [AIM(), DRAWN(), AIM({ nocked: false, bx: -8, by: -31 })] },
  { name: "shoot_up", fps: 16, loop: false, poses: [AIM_UP(), AIM_UP({ bx: 3, by: -27, pull: true }), AIM_UP({ nocked: false, bx: 2, by: -24 })] },
  { name: "crouch_shoot", fps: 16, loop: false, poses: [AIM_LOW(), AIM_LOW({ bx: -3, by: -19, pull: true }), AIM_LOW({ nocked: false, bx: -7, by: -21 })] },
  { name: "shoot_down", fps: 16, loop: false, poses: [AIM_DOWN(), AIM_DOWN({ bx: 5, by: -20, pull: true }), AIM_DOWN({ nocked: false, bx: 4, by: -22 })] },
  { name: "special", fps: 10, loop: false, poses: [AIM({ fx: 14, fy: -38, sa: -0.9, bx: 8, by: -34 }), AIM({ fx: 14, fy: -38, sa: -0.9, bx: -2, by: -30, pull: true }), AIM({ fx: 14, fy: -38, sa: -0.9, nocked: false, bx: -6, by: -28 }), BOW_REST] },
  { name: "hurt", fps: 8, loop: false, poses: [{ ...HURT, ...BOW, sa: -0.8 }] },
  { name: "death", fps: 8, loop: false, poses: [{ ...HURT }, { ...KNEEL }, lying({}, 0)] },
];

const zombieAnims = [
  { name: "walk", fps: 6, poses: shamble(6) },
  { name: "attack", fps: 10, loop: false, poses: [{ ...shamble(1)[0], fx: 6, fy: -38, bx: 8, by: -36, lean: -1 }, { ...shamble(1)[0], fx: 18, fy: -20, bx: 16, by: -18, lean: 7 }, { ...shamble(1)[0], fx: 16, fy: -18, lean: 6 }] },
  { name: "spit", fps: 8, loop: false, poses: [{ ...shamble(1)[0], lean: -4, hy: -3, fx: 4, fy: -20, bx: 6, by: -20 }, { ...shamble(1)[0], lean: 8, hy: 3, fx: 8, fy: -16, bx: 10, by: -16 }, { ...shamble(1)[0], lean: 6, hy: 2 }] },
  { name: "hurt", fps: 8, loop: false, poses: [{ ...shamble(1)[0], lean: -3, x: -2, hy: -2 }] },
  { name: "death", fps: 8, loop: false, poses: [{ ...shamble(1)[0], lean: -4, x: -2 }, { ...KNEEL, fx: 12, fy: -8 }, lying({}, 0)] },
];

// where spells leave the hand, per animation (frame 1 = the release), relative to the feet
function muzzles(anims) {
  const out = {};
  for (const a of anims) {
    const p = a.poses[1];
    if (!/shoot|special|spit/.test(a.name) || typeof p !== "object") continue;
    const h = skeleton(p).joints.handN;
    out[a.name] = [Math.round(h[0] + (p.x ?? 0)), Math.round(h[1] + (p.y ?? 0))];
  }
  return out;
}

const CHARACTERS = { mage: [MAGE, mageAnims], archer: [ARCHER, archerAnims], zombie: [ZOMBIE, zombieAnims], spitter: [SPITTER, zombieAnims] };

const preview = process.argv.includes("--preview");
const only = process.argv.slice(2).filter((a) => !a.startsWith("--"));
mkdirSync(OUT, { recursive: true });
for (const [name, [costume, anims]] of Object.entries(CHARACTERS)) {
  if (only.length && !only.includes(name)) continue;
  const { sheet, meta } = buildSheet(anims, costume, CELL);
  meta.muzzles = muzzles(anims);
  sheet.save(join(OUT, name + ".png"));
  writeFileSync(join(OUT, name + ".json"), JSON.stringify(meta, null, 1));
  if (preview) sheet.scaled(3).save(join(ROOT, "tools", "art", "out", name + "-preview.png"));
  console.log(name, sheet.w + "x" + sheet.h, Object.keys(meta.animations).join(" "));
}
void range; void Canvas; void mid;
