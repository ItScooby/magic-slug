// Exports the pixelfx effects listed in game/data/fx.json to game/assets/fx/<name>.png + <name>.json.
//   node tools/art/export_fx.mjs          -> all of them
//   node tools/art/export_fx.mjs torch    -> only "torch"
import { readFileSync, copyFileSync, mkdirSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const PFX = join(ROOT, "tools", "pixelfx"), OUT = join(ROOT, "game", "assets", "fx"), TMP = join(ROOT, "tools", "art", "out", "fx");
const list = JSON.parse(readFileSync(join(ROOT, "game", "data", "fx.json"), "utf8"));
const only = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });
for (const [name, e] of Object.entries(list)) {
  if (name.startsWith("_") || (only.length && !only.includes(name))) continue;
  const args = [join(PFX, "tools", "render.mjs"), e.id, "--sheet", "--out", join(TMP, name), "--fps", String(e.fps ?? 30)];
  if (e.opts) args.push("--opts", JSON.stringify(e.opts));
  execFileSync("node", args, { cwd: PFX, stdio: "inherit" });
  const base = join(TMP, name, e.id), file = basename(e.id);
  copyFileSync(join(base, file + ".png"), join(OUT, name + ".png"));
  copyFileSync(join(base, file + ".json"), join(OUT, name + ".json"));
}
rmSync(TMP, { recursive: true, force: true });
