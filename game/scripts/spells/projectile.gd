class_name Projectile
extends Area2D
## A spell in flight, built by Spells.cast(). Behaviour comes from the spell's data:
##   area > 0   explodes and damages everything around (meteor, acid)
##   pierce     goes through enemies, hurting each once
##   bounces    bounces on the floor N times (use with gravity)
##   boomerang  flies `range` px, then comes back to the caster

var spell: Dictionary
var team := "player"           ## "player" hits enemies, "enemy" hits the player
var velocity := Vector2.ZERO
var gravity_force := 0.0
var travelled := 0.0
var max_range := 600.0
var done := false
var sprite: AnimatedSprite2D
var caster: Node2D
var bounces_left := 0
var returning := false
var hit_ids := {}
var hit_fx := ""

func setup(p_spell: Dictionary, p_team: String, p_velocity: Vector2, p_gravity := 0.0, fx_override := "") -> void:
	spell = p_spell
	team = p_team
	velocity = p_velocity
	gravity_force = p_gravity if p_gravity > 0 else spell.get("gravity", 0.0)
	max_range = spell.get("range", 800)
	bounces_left = spell.get("bounces", 0)
	hit_fx = spell.get("hit_fx", "")
	collision_layer = Game.LAYER_PLAYER_SHOT if team == "player" else Game.LAYER_ENEMY_SHOT
	collision_mask = Game.LAYER_ENEMY if team == "player" else Game.LAYER_PLAYER
	if not spell.get("boomerang", false):
		collision_mask |= Game.LAYER_WORLD
	var shape := CollisionShape2D.new()
	var circle := CircleShape2D.new()
	circle.radius = spell.get("radius", 5)
	shape.shape = circle
	add_child(shape)
	var fx_name: String = fx_override if fx_override != "" else spell["fx"]
	sprite = Sheets.make_sprite(Sheets.fx(fx_name))
	add_child(sprite)
	sprite.play("fx")
	rotation = velocity.angle()
	body_entered.connect(_on_body)

func _physics_process(delta: float) -> void:
	if done:
		return
	velocity.y += gravity_force * delta
	if spell.get("boomerang", false):
		_boomerang(delta)
	var step := velocity * delta
	position += step
	travelled += step.length()
	rotation = velocity.angle()
	var limit := max_range * (3.0 if spell.get("boomerang", false) else 1.0)
	if travelled > limit or position.y > 600:
		queue_free()

func _boomerang(delta: float) -> void:
	if not returning and travelled >= max_range:
		returning = true
		hit_ids.clear()            # it can hit again on the way back
	if returning:
		var target := caster.global_position + Vector2(0, -18) if is_instance_valid(caster) else global_position
		var to := target - global_position
		var speed: float = spell.get("speed", 300.0)
		velocity = velocity.move_toward(to.normalized() * speed, speed * 4.0 * delta)
		if to.length() < 12:
			queue_free()

func _on_body(body: Node) -> void:
	if done:
		return
	if body.has_method("take_damage"):
		if spell.get("area", 0) > 0:
			_explode()
		elif spell.get("pierce", false):
			if hit_ids.has(body.get_instance_id()):
				return
			hit_ids[body.get_instance_id()] = true
			body.take_damage(spell.get("damage", 1), self)
			if hit_fx != "":
				Fx.play(hit_fx, global_position, {"flip": velocity.x < 0})
		else:
			body.take_damage(spell.get("damage", 1), self)
			_impact(hit_fx)
	else:
		# a wall or the floor
		if spell.get("area", 0) > 0:
			_explode()
		elif bounces_left > 0:
			bounces_left -= 1
			if velocity.y > 0:
				velocity.y = -max(abs(velocity.y) * 0.8, 170.0)
			else:
				velocity.x = -velocity.x
		else:
			_impact(hit_fx)

func _impact(fx_name: String) -> void:
	done = true
	if fx_name != "":
		Fx.play(fx_name, global_position, {"flip": velocity.x < 0})
	queue_free()

func _explode() -> void:
	done = true
	var area: float = spell.get("area", 30)
	var group := "enemies" if team == "player" else "player"
	for target in get_tree().get_nodes_in_group(group):
		if target.has_method("take_damage") and target.global_position.distance_to(global_position) < area + 12:
			target.take_damage(spell.get("damage", 1), self)
	var fx_name: String = spell.get("explode_fx", "")
	if fx_name != "":
		Fx.play(fx_name, Vector2(global_position.x, global_position.y + 4))
	if area > 30:
		Fx.shake(4.0)
	queue_free()
