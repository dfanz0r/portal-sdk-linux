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
	# RFC 9562 UUIDv4: no external Python process required on any platform.
	var bytes = Crypto.new().generate_random_bytes(16)
	if bytes.size() != 16:
		printerr("Failed to generate UUID")
		return ""
	bytes[6] = (bytes[6] & 0x0f) | 0x40
	bytes[8] = (bytes[8] & 0x3f) | 0x80
	var hex = bytes.hex_encode()
	return "%s-%s-%s-%s-%s" % [hex.substr(0, 8), hex.substr(8, 4), hex.substr(12, 4), hex.substr(16, 4), hex.substr(20, 12)]

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
