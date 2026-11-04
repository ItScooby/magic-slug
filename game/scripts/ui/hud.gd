class_name Hud
extends CanvasLayer
## On-screen info: hearts, special charges, lives, score, messages, pause.

var hp_label: Label
var special_label: Label
var lives_label: Label
var score_label: Label
var msg_label: Label
var pause_label: Label
var help_label: Label
var power_label: Label
var msg_time := 0.0
var flash_rect: ColorRect

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	layer = 10
	flash_rect = ColorRect.new()
	flash_rect.size = Vector2(480, 270)
	flash_rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
	flash_rect.color = Color(1, 1, 1, 0)
	add_child(flash_rect)
	hp_label = _label(Vector2(8, 6), Color("#ff6a6a"))
	special_label = _label(Vector2(8, 18), Color("#8fd6ff"))
	lives_label = _label(Vector2(8, 30), Color("#f2c14e"))
	power_label = _label(Vector2(8, 42), Color.WHITE)
	score_label = _label(Vector2(330, 6), Color.WHITE)
	score_label.size.x = 142
	score_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	msg_label = _label(Vector2(0, 96), Color("#ffe9a0"), 16)
	msg_label.size = Vector2(480, 60)
	msg_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	pause_label = _label(Vector2(0, 120), Color.WHITE, 16)
	pause_label.size.x = 480
	pause_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	pause_label.text = "PAUSA"
	pause_label.visible = false
	help_label = _label(Vector2(0, 252), Color(1, 1, 1, 0.7))
	help_label.size.x = 480
	help_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	help_label.text = "X pular   Quadrado atacar   Bola especial   Triangulo trocar heroi   Options pausa"
	Game.hp_changed.connect(_on_hp)
	Game.special_changed.connect(func(v): special_label.text = "MAGIA  x%d" % v)
	Game.lives_changed.connect(func(v): lives_label.text = "VIDAS  %d" % v)
	Game.score_changed.connect(func(v): score_label.text = "%07d" % v)
	Game.message.connect(_on_message)
	Game.power_changed.connect(_on_power)
	Game.screen_flash.connect(_on_flash)
	lives_label.text = "VIDAS  %d" % Game.lives
	score_label.text = "%07d" % Game.score
	get_tree().create_timer(8.0).timeout.connect(func(): if is_instance_valid(help_label): help_label.visible = false)

func _label(pos: Vector2, color: Color, size := 8) -> Label:
	var l := Label.new()
	l.position = pos
	l.add_theme_color_override("font_color", color)
	l.add_theme_color_override("font_outline_color", Color("#0e0c14"))
	l.add_theme_constant_override("outline_size", 3)
	l.add_theme_font_size_override("font_size", size)
	add_child(l)
	return l

func _on_hp(v: int, max_v: int) -> void:
	hp_label.text = "VIDA  " + "♥".repeat(max(v, 0)) + "·".repeat(max(max_v - v, 0))

func _on_flash(color: Color, seconds: float) -> void:
	flash_rect.color = color
	var tw := flash_rect.create_tween()
	tw.tween_property(flash_rect, "color:a", 0.0, seconds)

func _on_power(id: String, charges: int) -> void:
	if id == "":
		power_label.text = ""
		return
	var info: Dictionary = Game.powers["list"][id]
	if not power_label.text.contains(info["name"].to_upper()):
		# new power: the label pops
		power_label.pivot_offset = Vector2(0, 6)
		power_label.scale = Vector2(1.6, 1.6)
		var tw := power_label.create_tween()
		tw.tween_property(power_label, "scale", Vector2.ONE, 0.25).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	power_label.text = "PODER  %s  x%d" % [info["name"].to_upper(), charges]
	power_label.add_theme_color_override("font_color", Color(info["color"]))

func _on_message(text: String, seconds: float) -> void:
	msg_label.text = text
	msg_time = seconds

func _process(delta: float) -> void:
	msg_time -= delta
	msg_label.visible = msg_time > 0
	if Input.is_action_just_pressed("pause"):
		get_tree().paused = not get_tree().paused
		Audio.play("pause")
		pause_label.visible = get_tree().paused
