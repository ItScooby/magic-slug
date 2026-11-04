class_name Enemy
extends CharacterBody2D
## Any enemy from data/enemies.json. The "ai" field picks the behaviour: walker, spitter, flyer.
## To add a behaviour: add a _think_<name>() function and use that name as "ai" in enemies.json.

const GRAVITY := 900.0

var kind := ""
var data: Dictionary
var info: Dictionary
var sprite: AnimatedSprite2D
var hp := 1
var facing := -1
var state := "idle"         ## idle | move | attack | hurt | dead
var timer := 0.0
var attack_cd := 0.0
var flies := false
var base_y := 0.0
var t := 0.0

func setup(p_kind: String) -> void:
	kind = p_kind
	data = Game.enemies[kind]
	hp = data.get("hp", 1)
	flies = data.get("ai", "") == "flyer"

func _ready() -> void:
	add_to_group("enemies")
	collision_layer = Game.LAYER_ENEMY
	collision_mask = Game.LAYER_WORLD | Game.LAYER_PLATFORM
	var shape := CollisionShape2D.new()
	var rect := RectangleShape2D.new()
	var size: Array = data.get("size", [14, 32])
	rect.size = Vector2(size[0], size[1])
	shape.shape = rect
	shape.position = Vector2(0, 0 if flies else -size[1] / 2.0)
	add_child(shape)
	if data.has("sheet"):
		info = Sheets.character(data["sheet"])
		sprite = Sheets.make_sprite(info, "walk")
		sprite.play("walk")
	else:
		info = Sheets.fx(data["fx"])
		sprite = Sheets.make_sprite(info)
		sprite.play("fx")
	add_child(sprite)
	base_y = global_position.y
	attack_cd = randf_range(0.5, 1.5)

func _player() -> Node2D:
	var list := get_tree().get_nodes_in_group("player")
	return list[0] if list.size() > 0 else null

func _physics_process(delta: float) -> void:
	t += delta
	timer -= delta
	attack_cd -= delta
	if state == "dead":
		if not flies:
			velocity.x = move_toward(velocity.x, 0, (40 if not is_on_floor() else 400) * delta)
			velocity.y += GRAVITY * delta
			move_and_slide()
		return
	var p := _player()
	if state == "hurt":
		velocity.x = move_toward(velocity.x, 0, 300 * delta)
		if timer <= 0:
			state = "move"
	else:
		match data.get("ai", "walker"):
			"walker": _think_walker(p)
			"spitter": _think_spitter(p)
			"flyer": _think_flyer(p, delta)
	if not flies:
		velocity.y += GRAVITY * delta
	move_and_slide()
	if global_position.y > 340:
		queue_free()
	if sprite:
		sprite.scale.x = facing if data.has("sheet") else -facing

func _face(p: Node2D) -> float:
	var dx := p.global_position.x - global_position.x
	if abs(dx) > 2:
		facing = 1 if dx > 0 else -1
	return dx

func _anim(name: String) -> void:
	if sprite and data.has("sheet") and sprite.animation != name:
		sprite.play(name)

# --- walker: shamble toward the player, claw when close
func _think_walker(p: Node2D) -> void:
	if state == "attack":
		velocity.x = 0
		return
	if p == null:
		velocity.x = 0
		return
	var dx := _face(p)
	if abs(dx) > data.get("sight", 300):
		velocity.x = 0
		return
	if abs(dx) < data.get("attack_range", 20) and abs(p.global_position.y - global_position.y) < 24 and attack_cd <= 0:
		_claw(p)
		return
	velocity.x = facing * data.get("speed", 24)
	_anim("walk")

func _claw(_p: Node2D) -> void:
	state = "attack"
	attack_cd = data.get("attack_cooldown", 1.2)
	_anim("attack")
	await get_tree().create_timer(0.2).timeout
	if state != "attack":
		return
	Audio.play("claw")
	var target := _player()
	if target and target.global_position.distance_to(global_position) < data.get("attack_range", 20) + 10:
		target.take_damage(data.get("damage", 1), self)
	await get_tree().create_timer(0.3).timeout
	if state == "attack":
		state = "move"

# --- spitter: keep some distance, lob acid
func _think_spitter(p: Node2D) -> void:
	if state == "attack":
		velocity.x = 0
		return
	if p == null:
		velocity.x = 0
		return
	var dx := _face(p)
	var dist: float = abs(dx)
	if dist > data.get("sight", 300):
		velocity.x = 0
		return
	var keep: float = data.get("keep_distance", 140)
	if attack_cd <= 0:
		_spit()
		return
	if dist > keep + 20:
		velocity.x = facing * data.get("speed", 18)
	elif dist < keep - 30:
		velocity.x = -facing * data.get("speed", 18)
	else:
		velocity.x = 0
	_anim("walk")

func _spit() -> void:
	state = "attack"
	attack_cd = data.get("attack_cooldown", 2.5)
	_anim("spit")
	await get_tree().create_timer(0.25).timeout
	if state != "attack":
		return
	var m: Vector2 = info.get("muzzles", {}).get("spit", Vector2(10, -28))
	var origin := global_position + Vector2(m.x * facing, m.y - 4)
	var p := _player()
	var spell: Dictionary = Game.spells[data.get("attack", "acid")].duplicate()
	if p:
		# aim the lob so it lands near the player
		var dist: float = abs(p.global_position.x - global_position.x)
		spell["speed"] = clamp(dist * 1.4, 60.0, 220.0)
	Audio.play(spell.get("sfx", ""))
	Spells._spawn(spell, "enemy", origin, Vector2(facing * spell["speed"], -spell.get("lift", 170.0)), 600.0)
	await get_tree().create_timer(0.4).timeout
	if state == "attack":
		state = "move"

# --- flyer: sine wave toward the player
func _think_flyer(p: Node2D, _delta: float) -> void:
	if p == null:
		velocity = Vector2.ZERO
		return
	var dx := _face(p)
	if abs(dx) > data.get("sight", 300):
		velocity = Vector2.ZERO
		return
	var target_y: float = p.global_position.y - 24 + sin(t * 3.0) * 30
	velocity.x = facing * data.get("speed", 60)
	velocity.y = clamp((target_y - global_position.y) * 2.0, -80, 80)
	if global_position.distance_to(p.global_position + Vector2(0, -16)) < 14 and attack_cd <= 0:
		attack_cd = 1.0
		p.take_damage(data.get("damage", 1), self)

## Hit feedback: white flash, shiver, a splat where the shot landed and a small push back.
func take_damage(amount: int, source: Node = null) -> void:
	if state == "dead":
		return
	hp -= amount
	var push := -facing
	var at := global_position + Vector2(0, 0 if flies else -16)
	if source is Node2D:
		var s := source as Node2D
		push = 1 if global_position.x >= s.global_position.x else -1
		at = s.global_position
	if data.has("blood_fx"):
		Fx.play(data["blood_fx"], at, {"flip": push < 0})
	Audio.play(data.get("hit_sfx", "") if hp > 0 else data.get("die_sfx", ""))
	if sprite and not (flies and hp <= 0):
		sprite.modulate = Color(3, 3, 3)
		create_tween().tween_property(sprite, "modulate", Color.WHITE, 0.12)
		var tw := create_tween()
		for i in 3:
			tw.tween_property(sprite, "position:x", (2 if i % 2 == 0 else -2), 0.025)
		tw.tween_property(sprite, "position:x", 0, 0.025)
	if hp <= 0:
		_die(push)
		return
	if state != "attack" and not flies:
		state = "hurt"
		timer = 0.15
		velocity.x = push * data.get("knockback", 50)
		_anim("hurt")

## Metal Slug style: a dead enemy may leave a power behind.
func _maybe_drop() -> void:
	var id := Game.roll_power(data.get("drop_chance", -1.0))
	if id == "" or not is_instance_valid(Fx.world):
		return
	var pk := Pickup.new()
	pk.kind = "power"
	pk.power_id = id
	pk.position = global_position + Vector2(0, -12 if not flies else 0)
	Fx.world.add_child.call_deferred(pk)

## Death: a tiny freeze, the body is thrown back, a goo burst, the soul rises, then it blinks away.
func _die(push := 0) -> void:
	state = "dead"
	remove_from_group("enemies")
	collision_layer = 0
	Game.add_score(data.get("score", 100))
	Game.hitstop(0.05)
	_maybe_drop()
	if flies:
		Fx.play("poof", global_position + Vector2(0, 8))
		Fx.ring(global_position, Color(1, 1, 1, 0.8), 18.0, 0.25, 1.0)
		queue_free()
		return
	if push == 0:
		push = -facing
	facing = -push
	velocity = Vector2(push * 70, -150)
	_anim("death")
	if data.has("blood_fx"):
		for i in 2:
			Fx.play(data["blood_fx"], global_position + Vector2(randf_range(-6, 6), -10 - i * 10), {"flip": i == 1})
	Fx.play("soul", global_position, {"modulate": Color(0.7, 1.0, 0.7, 0.8)})
	await get_tree().create_timer(1.0).timeout
	var tw := create_tween()
	for i in 5:
		tw.tween_property(self, "modulate:a", 0.15, 0.06)
		tw.tween_property(self, "modulate:a", 1.0, 0.06)
	tw.tween_property(self, "modulate:a", 0.0, 0.2)
	tw.tween_callback(queue_free)
