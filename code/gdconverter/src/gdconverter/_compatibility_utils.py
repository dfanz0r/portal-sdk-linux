from typing import Any

from gdconverter import _constants as const
from gdconverter import _json_scene_types as jstype

OBJ_ID_CONVERT_TYPES = ["Bomb", "CapturePoint", "DeployCam", "RingOfFire", "MCOM", "Sector"]


def fix_asset_json_to_tscn(asset: jstype.Asset) -> None:
    _fix_obj_id_json_to_tscn(asset)


def _fix_obj_id_json_to_tscn(asset: jstype.Asset) -> None:
    if asset.id in OBJ_ID_CONVERT_TYPES:
        for prop in asset.props.values():
            if prop.id == "ObjId":
                setattr(prop, const.PROP_KEY_DEF, 0)
                return


def fix_asset_tscn_to_json(node: dict[str, Any]) -> None:
    _fix_obj_id_tscn_to_json(node)


def _fix_obj_id_tscn_to_json(node: dict[str, Any]) -> None:
    if "type" not in node:
        return
    if node["type"] in OBJ_ID_CONVERT_TYPES:
        if "ObjId" not in node:
            node["ObjId"] = 0
        elif node["ObjId"] == -1:
            del node["ObjId"]
