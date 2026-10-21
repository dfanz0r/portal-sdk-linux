## Editor plugin that adds a Spatial editor toolbar button for the current level.
## The button downloads a top-down map texture and applies it as a [Decal] under the
## level's "Static" node. It tracks the scene/decal/texture/download state to decide
## whether to show "Download Texture", "Apply Texture", or a locked label.
@tool
extends EditorPlugin

const TEXTURES_DIR := "res://addons/bf_portal/terrain_decal/textures/"
const BOUNDS_PATH := "res://addons/bf_portal/terrain_decal/bounds.json"

const TEXTURE_EXTENSION := ".jpg"

const STATIC_NODE_NAME := "Static"
const DECAL_NAME_SUFFIX := "_Decal"
const DECAL_NODE_PATH := "%s/%s%s" # static node name, level name, decal suffix

const BUTTON_TEXT_APPLY := "Apply Texture"
const BUTTON_TEXT_APPLIED := "Applied Texture"
const BUTTON_TEXT_DOWNLOAD := "Download Texture"
const BUTTON_TEXT_DOWNLOADING := "Downloading..."

const TOOLTIP_APPLY := "Applies a top-down image of the map as a decal  to the current level"
const TOOLTIP_UNAVAILABLE := "Texture Unavailable"
const TOOLTIP_DOWNLOAD := "Downloads the top-down map texture for the current level"
const TOOLTIP_NONE := ""

const CONFIG_DOWNLOAD_URL_KEY := "downloadUrl"
const CONFIG_FB_EXPORT_DATA_KEY := "fbExportData"
const LEVEL_INFO_FILE := "/level_info.json"
const MAP_TILES := "maptiles"
const DOWNLOAD_CHUNK_SIZE := 1 << 24 # 16 MiB, matches models download
const CONTENT_TYPE_PREFIX := "content-type:"
const CONTENT_TYPE_IMAGE := "image"

const UNDO_REDO_ACTION_TEXT := "Apply Map Texture"

const BOUNDS_DEFAULT_KEY := "_default"
const BOUNDS_SIZE_KEY := "size"
const BOUNDS_POSITION_KEY := "position"
const BOUNDS_DEFAULT_SIZE := [1024, 500, 1024]
const BOUNDS_DEFAULT_POSITION := [0, 0, 0]

const LOG_PREFIX := "Terrain Decal: "
const ERROR_NO_STATIC_NODE := "Cannot apply decal: '%s' has no '" + STATIC_NODE_NAME + "' node"
const ERROR_TEXTURE_LOAD_FAILED := "Cannot apply decal: failed to load texture for '%s'"
const ERROR_BOUNDS_UNREADABLE := LOG_PREFIX + "Unable to read %s"
const ERROR_BOUNDS_INVALID_JSON := LOG_PREFIX + "%s is not valid JSON"
const ERROR_LEVELS_UNREADABLE := LOG_PREFIX + "Unable to read %s"
const ERROR_LEVELS_INVALID_JSON := LOG_PREFIX + "%s is not valid JSON"
const ERROR_NO_DOWNLOAD_URL := LOG_PREFIX + "No download URL configured (missing '" + CONFIG_DOWNLOAD_URL_KEY + "')"
const ERROR_TEXTURE_NOT_FOUND := LOG_PREFIX + "%s.jpg is unavailable for download"
const ERROR_DOWNLOAD_FAILED := LOG_PREFIX + "Download failed (%s) for %s.jpg"
const TOAST_DOWNLOADING := LOG_PREFIX + "Downloading %s.jpg"
const TOAST_DOWNLOADED := LOG_PREFIX + "Downloaded %s.jpg"

# Mutually exclusive states the toolbar button can be in. Each state defines whether the
# button is visible, what it reads, and whether its action is locked (disabled) or unlocked.
enum ButtonState {
	HIDDEN,            # scene is not a level -> button hidden
	DOWNLOADING,       # a texture download is in progress -> locked
	APPLIED,           # decal already exists in the scene -> locked
	READY_TO_APPLY,    # texture available locally -> apply unlocked
	READY_TO_DOWNLOAD, # texture missing but downloadable -> download unlocked
	UNAVAILABLE,       # no texture and no download URL -> locked
}

var _button: Button
var _bounds: Dictionary = {}
var _levels: Dictionary = {}
var _current_scene: Node
var _downloading: bool = false
var _pending_import_level: String = ""
var _watched_decal: Node = null
var _state: ButtonState = ButtonState.HIDDEN


## Loads bounds data and adds the toolbar button to the Spatial editor.
func _enter_tree() -> void:
	_bounds = _load_bounds()
	_levels = _load_levels()

	_button = Button.new()
	_button.text = BUTTON_TEXT_APPLY
	_button.flat = true
	_button.pressed.connect(_on_button_pressed)
	add_control_to_container(CONTAINER_SPATIAL_EDITOR_MENU, _button)

	_refresh_button()


## Disconnects signals and removes/frees the toolbar button on plugin teardown.
func _exit_tree() -> void:
	var fs := EditorInterface.get_resource_filesystem()
	if fs.filesystem_changed.is_connected(_on_filesystem_changed):
		fs.filesystem_changed.disconnect(_on_filesystem_changed)

	_watch_decal(null)

	if _button:
		remove_control_from_container(CONTAINER_SPATIAL_EDITOR_MENU, _button)
		_button.queue_free()
		_button = null


## Polls for a change of edited scene and refreshes the button when it changes.
func _process(_delta: float) -> void:
	# can't rely on scene_changed signal, so poll the edited scene root for changes
	var new_scene := EditorInterface.get_edited_scene_root()
	if new_scene == _current_scene:
		return
	_current_scene = new_scene
	_refresh_button()


## Re-evaluates the current scene/decal and applies the resulting button state.
func _refresh_button() -> void:
	if _button == null:
		return

	var scene := _current_scene
	var decal: Node = _decal_node(scene, scene.name) if _is_level(scene) else null

	# Keep the decal watcher in sync so removing the decal updates the button live.
	_watch_decal(decal)

	_transition_to(_evaluate_state(scene, decal))


## Determine which state the button should be in based on the current scene/decal/texture.
func _evaluate_state(scene: Node, decal: Node) -> ButtonState:
	if not _is_level(scene):
		return ButtonState.HIDDEN
	if _downloading:
		return ButtonState.DOWNLOADING
	if decal != null:
		return ButtonState.APPLIED
	if _texture_exists(scene.name):
		return ButtonState.READY_TO_APPLY
	if _download_url(scene.name) != "":
		return ButtonState.READY_TO_DOWNLOAD
	return ButtonState.UNAVAILABLE


## Move the state machine into the given state and lock/unlock the button to match.
func _transition_to(new_state: ButtonState) -> void:
	_state = new_state
	if _button == null:
		return

	match new_state:
		ButtonState.HIDDEN:
			_button.visible = false
		ButtonState.DOWNLOADING:
			_set_button(BUTTON_TEXT_DOWNLOADING, true, TOOLTIP_NONE)
		ButtonState.APPLIED:
			_set_button(BUTTON_TEXT_APPLIED, true, TOOLTIP_NONE)
		ButtonState.READY_TO_APPLY:
			_set_button(BUTTON_TEXT_APPLY, false, TOOLTIP_APPLY)
		ButtonState.READY_TO_DOWNLOAD:
			_set_button(BUTTON_TEXT_DOWNLOAD, false, TOOLTIP_DOWNLOAD)
		ButtonState.UNAVAILABLE:
			_set_button(BUTTON_TEXT_APPLY, true, TOOLTIP_UNAVAILABLE)


## Apply the visible button presentation for an enabled/disabled (locked) state.
func _set_button(text: String, locked: bool, tooltip: String) -> void:
	_button.visible = true
	_button.text = text
	_button.disabled = locked
	_button.tooltip_text = tooltip


## Routes a button press to the download or apply action based on the current state.
func _on_button_pressed() -> void:
	# The action depends on the current state; locked states never emit "pressed".
	match _state:
		ButtonState.READY_TO_APPLY:
			_on_apply_pressed()
		ButtonState.READY_TO_DOWNLOAD:
			_on_download_pressed()


## Builds the map [Decal] from the local texture and bounds, adding it under the
## "Static" node and registering with the undo/redo system.
func _on_apply_pressed() -> void:
	var scene := _current_scene
	if not _is_level(scene):
		return

	var level_name: String = scene.name

	if _has_decal(scene, level_name):
		_refresh_button()
		return

	if not _texture_exists(level_name):
		return

	var static_node := scene.get_node_or_null(STATIC_NODE_NAME)
	if static_node == null:
		EditorInterface.get_editor_toaster().push_toast(
			ERROR_NO_STATIC_NODE % level_name,
			EditorToaster.SEVERITY_ERROR)
		return

	var texture: Texture2D = load(_texture_path(level_name))
	if texture == null:
		EditorInterface.get_editor_toaster().push_toast(
			ERROR_TEXTURE_LOAD_FAILED % level_name,
			EditorToaster.SEVERITY_ERROR)
		return

	var bounds := _bounds_for(level_name)

	var decal := Decal.new()
	decal.name = "%s%s" % [level_name, DECAL_NAME_SUFFIX]
	decal.texture_albedo = texture
	decal.size = bounds[BOUNDS_SIZE_KEY]
	decal.position = bounds[BOUNDS_POSITION_KEY]
	decal.upper_fade = 0.0 

	var undo_redo := get_undo_redo()
	undo_redo.create_action(UNDO_REDO_ACTION_TEXT)
	undo_redo.add_do_method(static_node, "add_child", decal)
	undo_redo.add_do_method(decal, "set_owner", scene)
	undo_redo.add_do_reference(decal)
	undo_redo.add_undo_method(static_node, "remove_child", decal)
	# refresh the button whenever this action is committed, undone, or redone
	undo_redo.add_do_method(self, "_refresh_button")
	undo_redo.add_undo_method(self, "_refresh_button")
	undo_redo.commit_action()


## Checks whether the scene's root node is a recognized level (named after a known level).
func _is_level(scene: Node) -> bool:
	if scene == null or scene is not Node3D:
		return false
	return scene.name in _levels


## Checks whether the level already has its decal node.
func _has_decal(scene: Node, level_name: String) -> bool:
	return _decal_node(scene, level_name) != null


## Gets the level's decal node, or null if it does not exist.
func _decal_node(scene: Node, level_name: String) -> Node:
	return scene.get_node_or_null(DECAL_NODE_PATH % [STATIC_NODE_NAME, level_name, DECAL_NAME_SUFFIX])


## Watches the given decal's removal so the button refreshes when it leaves the tree.
func _watch_decal(decal: Node) -> void:
	if _watched_decal == decal:
		return
	# Stop watching the previous decal if it is still a valid node
	if is_instance_valid(_watched_decal) and _watched_decal.tree_exited.is_connected(_on_decal_tree_exited):
		_watched_decal.tree_exited.disconnect(_on_decal_tree_exited)
	_watched_decal = decal
	# Guard the connect: the same decal instance can be re-added via redo and may still
	# carry a lingering connection, so only connect when not already connected.
	if _watched_decal != null and not _watched_decal.tree_exited.is_connected(_on_decal_tree_exited):
		_watched_decal.tree_exited.connect(_on_decal_tree_exited)


## Handles a watched decal leaving the tree (delete/cut/undo) and refreshes the button.
func _on_decal_tree_exited() -> void:
	# The decal was removed (deleted, cut, or undone) -> refresh once the tree settles.
	# Disconnect now (the node is still valid during this signal) so a redo that re-adds
	# the same instance can reconnect cleanly.
	if is_instance_valid(_watched_decal) and _watched_decal.tree_exited.is_connected(_on_decal_tree_exited):
		_watched_decal.tree_exited.disconnect(_on_decal_tree_exited)
	_watched_decal = null
	_refresh_button.call_deferred()


## Gets the local resource path of the level's texture.
func _texture_path(level_name: String) -> String:
	return "%s%s%s" % [TEXTURES_DIR, level_name, TEXTURE_EXTENSION]


## Checks whether the level's texture exists locally.
func _texture_exists(level_name: String) -> bool:
	return ResourceLoader.exists(_texture_path(level_name))


## Builds the remote download URL for the level's texture, or "" if none is configured.
func _download_url(level_name: String) -> String:
	# Build the per-map texture URL from the configured download root:
	# "<downloadUrl>maptiles/<level>.jpg".
	var config := PortalPlugin.read_config()
	var download_url: String = config.get(CONFIG_DOWNLOAD_URL_KEY, "")
	if download_url == "":
		return ""
	return "%s%s/%s%s" % [download_url, MAP_TILES, level_name, TEXTURE_EXTENSION]


## Downloads the level's texture: a HEAD request verifies it exists (image content type)
## before a GET writes it to disk, avoiding leaving a file behind on failed requests.
func _on_download_pressed() -> void:
	var scene := _current_scene
	if not _is_level(scene):
		return

	var level_name: String = scene.name

	if _texture_exists(level_name):
		_refresh_button()
		return

	var url := _download_url(level_name)
	if url == "":
		EditorInterface.get_editor_toaster().push_toast(
			ERROR_NO_DOWNLOAD_URL, EditorToaster.SEVERITY_ERROR)
		return

	var dest := _texture_path(level_name)

	_downloading = true
	_refresh_button()

	# Verify the texture exists (image content type) before writing the GET body to disk,
	# otherwise Godot would create a file even for a failed request.
	var check_header := func check_header(headers: PackedStringArray) -> bool:
		for header in headers:
			var lower := header.to_lower()
			if lower.begins_with(CONTENT_TYPE_PREFIX) and lower.contains(CONTENT_TYPE_IMAGE):
				return true
		return false

	var do_get := func do_get() -> void:
		var request := HTTPRequest.new()
		add_child(request)
		request.download_chunk_size = DOWNLOAD_CHUNK_SIZE
		request.download_file = dest
		request.request_completed.connect(
			_on_request_completed.bind(request, level_name, Callable(),
				func on_success() -> void: _on_download_success(level_name)))
		EditorInterface.get_editor_toaster().push_toast(TOAST_DOWNLOADING % level_name)
		var get_error := request.request(url, [], HTTPClient.METHOD_GET)
		if get_error != OK:
			_fail_download(level_name, ERROR_DOWNLOAD_FAILED % [get_error, level_name])

	var check_req := HTTPRequest.new()
	add_child(check_req)
	check_req.request_completed.connect(
		_on_request_completed.bind(check_req, level_name, check_header, do_get))
	var head_error := check_req.request(url, [], HTTPClient.METHOD_HEAD)
	if head_error != OK:
		check_req.queue_free()
		_fail_download(level_name, ERROR_DOWNLOAD_FAILED % [head_error, level_name])


## Shared HTTPRequest completion handler: frees the request, fails on error/non-200 or
## a failed header check, otherwise invokes the success callback.
func _on_request_completed(
	result: int,
	response_code: int,
	headers: PackedStringArray,
	_body: PackedByteArray,
	req: HTTPRequest,
	level_name: String,
	check_headers: Callable = Callable(),
	on_success: Callable = Callable()) -> void:

	req.queue_free()

	if result != HTTPRequest.RESULT_SUCCESS:
		_fail_download(level_name, ERROR_DOWNLOAD_FAILED % [result, level_name])
		return
	if response_code != 200:
		_fail_download(level_name, ERROR_TEXTURE_NOT_FOUND % level_name)
		return

	if check_headers.is_valid() and not check_headers.call(headers):
		_fail_download(level_name, ERROR_TEXTURE_NOT_FOUND % level_name)
		return

	if on_success.is_valid():
		on_success.call()


## Handles a finished download by rescanning the filesystem so Godot imports the new
## texture, then refreshes once the import completes.
func _on_download_success(level_name: String) -> void:
	_downloading = false
	EditorInterface.get_editor_toaster().push_toast(TOAST_DOWNLOADED % level_name)

	# Scan the filesystem so Godot imports the new .jpg, then refresh once it is ready.
	_pending_import_level = level_name
	var fs := EditorInterface.get_resource_filesystem()
	if not fs.filesystem_changed.is_connected(_on_filesystem_changed):
		fs.filesystem_changed.connect(_on_filesystem_changed)
	fs.scan()
	_refresh_button()


## Refreshes the button once a pending texture import has been picked up by the filesystem.
func _on_filesystem_changed() -> void:
	var fs := EditorInterface.get_resource_filesystem()
	if fs.filesystem_changed.is_connected(_on_filesystem_changed):
		fs.filesystem_changed.disconnect(_on_filesystem_changed)
	_pending_import_level = ""
	_refresh_button()


## Aborts a download: removes any partial file, reports the error, and refreshes the button.
func _fail_download(level_name: String, message: String) -> void:
	_downloading = false
	# Remove any partial/invalid file so the button falls back cleanly to "Download Texture".
	var dest := _texture_path(level_name)
	if FileAccess.file_exists(dest):
		DirAccess.remove_absolute(ProjectSettings.globalize_path(dest))
	EditorInterface.get_editor_toaster().push_toast(message, EditorToaster.SEVERITY_ERROR)
	_refresh_button()


## Returns the decal size/position for the level, falling back to the default entry.
func _bounds_for(level_name: String) -> Dictionary:
	var entry: Dictionary = _bounds.get(level_name, _bounds.get(BOUNDS_DEFAULT_KEY, {}))
	var size_arr: Array = entry.get(BOUNDS_SIZE_KEY, BOUNDS_DEFAULT_SIZE)
	var pos_arr: Array = entry.get(BOUNDS_POSITION_KEY, BOUNDS_DEFAULT_POSITION)
	return {
		BOUNDS_SIZE_KEY: Vector3(size_arr[0], size_arr[1], size_arr[2]),
		BOUNDS_POSITION_KEY: Vector3(pos_arr[0], pos_arr[1], pos_arr[2]),
	}


## Loads and parses the bounds JSON file, returning {} on read or parse failure.
func _load_bounds() -> Dictionary:
	var file := FileAccess.open(BOUNDS_PATH, FileAccess.READ)
	if file == null:
		printerr(ERROR_BOUNDS_UNREADABLE % BOUNDS_PATH)
		return {}
	var parsed: Variant = JSON.parse_string(file.get_as_text())
	if parsed is Dictionary:
		return parsed
	printerr(ERROR_BOUNDS_INVALID_JSON % BOUNDS_PATH)
	return {}


## Loads the recognized level names from the exported level_info.json, returning {} on
## a missing config, read, or parse failure (which keeps the button hidden). The result is
## a set (Dictionary keyed by level name).
func _load_levels() -> Dictionary:
	var config := PortalPlugin.read_config()
	var fb_export_data: String = config.get(CONFIG_FB_EXPORT_DATA_KEY, "")
	if fb_export_data == "":
		return {}
	var level_info_path := fb_export_data + LEVEL_INFO_FILE
	var file := FileAccess.open(level_info_path, FileAccess.READ)
	if file == null:
		printerr(ERROR_LEVELS_UNREADABLE % level_info_path)
		return {}
	var parsed: Variant = JSON.parse_string(file.get_as_text())
	if parsed is not Dictionary:
		printerr(ERROR_LEVELS_INVALID_JSON % level_info_path)
		return {}
	var levels: Dictionary = {}
	for level_name in parsed:
		levels[level_name] = true
	return levels
