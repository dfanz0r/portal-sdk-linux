@tool
class_name PortalToolsPlugin
extends EditorPlugin

const PolygonVolumeGizmo = preload("types/PolygonVolume/PolygonVolumeGizmo.gd")
const OBBVolumeGizmo = preload("types/OBBVolume/OBBVolumeGizmo.gd")
const PortalToolsDock = preload("portal_tools_dock.gd")
var _dock: PortalToolsDock

var _polygon_volume_gizmo = PolygonVolumeGizmo.new()
var _obb_volume_gizmo = OBBVolumeGizmo.new()


func _enter_tree():
	# add tool dock to specified area in the editor
	_dock = preload("portal_tools_dock.tscn").instantiate()
	_dock.portal_tools_plugin = self
	add_control_to_dock(DOCK_SLOT_RIGHT_BL, _dock)
	_polygon_volume_gizmo.editor_plugin = self
	add_node_3d_gizmo_plugin(_polygon_volume_gizmo)
	_obb_volume_gizmo.editor_plugin = self
	add_node_3d_gizmo_plugin(_obb_volume_gizmo)

	# can't connect in gizmo's _init so do it here instead
	if not main_screen_changed.is_connected(_polygon_volume_gizmo._on_main_screen_changed):
		main_screen_changed.connect(_polygon_volume_gizmo._on_main_screen_changed)


func _process(delta: float) -> void:
	# can't rely on scene_changed signal
	# resort to using process to constantly check current scene
	var current_scene = EditorInterface.get_edited_scene_root()
	_dock.change_scene(current_scene)

	if _polygon_volume_gizmo != null:
		_polygon_volume_gizmo.handle_process(delta)


func _input(event: InputEvent) -> void:
	if _polygon_volume_gizmo != null:
		_polygon_volume_gizmo.handle_input(event)


func show_log_panel() -> void:
	var temp_control = Control.new()
	add_control_to_bottom_panel(temp_control, "temp")
	var log_panel = temp_control.get_parent().find_child("*EditorLog*", false, false)
	if log_panel:
		make_bottom_panel_item_visible(log_panel)
	remove_control_from_bottom_panel(temp_control)
	temp_control.queue_free()


func get_scene_library_instance() -> SceneLibrary:
	var output: SceneLibrary = null
	var search: Array[Node] = get_tree().root.find_children("Object Library", "EditorDock", true, false)
	if len(search) == 0:
		return output

	var library_dock = search[0]
	if library_dock and library_dock is EditorDock:
		var object_library = library_dock.get_child(0)
		if object_library and object_library is SceneLibrary:
			output = object_library
	return output


func _exit_tree():
	# remove dock and erase the control from memory
	remove_control_from_docks(_dock)
	if _dock:
		_dock.queue_free()
	remove_node_3d_gizmo_plugin(_polygon_volume_gizmo)
	remove_node_3d_gizmo_plugin(_obb_volume_gizmo)

	if main_screen_changed.is_connected(_polygon_volume_gizmo._on_main_screen_changed):
		main_screen_changed.disconnect(_polygon_volume_gizmo._on_main_screen_changed)
