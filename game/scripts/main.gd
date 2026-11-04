extends Node
## Switches between the title screen and the level.

const FIRST_LEVEL := "demo"

var current: Node

func _ready() -> void:
	show_title()

func _swap(node: Node) -> void:
	get_tree().paused = false
	if current:
		current.queue_free()
	current = node
	add_child.call_deferred(node)

func show_title() -> void:
	var t := Title.new()
	t.start.connect(func(_c): start_level(FIRST_LEVEL))
	_swap(t)

func start_level(level_name: String) -> void:
	var l := Level.new()
	l.finished.connect(func(_won): show_title())
	l.level_name = level_name
	_swap(l)
