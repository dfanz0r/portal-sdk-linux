import argparse
import json
import os
import sys
from pathlib import Path
from typing import Any

from gdconverter import _json_scene_types as jstype
from gdconverter import _logging, _meta, _utils
from gdconverter import _tscn_to_json as t2j


def export_tscn_json(tscn_file: Path, fb_export_data_dir: str) -> dict[str, Any] | None:
    """Given a tscn, convert it to spatial json.

    Returns the spatial json, or None if there was an error during export"""

    if not tscn_file.exists():
        _logging.log_error(f"Scene does not exist: {tscn_file}")
        return None
    if not os.path.exists(fb_export_data_dir):
        _logging.log_error(f"FbExportData directory does not exist: {fb_export_data_dir}")
        return None

    if not tscn_file.is_file() or tscn_file.suffix != ".tscn":
        _logging.log_error(f"The given path is not a file ending an .tscn: {tscn_file}")
        return None

    config = _meta.get_configs(Path(fb_export_data_dir), Path())

    assets: jstype.Assets = {}

    _utils.process_asset_types(config, assets)

    result, level_json = t2j.process_scene_file(tscn_file, assets)
    if not result:
        _logging.log_error(f"Unable to process scene file {tscn_file}")
        return None
    return level_json


def export_tscn(tscn_file: Path, fb_export_data_dir: str, output_dir: str) -> Path | None:
    """Given a tscn, convert it to spatial json.

    Returns the path to the written json, or None if there was an error during export"""

    level_json = export_tscn_json(tscn_file, fb_export_data_dir)
    if level_json is None:
        _logging.log_error("Cannot write to scene file")
        return None

    os.makedirs(output_dir, exist_ok=True)

    dst_file = (Path(output_dir) / tscn_file.name).with_suffix(".spatial.json")
    if dst_file is not None:
        with open(dst_file, "w", encoding="utf-8") as json_data:
            json.dump(level_json, json_data, indent=4, cls=t2j.CustomEncoder)
    return dst_file


def _main() -> None:
    parser = argparse.ArgumentParser(description="Given a tscn, convert it to intermediate json")
    parser.add_argument("SCENE_FILE", type=str, help="Scene (.tscn) file to export")
    parser.add_argument("FB_EXPORT_DATA", type=str, help="Path to FbExportData directory")
    parser.add_argument("OUTPUT_DIR", type=str, help="Path where exported level will be created")
    args = parser.parse_args()

    scene_file: str = args.SCENE_FILE
    fb_export_data_dir: str = args.FB_EXPORT_DATA
    output_dir: str = args.OUTPUT_DIR
    result = export_tscn(Path(scene_file), fb_export_data_dir, output_dir)
    if not result:
        sys.exit(1)
    print(result)


if __name__ in "__main__":
    _main()
