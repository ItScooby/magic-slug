extends Node
## Builds SpriteFrames from sprite sheets (autoload "Sheets"), cached.
##  - character sheets: res://assets/sprites/characters/<name>.png + .json (tools/art/characters.mjs)
##  - effect sheets:    res://assets/fx/<name>.png + .json (pixelfx, via tools/art/export_fx.mjs)

var _chars := {}
var _fx := {}

## Returns {frames: SpriteFrames, pivot: Vector2, muzzles: Dictionary}
func character(name: String) -> Dictionary:
	if _chars.has(name):
		return _chars[name]
	var base := "res://assets/sprites/characters/" + name
	var tex: Texture2D = load(base + ".png")
	var meta: Dictionary = JSON.parse_string(FileAccess.get_file_as_string(base + ".json"))
	var cell := Vector2(meta["cell"][0], meta["cell"][1])
	var frames := SpriteFrames.new()
	frames.remove_animation("default")
	for anim in meta["animations"]:
		var a: Dictionary = meta["animations"][anim]
		frames.add_animation(anim)
		frames.set_animation_speed(anim, a["fps"])
		frames.set_animation_loop(anim, a["loop"])
		for i in int(a["frames"]):
			var at := AtlasTexture.new()
			at.atlas = tex
			at.region = Rect2(Vector2(i * cell.x, a["row"] * cell.y), cell)
			frames.add_frame(anim, at)
	var muzzles := {}
	for k in meta.get("muzzles", {}):
		muzzles[k] = Vector2(meta["muzzles"][k][0], meta["muzzles"][k][1])
	var out := {"frames": frames, "pivot": Vector2(meta["pivot"][0], meta["pivot"][1]), "muzzles": muzzles}
	_chars[name] = out
	return out

## Returns {frames: SpriteFrames (animation "fx"), pivot: Vector2, loop: bool, size: Vector2}
func fx(name: String) -> Dictionary:
	if _fx.has(name):
		return _fx[name]
	var base := "res://assets/fx/" + name
	var tex: Texture2D = load(base + ".png")
	var data: Dictionary = JSON.parse_string(FileAccess.get_file_as_string(base + ".json"))
	var p: Dictionary = data["meta"]["pixelfx"]
	var frames := SpriteFrames.new()
	frames.remove_animation("default")
	frames.add_animation("fx")
	frames.set_animation_speed("fx", p["fps"])
	frames.set_animation_loop("fx", p["loop"])
	for f in data["frames"]:
		var r: Dictionary = f["frame"]
		var at := AtlasTexture.new()
		at.atlas = tex
		at.region = Rect2(r["x"], r["y"], r["w"], r["h"])
		frames.add_frame("fx", at)
	var out := {"frames": frames, "pivot": Vector2(p["pivot"][0], p["pivot"][1]), "loop": p["loop"], "size": Vector2(p["frameSize"][0], p["frameSize"][1])}
	_fx[name] = out
	return out

## An AnimatedSprite2D whose origin is the sheet's pivot (feet for characters, effect origin for fx).
func make_sprite(info: Dictionary, anim := "fx") -> AnimatedSprite2D:
	var s := AnimatedSprite2D.new()
	s.sprite_frames = info["frames"]
	s.centered = false
	s.offset = -info["pivot"]
	s.animation = anim
	return s
