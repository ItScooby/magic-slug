# Changelog

## 0.3.0 (2026-11-04)

- Zacarias now casts through his staff (fire at the tip), not his hand.
- Every power changes the weapon in the hero's hands: 5 staffs for the mage, 5 bows for the archer (one sprite
  sheet per weapon, swapped when the power changes).
- Feedback animations: hit-stop on kills and hits, enemies flash, shiver, splatter goo and get knocked back; dead
  enemies are thrown back and blink away; the hero turns red with a red screen flash when hurt; death has a slow-mo,
  white flash and a soul in the hero's colour; picking a power freezes for a moment, shoots rings in its colour and
  pops the HUD label.
- Water pit: the pit in the dungeon is now water that mirrors the scenery (shader), with a splash when you fall in.
- Sound: 30 effects and 2 songs (title and level), all generated in code in a Mega Drive FM style with a synthwave
  touch. Original melodies. Volumes in `data/audio.json`.

## 0.2.0 (2026-11-04)

- New look: caricature chibi characters drawn from pixel templates. Zacarias, o Mago (red nose, broom eyebrows,
  giant hat) and Tico, o Arqueiro (ginger, big chin, buck teeth, feathered cap). New zombies: popped eye and brain
  showing; the spitter is bloated and drools acid.
- Archer's basic attack is now a single arrow (2 damage).
- Powers dropped by enemies (20%, bats 10%), Metal Slug style: Tiro Triplo, Ricochete, Lanca de Gelo, Bumerangue,
  Rajada. Temporary (charges), lost on death, shown on the HUD.

## 0.1.0 (2026-11-04) Demo

- Godot 4 project, 480x270 pixel art, runs natively on macOS (Apple Silicon).
- PS5 DualSense and keyboard controls.
- Heroes: Mago (bola de fogo; especial Meteoro) and Arqueiro (salva de 3 flechas; especial Chuva de flechas). Swap with Triangle.
- Enemies: zumbi (walks and claws), zumbi cuspidor (lobs acid), morcego (flies).
- Demo level "Masmorra do Templo": dungeon then temple, platforms, a pit, gems and mana crystals, exit gate.
- Metal Slug camera (no going back), lives, limited specials, score, pause.
- Art: pixelfx effects + characters built from the pixelfx skeleton; dungeon/temple tiles and parallax backgrounds.
- Smoke test bot (`game/tests/smoke.tscn`).
