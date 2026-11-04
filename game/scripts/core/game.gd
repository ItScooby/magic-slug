extends Node
## Global state and data (autoload "Game").
## Data lives in res://data/*.json so balance changes never touch code.

signal score_changed(value: int)
signal lives_changed(value: int)
signal hp_changed(value: int, max_value: int)
signal special_changed(value: int)
signal message(text: String, seconds: float)

const LAYER_WORLD := 1
const LAYER_PLAYER := 2
const LAYER_ENEMY := 4
const LAYER_PLAYER_SHOT := 8
const LAYER_ENEMY_SHOT := 16
const LAYER_PICKUP := 32
const LAYER_PLATFORM := 64

var characters: Dictionary = {}
var spells: Dictionary = {}
var enemies: Dictionary = {}

var selected_character := "mage"
var score := 0
var lives := 3

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	characters = load_json("res://data/characters.json")
	spells = load_json("res://data/spells.json")
	enemies = load_json("res://data/enemies.json")
	Controls.setup()

static func load_json(path: String) -> Dictionary:
	var text := FileAccess.get_file_as_string(path)
	var data = JSON.parse_string(text)
	if typeof(data) != TYPE_DICTIONARY:
		push_error("Bad JSON: " + path)
		return {}
	data.erase("_doc")
	return data

func new_run() -> void:
	score = 0
	lives = 3
	score_changed.emit(score)
	lives_changed.emit(lives)

func add_score(points: int) -> void:
	score += points
	score_changed.emit(score)

func say(text: String, seconds := 2.0) -> void:
	message.emit(text, seconds)
