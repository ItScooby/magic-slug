class_name Title
extends Node2D
## Title + character select. Left/right to choose, Cross/Square/Options to start.

signal start(character: String)

var ids: Array = []
var index := 0
var sprites: Array = []
var name_label: Label
var desc_label: Label
var cooldown := 0.3

func _ready() -> void:
	ids = Game.characters.keys()
	index = max(0, ids.find(Game.selected_character))
	var bg := Sprite2D.new()
	bg.texture = load("res://assets/sprites/environment/bg_far.png")
	bg.centered = false
	bg.z_index = -10
	add_child(bg)
	var floor_tex: Texture2D = load("res://assets/sprites/environment/tiles.png")
	var strip := Level.TileStrip.new()
	strip.setup(floor_tex, Rect2(0, 200, 480, 80), [0, 1])
	add_child(strip)
	Fx.world = self
	Fx.play("brazier", Vector2(70, 200), {"loop": true})
	Fx.play("brazier", Vector2(410, 200), {"loop": true})
	_label("MAGIC SLUG", Vector2(0, 30), 32, Color("#f2c14e"))
	_label("Escolha seu heroi", Vector2(0, 80), 8, Color.WHITE)
	name_label = _label("", Vector2(0, 208), 16, Color("#ffe9a0"))
	desc_label = _label("", Vector2(0, 232), 8, Color(1, 1, 1, 0.85))
	_label("< >  escolher      X / Quadrado  comecar", Vector2(0, 252), 8, Color(1, 1, 1, 0.6))
	for i in ids.size():
		var info: Dictionary = Sheets.character(Game.characters[ids[i]]["sheet"])
		var s: AnimatedSprite2D = Sheets.make_sprite(info, "idle")
		s.position = Vector2(240 + (i - (ids.size() - 1) / 2.0) * 90, 200)
		s.play("idle")
		add_child(s)
		sprites.append(s)
	_refresh()

func _label(text: String, pos: Vector2, size: int, color: Color) -> Label:
	var l := Label.new()
	l.text = text
	l.position = pos
	l.size.x = 480
	l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", color)
	l.add_theme_color_override("font_outline_color", Color("#0e0c14"))
	l.add_theme_constant_override("outline_size", 4)
	add_child(l)
	return l

func _refresh() -> void:
	for i in sprites.size():
		var s: AnimatedSprite2D = sprites[i]
		s.modulate = Color.WHITE if i == index else Color(0.45, 0.45, 0.55)
		s.play("shoot" if i == index else "idle")
		if i == index:
			s.animation_finished.connect(func(): s.play("idle"), CONNECT_ONE_SHOT)
	var c: Dictionary = Game.characters[ids[index]]
	name_label.text = c["name"]
	desc_label.text = c.get("desc", "")

func _process(delta: float) -> void:
	cooldown -= delta
	if cooldown > 0:
		return
	if Input.is_action_just_pressed("left"):
		index = (index - 1 + ids.size()) % ids.size()
		_refresh()
	elif Input.is_action_just_pressed("right"):
		index = (index + 1) % ids.size()
		_refresh()
	elif Input.is_action_just_pressed("jump") or Input.is_action_just_pressed("attack") or Input.is_action_just_pressed("pause"):
		Game.selected_character = ids[index]
		start.emit(ids[index])

func _exit_tree() -> void:
	if Fx.world == self:
		Fx.world = null
