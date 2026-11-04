// Dress the pixelfx skeleton character in a costume.
// pixelfx renders a grey 3D dummy (24x38) in any pose. Every pixel knows which pixel of the standing body it came from
// (`src`), so we paint a costume once on the standing body (by body part) and it follows him into every pose.
import { posed, posedParts, skeleton, STAND } from "../../pixelfx/src/core/index.js";
import { DUMMY_PAL } from "../../pixelfx/src/core/actor.js";
import { Canvas, rgb } from "./canvas.mjs";

const toHex = (c) => "#" + [c & 255, (c >>> 8) & 255, (c >>> 16) & 255].map((v) => v.toString(16).padStart(2, "0")).join("");
const DUMMY = Object.fromEntries(Object.entries(DUMMY_PAL).map(([k, v]) => [v.toLowerCase(), k]));
// dummy color -> [kind, tone]
const TONE = { A: 0, B: 1, C: 2, D: 3, E: 1, F: 2, G: 3, J: 3, m: 1 };

// Which body part each pixel of a pose belongs to: render the parts one by one, and where they overlap keep the part
// whose own pixel matches the finished picture (then the nearest one).
function partMap(pose, P) {
  const final = new Map();
  for (let i = 0; i < P.n; i++) final.set(P.xs[i] + "," + P.ys[i], P.color[i]);
  const best = new Map();
  for (const part of posedParts(pose)) {
    for (let i = 0; i < part.n; i++) {
      const k = part.xs[i] + "," + part.ys[i], match = final.get(k) === part.color[i] ? 1 : 0, score = match * 1000 + part.z;
      const cur = best.get(k);
      if (!cur || score > cur.score) best.set(k, { score, name: part.name });
    }
  }
  return (x, y) => best.get(x + "," + y)?.name ?? null;
}

/**
 * Draw one pose of a costumed character into a cell.
 * costume: { parts: { partName: [lit, mid, dark, darkest] }, ink, back(c, J, q), front(c, J, q), overArm(c, J, q) }
 * Returns a Canvas of size cell.w x cell.h with the feet at (cell.ox, cell.oy).
 */
export function drawCharacter(pose, costume, cell) {
  const P = posed(pose), J = skeleton(pose).joints, q = { ...STAND, ...pose };
  const ox = cell.ox + Math.round(q.x ?? 0), oy = cell.oy + Math.round(q.y ?? 0);
  const at = (name) => [ox + J[name][0], oy + J[name][1], J[name][2]];
  const joints = new Proxy({}, { get: (_, k) => at(k) });
  const out = new Canvas(cell.w, cell.h);
  const ink = costume.ink ?? "#0e0c14";

  const layer = (fn) => {
    if (!fn) return;
    const L = new Canvas(cell.w, cell.h);
    fn(L, joints, q);
    if (!fn.noOutline) L.outline(ink);
    out.blit(L, 0, 0);
  };
  layer(costume.back);

  const armPx = [], regionAt = partMap(pose, P);
  for (let i = 0; i < P.n; i++) {
    const x = ox + P.xs[i], y = oy + P.ys[i], key = DUMMY[toHex(P.color[i])], region = regionAt(P.xs[i], P.ys[i]);
    let col;
    if (P.ink[i] || key === "k") col = ink;
    else if (key && region && costume.parts[region]) col = costume.parts[region][TONE[key]];
    else if (key && costume.parts.default) col = costume.parts.default[TONE[key]];
    else col = rgb(toHex(P.color[i])); // weapons keep their own colors
    out.set(x, y, col);
    if (region && /^(upperN|elbowN|foreN|handN)$/.test(region)) armPx.push([x, y, col]);
  }
  layer(costume.front);
  // the near arm comes back over a skirt or a cloak front
  if (costume.front && costume.armOverFront !== false) for (const [x, y, c] of armPx) out.set(x, y, c);
  layer(costume.top);
  return out;
}

/** A sprite sheet: rows of animations. anims: [{ name, poses: [pose...], fps, loop }]. */
export function buildSheet(anims, costume, cell) {
  const cols = Math.max(...anims.map((a) => a.poses.length));
  const sheet = new Canvas(cols * cell.w, anims.length * cell.h);
  const meta = { cell: [cell.w, cell.h], pivot: [cell.ox, cell.oy], animations: {} };
  anims.forEach((a, row) => {
    a.poses.forEach((p, i) => sheet.blit(typeof p === "function" ? p(costume, cell) : drawCharacter(p, costume, cell), i * cell.w, row * cell.h));
    meta.animations[a.name] = { row, frames: a.poses.length, fps: a.fps ?? 10, loop: a.loop ?? true };
  });
  return { sheet, meta };
}

/** A pose lying on the floor: drawn standing, then turned a quarter about the feet (head to the back). */
export function lying(pose = {}, drop = 0) {
  return (costume, cell) => {
    const up = drawCharacter(pose, costume, cell), out = new Canvas(cell.w, cell.h);
    for (let y = 0; y < cell.h; y++) for (let x = 0; x < cell.w; x++) {
      const p = up.get(x, y);
      if (!p[3]) continue;
      // (dx, dy) from the feet -> (dy, -dx): the head (dy < 0) ends up behind (x < feet)
      const dx = x - cell.ox, dy = y - cell.oy;
      out.set(cell.ox + dy + 6, cell.oy - 3 - dx + drop, p);
    }
    return out;
  };
}
