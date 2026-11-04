extends Node
## Plays pixelfx effects in the level (autoload "Fx").
##   Fx.play("explosion", pos)                     one-shot, frees itself
##   Fx.play("torch", pos, {"loop": true})         stays (props)
##   Fx.shake(4.0)                                 camera shake
##   Fx.ring(pos, Color.RED, 40.0)                  expanding pixel ring (power pickup, death)

var world: Node2D           ## set by the level
var camera: Camera2D        ## set by the level
var _shake := 0.0

func play(name: String, pos: Vector2, opts := {}) -> AnimatedSprite2D:
	if world == null:
		return null
	var info: Dictionary = Sheets.fx(name)
	var s: AnimatedSprite2D = Sheets.make_sprite(info)
	s.position = pos
	s.z_index = opts.get("z", 5)
	if opts.get("flip", false):
		s.scale.x = -1
	if opts.has("rotation"):
		s.rotation = opts["rotation"]
	if opts.has("scale"):
		s.scale *= opts["scale"]
	if opts.has("modulate"):
		s.modulate = opts["modulate"]
	world.add_child(s)
	s.play("fx")
	if not info["loop"] and not opts.get("loop", false):
		s.animation_finished.connect(s.queue_free)
	return s

func shake(amount: float) -> void:
	_shake = max(_shake, amount)

func _process(delta: float) -> void:
	if camera == null or not is_instance_valid(camera):
		return
	if _shake > 0.05:
		camera.offset = Vector2(randf_range(-_shake, _shake), randf_range(-_shake, _shake)).round()
		_shake = move_toward(_shake, 0.0, delta * 30.0)
	else:
		camera.offset = Vector2.ZERO

## An expanding ring that fades out.
func ring(pos: Vector2, color: Color, radius := 36.0, seconds := 0.35, width := 2.0) -> void:
	if world == null:
		return
	var r := Ring.new()
	r.position = pos
	r.color = color
	r.width = width
	r.z_index = 6
	world.add_child(r)
	var tw := r.create_tween().set_parallel()
	tw.tween_property(r, "radius", radius, seconds).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	tw.tween_property(r, "modulate:a", 0.0, seconds).set_ease(Tween.EASE_IN)
	tw.chain().tween_callback(r.queue_free)

class Ring extends Node2D:
	var radius := 2.0:
		set(v):
			radius = v
			queue_redraw()
	var color := Color.WHITE
	var width := 2.0
	func _draw() -> void:
		draw_arc(Vector2.ZERO, round(radius), 0, TAU, 24, color, width)
