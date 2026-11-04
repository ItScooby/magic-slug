class_name Controls
## Input actions for keyboard and the PS5 DualSense (Godot reads it through SDL, wired or Bluetooth).
## DualSense names -> Godot buttons: Cross=A, Circle=B, Square=X, Triangle=Y, Options=START, Create=BACK.
## To remap, edit MAP below.

const DEADZONE := 0.35

const MAP := {
	"left":    {"keys": [KEY_LEFT, KEY_A],  "buttons": [JOY_BUTTON_DPAD_LEFT],  "axis": [JOY_AXIS_LEFT_X, -1.0]},
	"right":   {"keys": [KEY_RIGHT, KEY_D], "buttons": [JOY_BUTTON_DPAD_RIGHT], "axis": [JOY_AXIS_LEFT_X, 1.0]},
	"up":      {"keys": [KEY_UP, KEY_W],    "buttons": [JOY_BUTTON_DPAD_UP],    "axis": [JOY_AXIS_LEFT_Y, -1.0]},
	"down":    {"keys": [KEY_DOWN, KEY_S],  "buttons": [JOY_BUTTON_DPAD_DOWN],  "axis": [JOY_AXIS_LEFT_Y, 1.0]},
	"jump":    {"keys": [KEY_SPACE, KEY_K], "buttons": [JOY_BUTTON_A]},          # Cross
	"attack":  {"keys": [KEY_J, KEY_Z],     "buttons": [JOY_BUTTON_X]},          # Square
	"special": {"keys": [KEY_L, KEY_X],     "buttons": [JOY_BUTTON_B]},          # Circle
	"swap":    {"keys": [KEY_TAB, KEY_C],   "buttons": [JOY_BUTTON_Y]},          # Triangle
	"pause":   {"keys": [KEY_ESCAPE, KEY_P, KEY_ENTER], "buttons": [JOY_BUTTON_START]},  # Options
}

static func setup() -> void:
	for action in MAP:
		if InputMap.has_action(action):
			InputMap.erase_action(action)
		InputMap.add_action(action, DEADZONE)
		var m: Dictionary = MAP[action]
		for k in m.get("keys", []):
			var e := InputEventKey.new()
			e.physical_keycode = k
			InputMap.action_add_event(action, e)
		for b in m.get("buttons", []):
			var jb := InputEventJoypadButton.new()
			jb.button_index = b
			jb.device = -1
			InputMap.action_add_event(action, jb)
		if m.has("axis"):
			var ja := InputEventJoypadMotion.new()
			ja.axis = m["axis"][0]
			ja.axis_value = m["axis"][1]
			ja.device = -1
			InputMap.action_add_event(action, ja)
