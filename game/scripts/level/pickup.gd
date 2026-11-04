class_name Pickup
extends Area2D
## Items on the level. gem = points, mana = special charges. Add a kind in _apply().

var kind := "gem"
var t := 0.0
var sprite: Node2D
var base_y := 0.0

func _ready() -> void:
	collision_layer = Game.LAYER_PICKUP
	collision_mask = Game.LAYER_PLAYER
	var shape := CollisionShape2D.new()
	var c := CircleShape2D.new()
	c.radius = 9
	shape.shape = c
	add_child(shape)
	if kind == "gem":
		var s: AnimatedSprite2D = Sheets.make_sprite(Sheets.fx("gem"))
		s.play("fx")
		sprite = s
	else:
		var s2: AnimatedSprite2D = Sheets.make_sprite(Sheets.fx("gem"))
		s2.modulate = Color(0.5, 0.8, 2.0)
		s2.play("fx")
		sprite = s2
	add_child(sprite)
	base_y = position.y
	body_entered.connect(_on_body)

func _process(delta: float) -> void:
	t += delta
	position.y = base_y + round(sin(t * 3.0) * 2.0)

func _on_body(body: Node) -> void:
	if not body is Player:
		return
	_apply(body)
	Fx.play("poof", global_position + Vector2(0, 8))
	queue_free()

func _apply(p: Player) -> void:
	match kind:
		"gem":
			Game.add_score(500)
		"mana":
			p.special_ammo += 3
			Game.special_changed.emit(p.special_ammo)
			Game.say("+3 MAGIA ESPECIAL", 1.2)
