@tool
class_name ExperienceExporterExport
extends Window

var _config: Dictionary = {}
var _mod_packages: Array[ModPackage] = []
var _mod_package_selected: ModPackage

const COMPILED_PACKAGE_NAME: String = "bundle"
const EXPERIENCE_KEYS: Array[String] = [ "workspace", "mapRotation", "attachments" ]

var portal_dock:
	get:
		return portal_dock
	set(value):
		portal_dock = value
		_process_mods()
		
@onready var itemlist_scripted_modes: ItemList = %ItemList_ScriptedModes
@onready var itemlist_levels: ItemList = %ItemList_Levels 
@onready var label_description: Label = %Label_Description
@onready var checkbutton_selectall: CheckButton = %CheckButton_SelectAll

var _window_success = preload("res://addons/bf_portal/experience_exporter/experience_exporter_success.tscn")
	
func _process_mods() -> void:
	if (not _readconfig()):
		printerr("Failed to read config")
		return

	_mod_packages = get_mod_packages(_config)
	portal_dock.set_exporter_label(_mod_packages.size())


static func get_mod_packages(config: Dictionary) -> Array[ModPackage]:
	if not config["mods"] or not DirAccess.dir_exists_absolute(config["mods"]):
		return []

	var mod_packages: Array[ModPackage] = []
	var mod_info = config["modInfoFile"]
	var mod_base_dir = config["mods"]
	
	var mod_dirs = DirAccess.get_directories_at(mod_base_dir)
	if mod_dirs.size() == 0: 
		printerr("no mods found in directory")
		return []
	else:		
		for mod in mod_dirs:
			var mod_info_full_path = "%s/%s/%s" % [mod_base_dir, mod, mod_info]
			if FileAccess.file_exists(mod_info_full_path):
				mod_packages.append(ModPackage.new(mod_info_full_path))

	mod_packages = mod_packages.filter(func(package): return package.is_valid_experience)
	return mod_packages


func _setup_ui() -> void: 
	itemlist_scripted_modes.clear()
	for i in range(_mod_packages.size()):
		itemlist_scripted_modes.add_item(_mod_packages[i].name,_mod_packages[i].icon)
		itemlist_scripted_modes.set_item_metadata(i, _mod_packages[i])

	
func _scriptedmode_select(selectedIndex: int, _clickPosition: Vector2, _buttonIndex: int) -> void:
	
	_clear_ui()
	_mod_package_selected = itemlist_scripted_modes.get_item_metadata(selectedIndex)
	
	if not _mod_package_selected.map_list:
		printerr("Missing map list from JSON manifest")
		return
	
	var map_list = _mod_package_selected.map_list

	for map in map_list:
		if not map.has("map_name"):
			printerr("Missing map name in JSON manifest")
			continue

		var _name = map["map_name"]

		if map.has("additional_description"):
			_name += " " + map["additional_description"]
			
		var idx = itemlist_levels.add_item(_name)
		itemlist_levels.set_item_metadata(idx, map)
		
	if _mod_package_selected.description:
		label_description.text = _mod_package_selected.description
			
func _clear_ui() -> void:
	itemlist_levels.clear()
	checkbutton_selectall.button_pressed = false

func _toggle_select_all(select_all: bool) -> void:
	if itemlist_levels.item_count > 0:
		if select_all:
			for i in range(itemlist_levels.item_count):
				itemlist_levels.select(i, false)
		else:
			itemlist_levels.deselect_all()

func _create_mode() -> void:
	if not _mod_package_selected:
		return
		
	var selected_level_indices = itemlist_levels.get_selected_items()
	var selected_levels: Array[Dictionary] = []
	
	for index in selected_level_indices:
		selected_levels.append(itemlist_levels.get_item_metadata(index))
	_export_experience(_mod_package_selected, selected_levels)
		
func _readconfig() -> bool:
	
	_config = PortalPlugin.read_config()
	
	if _config.size() == 0:
		return false
	else:
		return true

func _export_experience(_mod_package: ModPackage, _selected_levels: Array[Dictionary]) -> void:
	
	var mod_export_dir = _config["modExportDir"]

	if _enforce_export_dir(mod_export_dir):
	
		var _experience_name = _sanitize(_mod_package.name)
		var _experience_time = _sanitize(Time.get_datetime_string_from_system(false, false))
		var _target_full_path = "%s/%s-%s" % [mod_export_dir, _experience_name, _experience_time]
		var _target_file_name = "%s_%s.json" % [ _experience_name, COMPILED_PACKAGE_NAME ]
		
		var mod_export_info = ModExportInfo.new(_mod_package.root_path, _target_full_path, _target_file_name)
		
		var _skel_file = FileAccess.open(_mod_package.root_path.path_join(_mod_package.base_skel), FileAccess.READ)
		var _skel_data: Dictionary = JSON.parse_string(_skel_file.get_as_text())
		_skel_file.close()
		if not _skel_data:
			printerr("Error occured reading base skeleton file")
			return
		else: 
			_clear_json_skeleton(_skel_data)
		
		var _map_rotation: Dictionary = { "mapRotation": [] }
		var _workspace: Dictionary = { "workspace": "" }
		var _attachments: Dictionary = { "attachments": [] }

		if _mod_package.strings_file:
			var _str = Attachment.new(_mod_package.root_path.path_join(_mod_package.strings_file), 0, Attachment.AttachmentType.STRINGS, true)
			if _str.is_valid:
				_attachments["attachments"].append(_str.get_dict())
				mod_export_info.strings_file = _mod_package.strings_file
		
		if _mod_package.script_file:
			var _scr = Attachment.new(_mod_package.root_path.path_join(_mod_package.script_file), 0, Attachment.AttachmentType.SCRIPT, true)
			if _scr.is_valid:
				_attachments["attachments"].append(_scr.get_dict())
				mod_export_info.script_file = _mod_package.script_file
			
		if _mod_package.workspace_file:
			var _ws = FileAccess.open(_mod_package.root_path.path_join(_mod_package.workspace_file), FileAccess.READ)
			_workspace["workspace"] = JSON.parse_string(_ws.get_as_text())
			mod_export_info.workspace_file = _mod_package.workspace_file
			_ws.close()
		
		if _selected_levels.size() > 0:
			var _idx = 0
			for _level in _selected_levels:
				
				var _level_name = "%s.spatial.json" % _level["file_stem"]
				var _lv = Attachment.new(_mod_package.root_path.path_join(_level_name), _idx, Attachment.AttachmentType.SPATIAL, true)
				if _lv.is_valid:
					_attachments["attachments"].append(_lv.get_dict())
					
					var _map_entry: Dictionary = { "spatialAttachment": "", "id": "" }
					_map_entry["id"] = "%s-%s" % [ _level["map_name"], _mod_package.game_mode ]
					_map_entry["spatialAttachment"] = _lv.get_dict()
					_map_rotation["mapRotation"].append(_map_entry)
					_idx += 1
					
					var _export_map_name = _level["map_name"]
					if _level.has("additional_description"):
						_export_map_name += " " + _level["additional_description"]
					mod_export_info.map_list.append(_export_map_name)
				
		_skel_data["attachments"] = _attachments["attachments"]
		_skel_data["workspace"] = _workspace["workspace"]
		_skel_data["mapRotation"] = _map_rotation["mapRotation"]	
		
		DirAccess.make_dir_recursive_absolute(_config["modExportDir"].path_join(_target_full_path))
		print(_target_full_path.path_join(_target_file_name))
		var _output = FileAccess.open(_target_full_path.path_join(_target_file_name), FileAccess.WRITE)
		_output.store_string(JSON.stringify(_skel_data))
		_output.close()
		
		_export_success_window(mod_export_info)
 
func _clear_json_skeleton(skel: Dictionary) -> void: 
	for key in EXPERIENCE_KEYS:
		if skel.has(key):
			skel.erase(key)	

func _sanitize(_str: String ) -> String:
	var _regex = RegEx.new()
	_regex.compile("[^A-Za-z0-9_.-]")
	return _regex.sub(_str, "", true).to_lower()

func _enforce_export_dir(_dir: String) -> bool: 
	var _dir_access = DirAccess.open("res://")

	if not _dir:
		printerr("modExportDir not defined in config")
		return false
	else:
		if not _dir_access.dir_exists(_dir):
			_dir_access.make_dir(_dir)
			
	return true

func _export_success_window(mod_export_info: ModExportInfo) -> void:
	var window_success: Window = _window_success.instantiate()
	add_child(window_success)
	window_success.mod_export_info = mod_export_info
	window_success.popup()
	
func _exit() -> void:
	self.hide()
	self.queue_free()
