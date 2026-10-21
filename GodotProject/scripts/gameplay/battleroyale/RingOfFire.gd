@tool
class_name RingOfFire
extends Node3D

@export var ShrinkTimeOverride_00 = 0
@export var ShrinkTimeOverride_01 = 0
@export var ShrinkTimeOverride_02 = 0
@export var ShrinkTimeOverride_03 = 0
@export var ShrinkTimeOverride_04 = 0
@export var ShrinkTimeOverride_05 = 0
@export var ShrinkTimeOverride_06 = 0
@export var ShrinkTimeOverride_07 = 0
@export var ZoneSizeOverride_00 = 0
@export var ZoneSizeOverride_01 = 0
@export var ZoneSizeOverride_02 = 0
@export var ZoneSizeOverride_03 = 0
@export var ZoneSizeOverride_04 = 0
@export var ZoneSizeOverride_05 = 0
@export var ZoneSizeOverride_06 = 0
@export var RingOffsetY = 0
@export var ObjId = 0
@export var PortalStableTime = 30
@export var PortalDamageAmount = 1000
@export var MP = false
@export var ColorMulitply = [1, 1, 1]
@export var HardRestrictOBB : OBBVolume:
	set(value):
		HardRestrictOBB = value
		update_configuration_warnings()
@export var RestrictShapeData : PolygonVolume:
	set(value):
		RestrictShapeData = value
		update_configuration_warnings()
@export var id = ""

var global_name = self.get_script().get_global_name()

func _get_configuration_warnings() -> PackedStringArray:
	var scene_root = get_tree().edited_scene_root
	if get_node(".") == scene_root:
		return []
	var warnings = []
	if not LevelValidator.is_type_in_level(global_name, scene_root):
		var levels = LevelValidator.get_level_restrictions(global_name)
		var levels_str = "\n  - ".join(levels) if levels.size() > 0 else "Any"
		var msg = "%s is not usable in %s\nValid levels include:\n  - %s" % [global_name, scene_root.name, levels_str]
		warnings.append(msg)

	if HardRestrictOBB == null:
		warnings.append("HardRestrictOBB must be set!")
	if RestrictShapeData == null:
		warnings.append("RestrictShapeData must be set!")
	return warnings

func _validate_property(property: Dictionary):
	if property.name == "id":
		property.usage = PROPERTY_USAGE_NO_EDITOR
