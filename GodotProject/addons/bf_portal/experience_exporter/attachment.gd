@tool
extends RefCounted
class_name Attachment

var index: int = 0
var id: String = ""
var filename: String = ""
var version: String = "123" # Unused by SDK, placeholder, do not change.
var is_processable: bool = true # Unused by SDK, placeholder, do not change.
var processing_status = ProcessingStatus.UNSPECIFIED
var attachment_type = AttachmentType.UNSPECIFIED
var attachment_data: String = ""

var is_valid: bool = false:
	get: return is_valid

var metadata: String = "":
	get: return "mapIdx=%s" % index

func _init(p_full_path: String,
		p_index: int, 
		p_attachment_type: AttachmentType,
		p_base64: bool):

	if not FileAccess.file_exists(p_full_path):
		printerr("File %s doesn't exist!" % p_full_path)
		return
	else:
		var _file = FileAccess.open(p_full_path, FileAccess.READ)
		var _data = _file.get_as_text()
		if p_base64:
			if p_full_path.ends_with(".spatial.json"):
				_data = JSON.stringify(JSON.parse_string(_data))
			attachment_data = Marshalls.utf8_to_base64(_data)
		else:
			attachment_data = _data
		_file.close()

	index = p_index
	filename = p_full_path.get_file()
	processing_status = ProcessingStatus.PENDING
	attachment_type = p_attachment_type
	
	id = _generate_uuid()
	
	if id.length() > 0: 
		is_valid = true


func _generate_uuid() -> String:
	var _config = PortalPlugin.read_config()
	var _python = "%s/python.exe" % _config["python"]
	if not FileAccess.file_exists(_python):
		var _venv_path = _config["venv"]
		_python = "%s/Scripts/python.exe" % _venv_path
		if not FileAccess.file_exists(_python):
			printerr("Failed to generate UUID. Expected python to exist at %s" % _python)
			return ""

	var _out = []
	var _exit_code = OS.execute(_python, ["-c", "import uuid; print(uuid.uuid4())"], _out, false, false)
	if _exit_code == 0 and _out.size() > 0:
		return _out[0].strip_edges()
	else:
		printerr("Failed to generate UUID")
		is_valid = false
		return ""

func get_dict() -> Dictionary:
	
	var _dict: Dictionary = { 
		"id": id,
		"version": version,
		"filename": filename,
		"isProcessable": is_processable,
		"processingStatus": processing_status,
		"attachmentData": { 
			"original": attachment_data,
			"compiled": "", # required in payload, always empty here
		},
		"attachmentType": attachment_type,
		"errors": [] # required in payload, always empty here
	}
	
	if attachment_type == AttachmentType.SPATIAL:
		_dict["metadata"] = metadata

	return _dict

enum AttachmentType {
	UNSPECIFIED = 0,
	SPATIAL = 1,
	SCRIPT = 2,
	SCRIPTDATA = 3,
	STRINGS = 4,
	MP_DATA = 5,
	UNRECOGNIZED = -1
}

enum ProcessingStatus {
  UNSPECIFIED = 0,
  PENDING = 1,
  PROCESSED = 2,
  NEEDSRECOMPILE = 3,
  ERROR = 4,
  UNRECOGNIZED = -1
}
