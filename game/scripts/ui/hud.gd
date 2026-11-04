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
var msg_time := 0.0

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	layer = 10
	hp_label = _label(Vector2(8, 6), Color("#ff6a6a"))
	special_label = _label(Vector2(8, 18), Color("#8fd6ff"))
	lives_label = _label(Vector2(8, 30), Color("#f2c14e"))
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

func _on_message(text: String, seconds: float) -> void:
	msg_label.text = text
	msg_time = seconds

func _process(delta: float) -> void:
	msg_time -= delta
	msg_label.visible = msg_time > 0
	if Input.is_action_just_pressed("pause"):
		get_tree().paused = not get_tree().paused
		pause_label.visible = get_tree().paused
