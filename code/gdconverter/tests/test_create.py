from gdconverter.create_godot import create_godot

from tests.utils import TEST_FB_DATA, TEST_GD_LEVELS_OUT


def test_create_godot_empty() -> None:
    assert create_godot("", "") is False


def test_create_godot_valid() -> None:
    assert create_godot(TEST_FB_DATA, TEST_GD_LEVELS_OUT, overwrite_levels=True, allow_missing_meshes=True) is True


def test_create_godot_no_mesh() -> None:
    assert create_godot(TEST_FB_DATA, TEST_GD_LEVELS_OUT, overwrite_levels=True, allow_missing_meshes=False) is False
