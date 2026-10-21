@tool
extends RefCounted
class_name ModExportInfo

var path_source: String = ""
var path_destination: String = ""
var export_file_name: String = "" 

var script_file: String = "" 
var strings_file: String = "" 
var workspace_file: String = "" 
var map_list: Array[String] = []

func _init(p_path_source: String, p_path_destination: String, p_export_file_name: String) -> void:
	path_source = p_path_source
	path_destination = p_path_destination
	export_file_name = p_export_file_name
