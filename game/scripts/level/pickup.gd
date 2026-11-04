class_name Pickup
extends Area2D
## Items. kind: "gem" (points), "mana" (+3 specials) or "power" (power_id from data/powers.json, dropped by enemies).
## Add a kind in _make_sprite() and _apply().

const POWER_LIFETIME := 10.0

var kind := "gem"
var power_id := ""
var t := 0.0
var sprite: Node2D
var base_y := 0.0

func _ready() -> void:
	collision_layer = Game.LAYER_PICKUP
	collision_mask = Game.LAYER_PLAYER
	var shape := CollisionShape2D.new()
	var c := CircleShape2D.new()
	c.radius = 10
	shape.shape = c
	add_child(shape)
	sprite = _make_sprite()
	add_child(sprite)
	base_y = position.y
	body_entered.connect(_on_body)

func _make_sprite() -> Node2D:
	if kind == "power":
		var s := Sprite2D.new()
		s.texture = load("res://assets/sprites/powers/%s.png" % power_id)
		return s
	var a: AnimatedSprite2D = Sheets.make_sprite(Sheets.fx("gem"))
	if kind == "mana":
		a.modulate = Color(0.5, 0.8, 2.0)
	a.play("fx")
	return a

func _process(delta: float) -> void:
	t += delta
	position.y = base_y + round(sin(t * 3.0) * 2.0)
	if kind == "power":
		# blink in the last seconds, then vanish
		if t > POWER_LIFETIME - 3.0:
			sprite.visible = int(t * 10) % 2 == 0
		if t > POWER_LIFETIME:
			queue_free()

func _on_body(body: Node) -> void:
	if not body is Player or (body as Player).state == "dead":
		return
	_apply(body)
	queue_free()

func _apply(p: Player) -> void:
	match kind:
		"gem":
			Game.add_score(500)
			Audio.play("gem")
			Fx.play("poof", global_position + Vector2(0, 8))
		"mana":
			p.special_ammo += 3
			Audio.play("mana")
			Game.special_changed.emit(p.special_ammo)
			Game.say("+3 MAGIA ESPECIAL", 1.2)
			Fx.play("poof", global_position + Vector2(0, 8))
		"power":
			p.set_power(power_id)
			var info: Dictionary = Game.powers["list"][power_id]
			Game.say(info["name"].to_upper() + "!", 1.5)
			Fx.play("power_get", global_position)
