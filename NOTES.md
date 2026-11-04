# Notes for updates (read this first, it saves reading the code)

Godot 4.3+, GDScript, 480x270 viewport scaled x3 (integer), nearest filtering. Target: macOS on Apple Silicon (M1).
Nodes are built in code (no hand-made scenes except `scenes/main.tscn`). Balance and content live in JSON.

## Where things are

| Want to change | Edit |
|---|---|
| Hero stats, which spells a hero uses | `game/data/characters.json` |
| Spell damage, speed, cooldown, count, fx | `game/data/spells.json` (types: projectile, lob, rain; flags pierce/bounces/boomerang/jitter) |
| Power drops (Metal Slug weapons) | `game/data/powers.json` (drop chance, charges, which spell); icons from `tools/art/environment.mjs` |
| Enemy stats / behaviour pick | `game/data/enemies.json` (ai: walker, spitter, flyer) |
| Level layout, spawns, props, pickups | `game/data/levels/<name>.json` (+ `FIRST_LEVEL` in `scripts/main.gd`) |
| Which pixelfx effects exist in game | `game/data/fx.json`, then `node tools/art/export_fx.mjs <name>` |
| Controls (keyboard + DualSense) | `scripts/core/controls.gd` (`MAP`) |
| Player movement / shooting / dying | `scripts/player/player.gd` |
| New spell behaviour | `scripts/spells/spells.gd` (add a `type` branch), flight in `projectile.gd` |
| New enemy behaviour | `scripts/enemies/enemy.gd` (add `_think_<ai>()` + case in `_physics_process`) |
| Camera, spawning, lives, level end | `scripts/level/level.gd` |
| Pickups (gem, mana, power) and the active power | `scripts/level/pickup.gd`, `Player.set_power()` |
| HUD / title / character select | `scripts/ui/hud.gd`, `scripts/ui/title.gd` |
| Character look and animations | `tools/art/characters.mjs` (templates, palettes, poses), re-run it |
| Tiles, backgrounds, props art | `tools/art/environment.mjs`, re-run it |
| Weapon each hero holds per power | `MAGE_STAFFS` / `ARCHER_BOWS` in `tools/art/characters.mjs` (sheet `<hero>_<power>`, swapped by `Player._refresh_sprite()`) |
| Hit / hurt / death / power-up feedback | `Enemy.take_damage/_die`, `Player.take_damage/die/set_power`; helpers `Game.hitstop()`, `Game.flash()`, `Fx.ring()` |
| Water pits (reflection, splash) | `"water"` in the level JSON; look in `shaders/water.gdshader`, behaviour in `scripts/level/water.gd` |
| Sound volumes, which song plays where | `game/data/audio.json`; cast sounds = `sfx` in spells.json; enemy `hit_sfx`/`die_sfx` |
| Make or change a sound effect | recipe in `tools/audio/make_sfx.mjs`, run `node tools/audio/make_sfx.mjs <name>` |
| Music (original, Mega Drive FM + synthwave) | songs as text in `tools/audio/make_music.mjs` (chords + melody), run it |

Autoloads: `Game` (data, score, lives, signals, hitstop, flash), `Sheets` (sprite sheets -> SpriteFrames), `Fx` (play effects,
shake, ring), `Audio` (`Audio.play("jump")`, `Audio.music("level")`).
Collision layers: 1 world, 2 player, 4 enemy, 8 player shot, 16 enemy shot, 32 pickup, 64 one-way platform.

## Art pipeline

- Characters = chibi paper dolls (`tools/art/lib/doll.mjs`): hand-made pixel templates (head, hat, torso; letters
  mapped to a palette) + limbs drawn as shaded capsules between joints, each layer outlined. Style: big caricature
  heads, about 44 px tall. Sheet rows = animations; JSON has fps, loop, pivot (feet) and `muzzles` (where spells
  leave the hand per shooting animation).
  Required animations for heroes: idle run jump crouch shoot shoot_up crouch_shoot shoot_down special hurt death.
  Enemies: walk attack spit hurt death.
- Effects = pixelfx sheets (`--sheet`), pivot = effect origin, all face right (flip with scale.x, rotate for aim).
  `nudge` in fx.json moves an effect whose drawing sits off its pivot.
- Don't scale pixel art by non-integers; pick/adjust effects with pixelfx options instead (`size`, `palette`).
- The pixelfx skill is in `tools/pixelfx/skills/pixelfx/SKILL.md` for making new effects.

## Sound pipeline

Everything is synthesized by `tools/audio/synth.mjs` (oscillators, 2-operator FM like the Mega Drive's YM2612, noise,
drums, echo) into 22 kHz mono WAVs in `game/assets/audio/`. Seeded random, so rebuilding gives the same files.
Music loops seamlessly (`Audio.music` sets the loop points). Keep melodies original.

## Testing

`godot --headless --path game res://tests/smoke.tscn` plays the demo with a bot (prints a summary, must reach `ended=true`).
With a display, `SHOTS=/some/dir` saves screenshots. Excluded from exports.

## Ideas not done yet

Melee attack when an enemy is close (Metal Slug knife), rescuing prisoners, a boss, more levels,
a second player, power-up spells (pickups that change the basic attack for a while).
