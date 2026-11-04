// Tiny RGBA canvas for pixel art: set pixels, lines, filled polygons, ellipses, outline, blit, save PNG.
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { encodePNG } from "../../pixelfx/tools/lib/png.mjs";

export const rgb = (hex) => {
  const h = hex.replace("#", "");
  const f = h.length <= 4 ? h.split("").map((c) => parseInt(c + c, 16)) : h.match(/../g).map((c) => parseInt(c, 16));
  return [f[0], f[1], f[2], f[3] ?? 255];
};

export class Canvas {
  constructor(w, h) {
    this.w = w; this.h = h;
    this.data = new Uint8ClampedArray(w * h * 4);
  }
  inside(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
  get(x, y) {
    if (!this.inside(x, y)) return [0, 0, 0, 0];
    const i = (y * this.w + x) * 4, d = this.data;
    return [d[i], d[i + 1], d[i + 2], d[i + 3]];
  }
  alpha(x, y) { return this.inside(x, y) ? this.data[(y * this.w + x) * 4 + 3] : 0; }
  set(x, y, c) {
    x = Math.round(x); y = Math.round(y);
    if (!this.inside(x, y)) return;
    if (typeof c === "string") c = rgb(c);
    const i = (y * this.w + x) * 4, d = this.data, a = (c[3] ?? 255) / 255;
    if (a >= 1 || d[i + 3] === 0) { d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = c[3] ?? 255; return; }
    d[i] = d[i] * (1 - a) + c[0] * a; d[i + 1] = d[i + 1] * (1 - a) + c[1] * a; d[i + 2] = d[i + 2] * (1 - a) + c[2] * a;
    d[i + 3] = Math.min(255, d[i + 3] + c[3]);
  }
  rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c); }
  line(x0, y0, x1, y1, c) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let e = dx + dy;
    for (;;) {
      this.set(x0, y0, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * e;
      if (e2 >= dy) { e += dy; x0 += sx; }
      if (e2 <= dx) { e += dx; y0 += sy; }
    }
  }
  // filled polygon; shade(x, y) may return a color per pixel
  poly(pts, c) {
    const ys = pts.map((p) => p[1]), y0 = Math.floor(Math.min(...ys)), y1 = Math.ceil(Math.max(...ys));
    for (let y = y0; y <= y1; y++) {
      const xs = [], py = y + 0.5;
      for (let i = 0; i < pts.length; i++) {
        const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
        if ((ay <= py && by > py) || (by <= py && ay > py)) xs.push(ax + ((py - ay) / (by - ay)) * (bx - ax));
      }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2)
        for (let x = Math.round(xs[k]); x < Math.round(xs[k + 1]); x++) this.set(x, y, typeof c === "function" ? c(x, y) : c);
    }
  }
  ellipse(cx, cy, rx, ry, c) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.set(x, y, typeof c === "function" ? c(x, y) : c);
      }
  }
  // one-pixel ink ring around everything opaque
  outline(c = "#0e0c14") {
    const add = [];
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (this.alpha(x, y)) continue;
      if (this.alpha(x - 1, y) > 127 || this.alpha(x + 1, y) > 127 || this.alpha(x, y - 1) > 127 || this.alpha(x, y + 1) > 127) add.push([x, y]);
    }
    for (const [x, y] of add) this.set(x, y, c);
    return this;
  }
  blit(src, ox, oy, { flip = false } = {}) {
    for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
      const p = src.get(x, y);
      if (p[3]) this.set(ox + (flip ? src.w - 1 - x : x), oy + y, p);
    }
  }
  save(file) {
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, encodePNG(this.w, this.h, this.data));
  }
  scaled(k) {
    const o = new Canvas(this.w * k, this.h * k);
    for (let y = 0; y < o.h; y++) for (let x = 0; x < o.w; x++) {
      const p = this.get((x / k) | 0, (y / k) | 0);
      if (p[3]) o.set(x, y, p);
    }
    return o;
  }
}

// Value noise for textures, deterministic.
export function hash(x, y, s = 0) {
  let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
