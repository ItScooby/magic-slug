extends Node
## Automated smoke test: plays the demo with simulated input and reports problems.
## Run: godot --headless --path game res://tests/smoke.tscn

var main: Node
var t := 0.0
var step := 0
var last_shot := -1
var log_lines: Array[String] = []

func _ready() -> void:
	main = load("res://scenes/main.tscn").instantiate()
	add_child(main)

func shot(name: String) -> void:
	var dir := OS.get_environment("SHOTS")
	if dir == "" or DisplayServer.get_name() == "headless":
		return
	get_viewport().get_texture().get_image().save_png(dir + "/" + name + ".png")

func press(a: String, on := true) -> void:
	if on: Input.action_press(a)
	else: Input.action_release(a)

func _process(delta: float) -> void:
	t += delta
	var lvl = main.current
	match step:
		0:
			if t > 0.4 and t - delta <= 0.4:
				shot("00_title")
			if t > 1.0:
				main.start_level("demo"); step = 1; t = 0
		1:
			if t > 0.5 and lvl is Level:
				print("level loaded, player=", lvl.player.char_id, " pos=", lvl.player.global_position)
				press("right"); press("attack"); step = 2; t = 0
		2:
			if t > 3.0:
				print("after 3s: pos=", lvl.player.global_position.round(), " on_floor=", lvl.player.is_on_floor(), " enemies=", get_tree().get_nodes_in_group("enemies").size(), " score=", Game.score, " hp=", lvl.player.hp)
				shot("01_run"); press("special"); step = 3; t = 0
		3:
			if t > 0.1:
				press("special", false); press("jump"); step = 4; t = 0
				get_tree().create_timer(0.5).timeout.connect(func(): shot("02_meteor"))
		4:
			if t > 0.4:
				press("jump", false); press("swap"); step = 5; t = 0
		5:
			if t > 0.1:
				press("swap", false); print("swapped to ", lvl.player.char_id); step = 6; t = 0
		6:
			if t > 2.0:
				press("special"); step = 7; t = 0
		7:
			if t > 0.1:
				press("special", false); press("up"); step = 8; t = 0
				get_tree().create_timer(0.45).timeout.connect(func(): shot("03_rain"))
		8:
			if t > 1.0:
				press("up", false); step = 9; t = 0
		9:
			if lvl is Level:
				# keep running and shooting; jump now and then
				if int(t * 10) % 40 == 0 and int(t * 10) != last_shot:
					last_shot = int(t * 10); shot("run_%02d" % int(t))
				lvl.player.invuln = 0.5   # the bot can't dodge; make it survive to test the whole level
				var x: float = lvl.player.global_position.x
				var near_edge := (x > 870 and x < 960) or (x > 1460 and x < 1560) or (x > 1960 and x < 2040)
				if near_edge:
					press("jump", lvl.player.is_on_floor() and not Input.is_action_pressed("jump") or lvl.player.velocity.y < 0)
				elif int(t * 2) % 5 == 0: press("jump")
				else: press("jump", false)
				if t > 60.0 or lvl.ended:
					print("end: t=", snapped(t, 0.1), " pos=", lvl.player.global_position.round(), " score=", Game.score, " lives=", Game.lives, " ended=", lvl.ended, " state=", lvl.player.state)
					get_tree().quit()
			else:
				print("back on title; lives=", Game.lives)
				get_tree().quit()
