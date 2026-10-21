from pathlib import Path

import pytest
from terrain.terrain_script import convert_godot_exr_files, generate_godot_exr_files


def test_empty_generate_exr() -> None:
    with pytest.raises(SystemExit):
        generate_godot_exr_files(Path("foo"), Path("bar"))


def test_empty_convert_exr() -> None:
    with pytest.raises(SystemExit):
        convert_godot_exr_files(Path("foo"), Path("bar"))
