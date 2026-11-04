// Pose helpers for the side-scroller characters. Poses use the pixelfx rig format (see tools/pixelfx/src/core/poses.js):
// px from the feet, y negative is up, the figure faces right. f* is the near hand, b* the far hand, ff*/fb* the feet.
const TAU = Math.PI * 2;

export const range = (n, fn) => Array.from({ length: n }, (_, i) => fn(i, n));

/** A run cycle: n frames, legs and arms swinging; `hands(i, s, c)` can override the arms. */
export function runCycle(n, base = {}, hands) {
  return range(n, (i) => {
    const a = (i / n) * TAU, s = Math.sin(a), c = Math.cos(a);
    const pose = {
      ...base,
      crouch: (base.crouch ?? 2) + Math.abs(c) * 1.5,
      lean: base.lean ?? 3,
      ffx: 2 + 8 * s, ffy: -3 - Math.max(0, 5 * c),
      fbx: 2 - 8 * s, fby: -3 - Math.max(0, -5 * c),
      fx: -1 - 7 * s, fy: -17 + Math.abs(s),
      bx: 5 + 7 * s, by: -17 + Math.abs(s),
    };
    return hands ? { ...pose, ...hands(i, s, c) } : pose;
  });
}

/** A shamble: short dragging steps, arms out front. */
export function shamble(n, base = {}) {
  return range(n, (i) => {
    const a = (i / n) * TAU, s = Math.sin(a), c = Math.cos(a);
    return {
      lean: 4, crouch: 2 + Math.abs(s),
      ffx: 1 + 5 * s, ffy: -3 - Math.max(0, 2 * c),
      fbx: 1 - 5 * s, fby: -3,
      fx: 15 + 1.5 * c, fy: -26 + s,
      bx: 13 - 1.5 * c, by: -25 - s,
      hy: s * 1.5,
      ...base,
    };
  });
}

/** Breathing idle. */
export function idle(n, base = {}) {
  return range(n, (i) => {
    const s = Math.sin((i / n) * TAU);
    return { ...base, crouch: (base.crouch ?? 1) + (s > 0 ? 1 : 0), fy: (base.fy ?? -15) + (s > 0 ? 1 : 0), by: (base.by ?? -15) + (s > 0 ? 1 : 0) };
  });
}

export const JUMP_UP = { y: -4, crouch: 0, lean: 1, ffx: 5, ffy: -8, fbx: -3, fby: -5, fx: -6, fy: -27, bx: 7, by: -24 };
export const JUMP_DOWN = { y: -4, crouch: 0, lean: 0, ffx: 4, ffy: -3, fbx: -4, fby: -7, fx: -7, fy: -22, bx: 8, by: -22 };
export const CROUCH = { crouch: 11, lean: 4, ffx: 7, ffy: -4, fbx: -6, fby: -4, fx: 4, fy: -10, bx: 8, by: -10 };
export const HURT = { crouch: 3, lean: -5, x: -2, fx: -8, fy: -28, bx: 2, by: -26, ffx: 3, fbx: -6 };
export const KNEEL = { crouch: 12, lean: 6, ffx: 6, fbx: -7, fx: 6, fy: -6, bx: 9, by: -6 };
