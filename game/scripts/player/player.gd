class_name Player
extends CharacterBody2D
## The hero. Works for any character in data/characters.json: stats, spells and sprite sheet come from there.

signal died

const GRAVITY := 900.0
const MAX_FALL := 480.0
const SHOOT_POSE_TIME := 0.18

var char_id := ""
var data: Dictionary
var info: Dictionary
var sprite: AnimatedSprite2D
var shape: CollisionShape2D
var stand_rect := RectangleShape2D.new()
var crouch_rect := RectangleShape2D.new()

var facing := 1
var hp := 3
var special_ammo := 10
var attack_cd := 0.0
var special_cd := 0.0
var shoot_pose := 0.0
var shoot_anim := "shoot"
var invuln := 0.0
var hurt_time := 0.0
var drop_time := 0.0
var state := "play"            ## play | hurt | dead
var crouching := false
var min_x := -INF              ## the camera's left edge: Metal Slug style, no going back
var controls_enabled := true

func _ready() -> void:
	add_to_group("player")
	collision_layer = Game.LAYER_PLAYER
	collision_mask = Game.LAYER_WORLD | Game.LAYER_PLATFORM
	floor_snap_length = 4.0
	stand_rect.size = Vector2(12, 30)
	crouch_rect.size = Vector2(12, 18)
	shape = CollisionShape2D.new()
	add_child(shape)
	_set_crouch_shape(false)

func setup(id: String, keep_state := false) -> void:
	char_id = id
	data = Game.characters[id]
	info = Sheets.character(data["sheet"])
	if sprite:
		sprite.queue_free()
	sprite = Sheets.make_sprite(info, "idle")
	add_child(sprite)
	sprite.play("idle")
	if not keep_state:
		hp = data.get("hp", 3)
		special_ammo = data.get("special_ammo", 10)
	_emit_stats()

func _emit_stats() -> void:
	Game.hp_changed.emit(hp, data.get("hp", 3))
	Game.special_changed.emit(special_ammo)

func _physics_process(delta: float) -> void:
	attack_cd -= delta
	special_cd -= delta
	shoot_pose -= delta
	invuln -= delta
	drop_time -= delta
	set_collision_mask_value(7, drop_time <= 0.0)

	if state == "dead":
		velocity.x = move_toward(velocity.x, 0, 300 * delta)
		velocity.y = min(velocity.y + GRAVITY * delta, MAX_FALL)
		move_and_slide()
		return

	var dir := Input.get_axis("left", "right") if controls_enabled else 0.0
	var down := controls_enabled and Input.is_action_pressed("down")
	var up := controls_enabled and Input.is_action_pressed("up")
	crouching = down and is_on_floor()
	_set_crouch_shape(crouching)

	if state == "hurt":
		hurt_time -= delta
		velocity.x = move_toward(velocity.x, 0, 400 * delta)
		if hurt_time <= 0:
			state = "play"
	else:
		var speed: float = data.get("speed", 100) * (0.35 if crouching else 1.0)
		velocity.x = dir * speed
		if dir != 0:
			facing = 1 if dir > 0 else -1
		if controls_enabled and Input.is_action_just_pressed("jump") and is_on_floor():
			if down:
				drop_time = 0.25           # drop through a platform
			else:
				velocity.y = -data.get("jump", 320)
		if controls_enabled and Input.is_action_just_released("jump") and velocity.y < -120:
			velocity.y *= 0.55             # short hop when the button is tapped
		if controls_enabled and Input.is_action_pressed("attack") and attack_cd <= 0:
			_cast(data["attack"], up, down)
		if controls_enabled and Input.is_action_just_pressed("special") and special_ammo > 0 and special_cd <= 0:
			special_ammo -= 1
			Game.special_changed.emit(special_ammo)
			_cast(data["special"], up, down, true)

	velocity.y = min(velocity.y + GRAVITY * delta, MAX_FALL)
	move_and_slide()
	if global_position.x < min_x + 10:
		global_position.x = min_x + 10
	if global_position.y > 330:
		die()
	_animate()
	if sprite:
		sprite.visible = invuln <= 0 or int(invuln * 20) % 2 == 0

func _cast(spell_name: String, up: bool, down: bool, special := false) -> void:
	var spell: Dictionary = Game.spells.get(spell_name, {})
	if special:
		special_cd = spell.get("cooldown", 0.6)
		attack_cd = max(attack_cd, 0.25)
	else:
		attack_cd = spell.get("cooldown", 0.3)
	var aim := Vector2(facing, 0)
	if special:
		shoot_anim = "special"
		if up:
			aim = Vector2.UP
	elif up:
		shoot_anim = "shoot_up"
		aim = Vector2.UP
	elif down and not is_on_floor():
		shoot_anim = "shoot_down"
		aim = Vector2.DOWN
	elif crouching:
		shoot_anim = "crouch_shoot"
	else:
		shoot_anim = "shoot"
	shoot_pose = SHOOT_POSE_TIME if not special else 0.4
	var m: Vector2 = info["muzzles"].get(shoot_anim, Vector2(12, -24))
	var origin := global_position + Vector2(m.x * facing, m.y)
	Spells.cast(spell_name, origin, aim, facing, "player")
	sprite.play(shoot_anim)
	sprite.frame = 1

func _animate() -> void:
	if sprite == null:
		return
	sprite.scale.x = facing
	var anim := "idle"
	if state == "dead":
		anim = "death"
	elif state == "hurt":
		anim = "hurt"
	elif shoot_pose > 0:
		anim = shoot_anim
	elif not is_on_floor():
		sprite.animation = "jump"
		sprite.frame = 0 if velocity.y < 0 else 1
		sprite.pause()
		return
	elif crouching:
		anim = "crouch"
	elif abs(velocity.x) > 1:
		anim = "run"
	if sprite.animation != anim or not sprite.is_playing():
		if sprite.animation != anim:
			sprite.play(anim)
		elif sprite.sprite_frames.get_animation_loop(anim):
			sprite.play(anim)

func _set_crouch_shape(on: bool) -> void:
	var r := crouch_rect if on else stand_rect
	if shape.shape != r:
		shape.shape = r
		shape.position = Vector2(0, -r.size.y / 2)

func take_damage(amount: int, source: Node = null) -> void:
	if state == "dead" or invuln > 0:
		return
	hp -= amount
	Game.hp_changed.emit(max(hp, 0), data.get("hp", 3))
	Fx.play("hit_spark", global_position + Vector2(0, -20))
	Fx.shake(3.0)
	if hp <= 0:
		die()
		return
	state = "hurt"
	hurt_time = 0.3
	invuln = 1.4
	var from := 0.0
	if source is Node2D:
		from = sign(global_position.x - (source as Node2D).global_position.x)
	velocity = Vector2(from * 90, -120)

func die() -> void:
	if state == "dead":
		return
	state = "dead"
	hp = 0
	remove_from_group("player")
	velocity = Vector2(-facing * 60, -160)
	sprite.visible = true
	sprite.play("death")
	await get_tree().create_timer(1.6).timeout
	died.emit()

## Back to life after losing a life.
func respawn(at: Vector2) -> void:
	global_position = at
	velocity = Vector2.ZERO
	state = "play"
	add_to_group("player")
	hp = data.get("hp", 3)
	special_ammo = max(special_ammo, data.get("special_ammo", 10))
	invuln = 2.5
	sprite.play("idle")
	_emit_stats()
