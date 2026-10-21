@tool
class_name PortalPlugin
extends EditorPlugin

const PLUGIN_NAME = "bf_portal"


func _enable_plugin():
	EditorInterface.set_plugin_enabled(PLUGIN_NAME + "/portal_tools", true)
	EditorInterface.set_plugin_enabled(PLUGIN_NAME + "/memory_plugin", true)
	EditorInterface.set_plugin_enabled(PLUGIN_NAME + "/level_validator", true)
	EditorInterface.set_plugin_enabled(PLUGIN_NAME + "/experience_exporter", true)
	EditorInterface.set_plugin_enabled(PLUGIN_NAME + "/terrain_decal", true)

func _disable_plugin():
	EditorInterface.set_plugin_enabled(PLUGIN_NAME + "/portal_tools", false)
	EditorInterface.set_plugin_enabled(PLUGIN_NAME + "/memory_plugin", false)
	EditorInterface.set_plugin_enabled(PLUGIN_NAME + "/level_validator", false)
	EditorInterface.set_plugin_enabled(PLUGIN_NAME + "/experience_exporter", false)
	EditorInterface.set_plugin_enabled(PLUGIN_NAME + "/terrain_decal", false)

static func read_config() -> Dictionary:
	var config_path: String = "res://addons/bf_portal/bf_portal.config.json"
	var file = FileAccess.open(config_path, FileAccess.READ)
	var contents = file.get_as_text()
	var result = JSON.parse_string(contents)
	if not result:
		printerr("Unable to read json of %s" % config_path)
		return {}
	var config: Dictionary = result
	# Resolve against the project, not the editor process's working directory.
	for key in ["python", "venv", "gdconverter", "fbExportData", "export", "mods", "modExportDir"]:
		if config.has(key) and not str(config[key]).is_empty():
			var path: String = config[key]
			if not path.is_absolute_path():
				path = "res://".path_join(path)
			config[key] = ProjectSettings.globalize_path(path).simplify_path()
	return config


static func venv_python(config: Dictionary) -> String:
	return str(config["venv"]).path_join("Scripts/python.exe" if OS.get_name() == "Windows" else "bin/python3")
