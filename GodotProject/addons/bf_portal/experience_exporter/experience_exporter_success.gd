@tool
extends Window

@onready var export_workspace_label: Label = %Label_WorkspaceFileUri
@onready var export_script_label: Label = %Label_ScriptFileUri
@onready var export_strings_label: Label = %Label_StringsFileUri
@onready var modify_button: Button = %Button_ModifyExported
@onready var export_level_itemlist: ItemList = %ItemList_LevelFileUris

var _config = PortalPlugin.read_config()
var mod_export_info: ModExportInfo	

func about_to_popup() -> void:

	if mod_export_info.map_list.size() == 0:
		modify_button.disabled = true	
		
	_set_label(export_workspace_label, mod_export_info.workspace_file)
	_set_label(export_script_label, mod_export_info.script_file)
	_set_label(export_strings_label, mod_export_info.strings_file)
		
	if mod_export_info.map_list.size() > 0:
		for i in range(mod_export_info.map_list.size()):
			export_level_itemlist.add_item(mod_export_info.map_list[i])
			export_level_itemlist.set_item_disabled(i, true)
	
func _set_label(label: Label, text: String) -> void:
		label.text = text
		
func _open_builder_tool() -> void:
	var portal_url = _config["portalUrl"]
	if portal_url:
		OS.shell_open(portal_url)

func _view_files() -> void:
	var _destination_folder = mod_export_info.path_destination
	if DirAccess.dir_exists_absolute(_destination_folder):
		OS.shell_show_in_file_manager(mod_export_info.path_destination)
	
func _select_files() -> void: 
	var editor_file_dialog = EditorFileDialog.new()
	editor_file_dialog.current_dir = mod_export_info.path_source
	editor_file_dialog.add_filter("*.tscn", "Godot Text Scene")
	editor_file_dialog.file_mode = EditorFileDialog.FILE_MODE_OPEN_FILE
	editor_file_dialog.popup_exclusive_on_parent(self, self.get_visible_rect())
	editor_file_dialog.file_selected.connect(_open_files)

# just allow opening one file at a time, bulk opening is going to freeze most peoples machines
func _open_files(level: String) -> void:
	if FileAccess.file_exists(level):
		EditorInterface.open_scene_from_path(level)
		
func _exit() -> void: 
	self.hide()
	self.queue_free()
