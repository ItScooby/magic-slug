class_name Projectile
extends Area2D
## A spell in flight: straight (fireball, arrows) or lobbed (meteor, acid). Built by Spells.cast().

var spell: Dictionary
var team := "player"           ## "player" hits enemies, "enemy" hits the player
var velocity := Vector2.ZERO
var gravity_force := 0.0
var travelled := 0.0
var max_range := 600.0
var done := false
var sprite: AnimatedSprite2D

func setup(p_spell: Dictionary, p_team: String, p_velocity: Vector2, p_gravity := 0.0) -> void:
	spell = p_spell
	team = p_team
	velocity = p_velocity
	gravity_force = p_gravity
	max_range = spell.get("range", 800)
	collision_layer = Game.LAYER_PLAYER_SHOT if team == "player" else Game.LAYER_ENEMY_SHOT
	collision_mask = Game.LAYER_WORLD | (Game.LAYER_ENEMY if team == "player" else Game.LAYER_PLAYER)
	var shape := CollisionShape2D.new()
	var circle := CircleShape2D.new()
	circle.radius = spell.get("radius", 5)
	shape.shape = circle
	add_child(shape)
	sprite = Sheets.make_sprite(Sheets.fx(spell["fx"]))
	add_child(sprite)
	sprite.play("fx")
	rotation = velocity.angle()
	body_entered.connect(_on_body)

func _physics_process(delta: float) -> void:
	if done:
		return
	velocity.y += gravity_force * delta
	var step := velocity * delta
	position += step
	travelled += step.length()
	rotation = velocity.angle()
	if travelled > max_range or position.y > 600:
		queue_free()

func _on_body(body: Node) -> void:
	if done:
		return
	if OS.is_debug_build() and OS.has_environment("DEBUG_SHOTS"):
		print(spell.get("fx"), " hit ", body.name, " at ", global_position.round(), " travelled ", round(travelled))
	if body.has_method("take_damage"):
		if spell.get("area", 0) > 0:
			_explode()
		else:
			body.take_damage(spell.get("damage", 1), self)
			_impact(spell.get("hit_fx", ""))
	else:
		# hit a wall or the floor
		if spell.get("area", 0) > 0:
			_explode()
		else:
			_impact(spell.get("hit_fx", ""))

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
