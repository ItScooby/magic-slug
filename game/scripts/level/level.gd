class_name Level
extends Node2D
## Builds a level from res://data/levels/<name>.json and runs it: camera, spawns, lives, end of level.

signal finished(won: bool)

const VIEW := Vector2(480, 270)
const ENV := "res://assets/sprites/environment/"
const TILE := 16
## tile index in tiles.png per ground style: [top, fill]
const STYLES := {"stone": [0, 1], "temple": [4, 3]}

var data: Dictionary
var player: Player
var camera: Camera2D
var hud: Hud
var spawned := {}
var cam_x := 0.0
var ended := false
var tiles: Texture2D
var level_name := "demo"

func _ready() -> void:
	data = Game.load_json("res://data/levels/%s.json" % level_name)
	tiles = load(ENV + "tiles.png")
	Fx.world = self
	_build_background()
	for seg in data["ground"]:
		_ground(seg[0], seg[1], seg[2], seg[3] if seg.size() > 3 else "stone")
	for w in data.get("water", []):
		var water := Water.new()
		water.setup(w[0], w[1], w[2])
		add_child(water)
	for p in data.get("platforms", []):
		_platform(p[0], p[1], p[2])
	for prop in data.get("props", []):
		_prop(prop)
	for item in data.get("pickups", []):
		_pickup(item)
	_gate(data.get("end_x", 3000))

	camera = Camera2D.new()
	camera.anchor_mode = Camera2D.ANCHOR_MODE_FIXED_TOP_LEFT
	camera.limit_left = 0
	camera.limit_right = int(data.get("length", 3000))
	add_child(camera)
	camera.make_current()
	Fx.camera = camera

	player = Player.new()
	player.position = Vector2(60, 200)
	add_child(player)
	player.setup(Game.selected_character)
	player.died.connect(_on_player_died)

	hud = Hud.new()
	add_child(hud)
	Game.new_run()
	player._emit_stats()
	Game.lives_changed.emit(Game.lives)
	Game.say(data.get("name", "Missao"), 2.5)
	Audio.music(data.get("music", "level"))

func _process(_delta: float) -> void:
	if player == null:
		return
	# Metal Slug camera: follows forward, never back
	var want := player.global_position.x - VIEW.x * 0.4
	cam_x = clamp(max(cam_x, want), 0.0, data.get("length", 3000) - VIEW.x)
	camera.position = Vector2(round(cam_x), 0)
	player.min_x = cam_x
	_check_spawns()
	if not ended and player.global_position.x > data.get("end_x", 3000):
		_win()
	if Input.is_action_just_pressed("swap") and player.state == "play":
		var ids := Game.characters.keys()
		var next: String = ids[(ids.find(player.char_id) + 1) % ids.size()]
		Game.selected_character = next
		player.setup(next, true)
		Audio.play("swap")
		Fx.play("poof", player.global_position)

func _check_spawns() -> void:
	var right_edge := cam_x + VIEW.x
	var spawns: Array = data.get("spawns", [])
	for i in spawns.size():
		var s: Dictionary = spawns[i]
		if spawned.has(i) or right_edge < s["at"]:
			continue
		spawned[i] = true
		var e := Enemy.new()
		e.setup(s["enemy"])
		var x: float = s["x"]
		e.position = Vector2(x, s.get("y", _ground_y(x) - 1))
		add_child(e)

## The nearest x at or after `x` that has floor under it (respawns never drop into a pit).
func _safe_x(x: float) -> float:
	for seg in data["ground"]:
		if x < seg[1] - 80:
			return max(x, seg[0] + 24)
	return x

func _ground_y(x: float) -> float:
	for seg in data["ground"]:
		if x >= seg[0] and x < seg[1]:
			return seg[2]
	return 230.0

# ---------- building
func _build_background() -> void:
	for layer in [["bg_far.png", 0.15], ["bg_mid.png", 0.45]]:
		var p := Parallax2D.new()
		p.scroll_scale = Vector2(layer[1], 0)
		p.repeat_size = VIEW
		p.repeat_times = 3
		p.z_index = -20
		var s := Sprite2D.new()
		s.texture = load(ENV + layer[0])
		s.centered = false
		p.add_child(s)
		add_child(p)

func _ground(x0: float, x1: float, top: float, style: String) -> void:
	var body := StaticBody2D.new()
	body.collision_layer = Game.LAYER_WORLD
	var shape := CollisionShape2D.new()
	var rect := RectangleShape2D.new()
	rect.size = Vector2(x1 - x0, 400)
	shape.shape = rect
	shape.position = Vector2((x0 + x1) / 2.0, top + 200)
	body.add_child(shape)
	add_child(body)
	var art := TileStrip.new()
	art.setup(tiles, Rect2(x0, top, x1 - x0, VIEW.y - top + 40), STYLES.get(style, [0, 1]))
	add_child(art)

func _platform(x: float, y: float, w: float) -> void:
	var body := StaticBody2D.new()
	body.collision_layer = Game.LAYER_PLATFORM
	var shape := CollisionShape2D.new()
	var rect := RectangleShape2D.new()
	rect.size = Vector2(w, 6)
	shape.shape = rect
	shape.position = Vector2(x + w / 2.0, y + 3)
	shape.one_way_collision = true
	body.add_child(shape)
	add_child(body)
	var art := TileStrip.new()
	art.setup(tiles, Rect2(x, y, w, TILE), [2, -1])
	add_child(art)

func _prop(p: Dictionary) -> void:
	var x: float = p["x"]
	var floor_y := _ground_y(x)
	match p["type"]:
		"torch":
			Fx.play("torch", Vector2(x, p.get("y", 150)), {"loop": true, "z": -5})
		"brazier":
			Fx.play("brazier", Vector2(x, floor_y), {"loop": true, "z": -5})
		_:
			var tex: Texture2D = load(ENV + p["type"] + ".png")
			var s := Sprite2D.new()
			s.texture = tex
			s.centered = false
			s.z_index = -5
			var y: float = p.get("y", floor_y - tex.get_height())
			s.position = Vector2(x - tex.get_width() / 2.0, y)
			add_child(s)

func _pickup(item: Dictionary) -> void:
	var pk := Pickup.new()
	pk.kind = item["type"]
	pk.position = Vector2(item["x"], item["y"])
	add_child(pk)

func _gate(x: float) -> void:
	var tex: Texture2D = load(ENV + "gate.png")
	var s := Sprite2D.new()
	s.texture = tex
	s.centered = false
	s.z_index = -4
	s.position = Vector2(x - tex.get_width() / 2.0, _ground_y(x) - tex.get_height())
	add_child(s)

# ---------- lives and the end
func _on_player_died() -> void:
	Game.lives -= 1
	Game.lives_changed.emit(Game.lives)
	if Game.lives > 0:
		player.respawn(Vector2(_safe_x(cam_x + 60), 120))
		Fx.play("poof", player.global_position)
	else:
		Game.say("GAME OVER", 4.0)
		Audio.stop_music()
		Audio.play("game_over")
		ended = true
		await get_tree().create_timer(4.0).timeout
		finished.emit(false)

func _win() -> void:
	ended = true
	player.controls_enabled = false
	Game.say("MISSAO COMPLETA!\nFim da demo", 4.0)
	Audio.stop_music()
	Audio.play("win")
	Fx.play("explosion", Vector2(data.get("end_x", 3000) + 40, _ground_y(data.get("end_x", 3000))))
	await get_tree().create_timer(4.5).timeout
	finished.emit(true)

func _exit_tree() -> void:
	if Fx.world == self:
		Fx.world = null
		Fx.camera = null


## Draws a rectangle of tiles: a top row, then fill. fill = -1 draws the top row only.
class TileStrip extends Node2D:
	var tex: Texture2D
	var area: Rect2
	var top_tile := 0
	var fill_tile := 1

	func setup(t: Texture2D, a: Rect2, style: Array) -> void:
		tex = t
		area = a
		top_tile = style[0]
		fill_tile = style[1]
		z_index = -2

	func _draw() -> void:
		var cols := int(ceil(area.size.x / 16.0))
		var rows := int(ceil(area.size.y / 16.0)) if fill_tile >= 0 else 1
		for r in rows:
			var idx := top_tile if r == 0 else fill_tile
			for c in cols:
				var w: float = min(16.0, area.size.x - c * 16)
				draw_texture_rect_region(tex, Rect2(area.position + Vector2(c * 16, r * 16), Vector2(w, 16)), Rect2(idx * 16, 0, w, 16))
