class_name Water
extends Area2D
## A water pit. Its surface mirrors the floor and anyone standing near it (shaders/water.gdshader).
## Falling in: a splash, the hero loses a life, enemies are gone. Placed by "water" in the level JSON.

var rect := Rect2()

func setup(x0: float, x1: float, surface_y: float, bottom := 300.0) -> void:
	rect = Rect2(x0, surface_y, x1 - x0, bottom - surface_y)

func _ready() -> void:
	collision_layer = 0
	collision_mask = Game.LAYER_PLAYER | Game.LAYER_ENEMY
	var shape := CollisionShape2D.new()
	var r := RectangleShape2D.new()
	r.size = Vector2(rect.size.x, rect.size.y)
	shape.shape = r
	shape.position = rect.position + rect.size / 2.0 + Vector2(0, 6)
	add_child(shape)
	var look := ColorRect.new()
	look.position = rect.position
	look.size = rect.size
	look.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var mat := ShaderMaterial.new()
	mat.shader = load("res://shaders/water.gdshader")
	mat.set_shader_parameter("rect_height", rect.size.y)
	look.material = mat
	look.z_index = 8           # above the world, so everything drawn before it can be mirrored
	add_child(look)
	body_entered.connect(_on_body)

func _on_body(body: Node) -> void:
	var b := body as Node2D
	Fx.play("splash", Vector2(b.global_position.x, rect.position.y + 2), {"z": 9, "scale": 0.6})
	Fx.shake(2.0)
	Audio.play("splash")
	if body is Player:
		(body as Player).die(true)
	elif body is Enemy:
		body.queue_free()
