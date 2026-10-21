extends SceneTree

class TestExporter extends ExperienceExporterExport:
	var result: ModExportInfo
	func _export_success_window(info: ModExportInfo) -> void:
		result = info

var failed := false

func check(condition: bool, message: String) -> void:
	if not condition:
		push_error(message)
		failed = true

func _initialize() -> void:
	call_deferred("run")

func run() -> void:
	var config = PortalPlugin.read_config()
	check(str(config["venv"]).is_absolute_path(), "Config paths must be absolute")
	check(FileAccess.file_exists(PortalPlugin.venv_python(config)), "Native Python missing")
	var output = []
	check(OS.execute("python3", ["--version"], output, true) == 0, "PATH lookup failed")
	var attachment = Attachment.new("res://mods/PortalGadgetExample/PortalGadgetExample.strings.json", 0, Attachment.AttachmentType.STRINGS, true)
	check(attachment.is_valid, "Attachment generation failed")
	var uuid_pattern = RegEx.create_from_string("^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$")
	check(uuid_pattern.search(attachment.id) != null, "Invalid UUIDv4")
	var ids = {}
	for i in range(100):
		var id = attachment._generate_uuid()
		check(not ids.has(id), "Duplicate UUID")
		ids[id] = true
	check(Marshalls.base64_to_utf8(attachment.get_dict()["attachmentData"]["original"]) == FileAccess.get_file_as_string("res://mods/PortalGadgetExample/PortalGadgetExample.strings.json"), "Attachment payload changed")
	var packages = ExperienceExporterExport.get_mod_packages(config)
	check(not packages.is_empty(), "No experience packages found")
	if not packages.is_empty():
		var exporter = TestExporter.new()
		exporter._config = config.duplicate()
		exporter._config["modExportDir"] = ProjectSettings.globalize_path("user://linux-smoke/bundles")
		DirAccess.make_dir_recursive_absolute(exporter._config["modExportDir"])
		var selected: Array[Dictionary] = [packages[0].map_list[0]]
		exporter._export_experience(packages[0], selected)
		check(exporter.result != null, "Experience bundle export failed")
		if exporter.result != null:
			var bundle = JSON.parse_string(FileAccess.get_file_as_string(exporter.result.path_destination.path_join(exporter.result.export_file_name)))
			check(bundle["mapRotation"].size() == 1, "Bundle map rotation missing")
			check(not bundle["attachments"].is_empty(), "Bundle attachments missing")
		exporter.free()
	check(not GenerateLibraryScript.generate_library().is_empty(), "Object library generation failed")
	# Save with the installed Godot version, then export the resulting scene.
	var scene: PackedScene = load("res://mods/WaterExample/MP_Portal_Ocean_WaterExample.tscn")
	check(scene != null, "Water example failed to load")
	if scene != null:
		var node = scene.instantiate()
		var packed = PackedScene.new()
		check(packed.pack(node) == OK, "Scene packing failed")
		var temp_scene = "res://linux_smoke_roundtrip.tscn"
		check(ResourceSaver.save(packed, temp_scene) == OK, "Godot 4.7 save failed")
		node.free()
		output.clear()
		var result = OS.execute(PortalPlugin.venv_python(config), [str(config["gdconverter"]).path_join("src/gdconverter/export_tscn.py"), ProjectSettings.globalize_path(temp_scene), config["fbExportData"], ProjectSettings.globalize_path("user://linux-smoke")], output, true)
		for line in output:
			print(line)
		check(result == 0, "Godot 4.7 scene export failed")
		DirAccess.remove_absolute(ProjectSettings.globalize_path(temp_scene))
	print("LINUX SMOKE: ", "FAIL" if failed else "PASS")
	quit(1 if failed else 0)
