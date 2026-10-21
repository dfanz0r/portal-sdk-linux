import os
from pathlib import Path

from gdconverter.export_tscn import export_tscn_json

from tests.utils import TEST_FB_DATA, TEST_FB_LEVELS, TEST_GD_LEVELS

ROOT = Path(os.path.dirname(os.path.abspath(__file__)))


def test_export_empty() -> None:
    assert export_tscn_json(Path(""), "") is None


def test_export_dir() -> None:
    assert export_tscn_json(ROOT, TEST_FB_DATA) is None


def test_export_non_tscn() -> None:
    fb_export_data = TEST_FB_DATA
    non_tscn = TEST_FB_LEVELS / "simple.spatial.json"
    assert export_tscn_json(non_tscn, fb_export_data) is None


def test_export_simple(tmp_path: Path) -> None:
    simple_scene = TEST_GD_LEVELS / "simple.tscn"
    fb_export_data = TEST_FB_DATA
    spatial_json = export_tscn_json(simple_scene, str(fb_export_data))
    assert spatial_json is not None
    objects = spatial_json["Portal_Dynamic"]
    assert len(objects) == 1
