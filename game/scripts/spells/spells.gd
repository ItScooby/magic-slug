class_name Spells
## Casts spells from res://data/spells.json. To add a spell: add an entry to spells.json; for a new behaviour, add a
## `type` branch below.

## origin: where it leaves the hand. aim: unit direction (right, left, up, down). facing: 1 or -1.
## caster: who cast it (boomerangs fly back to it). hero_spell: the caster's basic attack, for fx "@hero".
static func cast(spell_name: String, origin: Vector2, aim: Vector2, facing: int, team: String, caster: Node2D = null, hero_spell := "") -> void:
	var spell: Dictionary = Game.spells.get(spell_name, {})
	if spell.is_empty() or not is_instance_valid(Fx.world):
		push_warning("Unknown spell " + spell_name)
		return
	if spell.get("fx", "") == "@hero" or spell.get("hit_fx", "") == "@hero":
		var base: Dictionary = Game.spells.get(hero_spell, {})
		spell = spell.duplicate()
		if spell["fx"] == "@hero":
			spell["fx"] = base.get("fx", "fireball")
		if spell.get("hit_fx", "") == "@hero":
			spell["hit_fx"] = base.get("hit_fx", "")
	match spell.get("type", "projectile"):
		"projectile":
			var n: int = spell.get("count", 1)
			var spread: float = deg_to_rad(spell.get("spread", 0.0))
			var jitter: float = deg_to_rad(spell.get("jitter", 0.0))
			for i in n:
				var a := aim.angle() + (i - (n - 1) / 2.0) * spread + randf_range(-jitter, jitter)
				var v: Vector2 = Vector2.from_angle(a) * spell.get("speed", 300.0)
				if spell.has("lift") and abs(aim.y) < 0.5:
					v.y -= spell["lift"]
				var p := _spawn(spell, team, origin, v, 0.0)
				p.caster = caster
		"lob":
			var speed: float = spell.get("speed", 180.0)
			var v := Vector2(facing * speed, -spell.get("lift", 200.0))
			if aim.y < -0.5:
				v = Vector2(facing * speed * 0.3, -spell.get("lift", 200.0) * 1.4)
			elif aim.y > 0.5:
				v = Vector2(facing * speed * 0.3, 60)
			_spawn(spell, team, origin, v, 600.0)
		"rain":
			_rain(spell, team, origin, facing)

static func _spawn(spell: Dictionary, team: String, pos: Vector2, velocity: Vector2, gravity: float) -> Projectile:
	var p := Projectile.new()
	p.position = pos
	p.setup(spell, team, velocity, gravity)
	Fx.world.add_child(p)
	return p

## One arrow goes up; a moment later arrows fall on the area ahead.
static func _rain(spell: Dictionary, team: String, origin: Vector2, facing: int) -> void:
	var up := _spawn(spell, team, origin, Vector2(facing * 60, -spell.get("speed", 400.0)), 0.0)
	up.max_range = 140
	up.collision_mask = 0
	var tree := Fx.world.get_tree()
	var top := Fx.camera.get_screen_center_position().y - 160 if Fx.camera else origin.y - 200
	var center: float = origin.x + facing * spell.get("ahead", 120.0)
	var width: float = spell.get("width", 100.0)
	var n: int = spell.get("count", 8)
	for i in n:
		var t: float = spell.get("delay", 0.35) + i * 0.06
		tree.create_timer(t).timeout.connect(func():
			if not is_instance_valid(Fx.world):
				return
			var x: float = center + randf_range(-width / 2, width / 2)
			var v := Vector2(facing * 40, spell.get("speed", 400.0))
			var arrow := _spawn(spell, team, Vector2(x, top), v, 0.0)
			arrow.max_range = 400
		)
