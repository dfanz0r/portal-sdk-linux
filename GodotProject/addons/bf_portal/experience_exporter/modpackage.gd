@tool
extends RefCounted
class_name ModPackage

const FILE_STEM_EXTENSIONS: Array[String] = [ ".tscn", ".spatial.json"]
var name: String = ""
var game_mode: String = ""
var description: String = ""
var root_path: String = ""
var base_skel: String = "" 
var script_file: String = ""
var strings_file: String = ""
var workspace_file: String = ""
var map_list: Array[Dictionary] = []
var is_valid_experience: bool = true
var mod_config: Dictionary = {}
var icon_base_dir = "res://addons/bf_portal/experience_exporter/lib/icons/"
var default_icon = "breakthrough.svg"
var icon

#static var _config = PortalPlugin.read_config()

func _init(mod_info_path: String) -> void:
	mod_config = _get_config(mod_info_path)
	root_path = mod_info_path.get_base_dir()
	_set_info()

func _set_info() -> void:
	if not mod_config:
		is_valid_experience = false
		return
		
	if mod_config.has("name"):
		name = mod_config["name"]
	else:
		name = "Custom Experience"

	if mod_config.has("description"):
		description = mod_config["description"]
	else:
		description = ""

	if mod_config.has("workspace"):
		if FileAccess.file_exists(root_path.path_join(mod_config["workspace"])):
			workspace_file = mod_config["workspace"]
		else:
			printerr("Workspace file missing.")
			is_valid_experience = false
			return

	if mod_config.has("script"):
		if FileAccess.file_exists(root_path.path_join(mod_config["script"])):
			script_file = mod_config["script"]
		else: 
			printerr("Script declared but file is missing.")
			return
		
	if mod_config.has("strings"):
		if FileAccess.file_exists(root_path.path_join(mod_config["strings"])):
			strings_file = mod_config["strings"]	
		else: 
			printerr("Strings declared but file is missing.")
			return
			
	if mod_config.has("maps"):
		var maps = mod_config["maps"]
		if maps.size() > 0:
			map_list.append_array(mod_config["maps"])
			_check_file_stems(map_list)
		else:
			printerr("Map list missing.")
	else:
		printerr("Map list missing in manifest")
			
	if mod_config.has("icon"):
		var icon_file = mod_config["icon"]
		var icon_full_path = icon_base_dir.path_join(icon_file)
	
		if ResourceLoader.exists(icon_full_path):
			icon = load(icon_full_path)
		else:
			printerr("Icon file missing: %s, loading default" % icon_full_path)
			icon = load(icon_base_dir.path_join(default_icon))
	else:
		icon = load(icon_base_dir.path_join(default_icon))
			
	if mod_config.has("base_skel"):
		if _check_file_path(root_path.path_join(mod_config["base_skel"]), false):
			base_skel = mod_config["base_skel"]
	
	if mod_config.has("game_mode"):
		game_mode = mod_config["game_mode"]
			

func _check_file_path(full_path: String, is_optional: bool) -> bool: 
	if not FileAccess.file_exists(full_path):
		printerr("File missing: %s" % full_path)
		if not is_optional:
			printerr("Setting %s as invalid" % name)
			is_valid_experience = false
		return false
	else:
		return true 

func _check_file_stems(file_stems: Array[Dictionary]):
	
	for file in file_stems: 
		for ext in FILE_STEM_EXTENSIONS:
			var full_path = root_path.path_join("%s%s" % [ file["file_stem"], ext ])
			if ext == ".tscn":
				_check_file_path(full_path, true)
			else:
				_check_file_path(full_path, false)
	
func _get_config(_json_path) -> Dictionary:	
	
	if FileAccess.file_exists(_json_path):
		var _mod_json = JSON.parse_string(FileAccess.open(_json_path, FileAccess.READ).get_as_text())
		if not _mod_json:
			print("Unable to read json of %s, invalidating package" % _json_path)
			is_valid_experience = false
			return {}
		return _mod_json
	else:
		print("Unable to read json of %s" % _json_path)
		is_valid_experience = false
		return {}
