"""Terrain tools for converting between PNG and EXR formats."""

import argparse
import json
import os
import shutil
import sys
import tempfile
from pathlib import Path

from terrain.terrain_img import ImageMeta, exr_to_png, pad_image, png_to_exr

PNG_TO_EXR = "p2e"
EXR_TO_PNG = "e2p"


class MetaFile:
    """Metadata for a png terrain image file."""

    filepath: Path
    level: str = ""
    data_file_name: str = ""
    pixel_width: int = 0
    pixel_height: int = 0
    area_min_x: int = 0
    area_min_y: int = 0
    area_max_x: int = 0
    area_max_y: int = 0
    image_meta: ImageMeta = ImageMeta()
    keep_temp_image: bool = False

    def __init__(self) -> None:
        self.image_meta.scale = 1024.0
        self.image_meta.print_info = False

    def load_txt(self, meta_filepath: Path) -> None:
        """Load metadata from a file."""

        if not meta_filepath.exists():
            return

        self.filepath = meta_filepath
        lines = meta_filepath.read_text().splitlines()
        for line in lines:
            line = line.strip()
            if line and not line.startswith("//") and line.find(":") != -1:
                key, value = line.split(":")
                key = key.strip()
                value = value.strip()
                if key == "Level":
                    self.level = value
                elif key == "DataFileName":
                    self.data_file_name = value
                elif key == "PixelWidth":
                    self.pixel_width = int(value)
                elif key == "PixelHeight":
                    self.pixel_height = int(value)
                elif key == "SamplesPerMeter":
                    self.image_meta.spm = float(value)
                elif key == "Area Min.X":
                    self.area_min_x = int(value)
                elif key == "Area Min.Y":
                    self.area_min_y = int(value)
                elif key == "Area Max.X":
                    self.area_max_x = int(value)
                elif key == "Area Max.Y":
                    self.area_max_y = int(value)
                elif key == "MaxHeight":
                    self.image_meta.max_height = int(value)
                elif key == "HeightOffset":
                    self.image_meta.scale = int(value)

    def load_level_info(self, levelinfo_filepah: Path, level_name: str) -> None:
        if not levelinfo_filepah.exists():
            return

        with open(levelinfo_filepah) as file:
            level_info = json.load(file)

        if level_name not in level_info:
            return

        level_data = level_info[level_name]

        if "heightfield" not in level_data:
            return

        heightfield = level_data["heightfield"]

        for key, value in heightfield.items():
            if key == "dataFileName":
                self.data_file_name = value
            elif key == "samplesPerMeter":
                self.image_meta.spm = float(value)
            elif key == "minX":
                self.area_min_x = int(value)
            elif key == "minY":
                self.area_min_y = int(value)
            elif key == "maxX":
                self.area_max_x = int(value)
            elif key == "maxY":
                self.area_max_y = int(value)
            elif key == "maxHeight":
                self.image_meta.max_height = int(value)
            elif key == "heightOffset":
                self.image_meta.scale = int(value)

    def save_txt(self, meta_filepath: str) -> None:
        """Save metadata to a file."""
        with open(meta_filepath, "w", encoding="utf-8") as file:
            file.write(f"Level: {self.level}\n")
            file.write(f"DataFileName: {self.data_file_name}\n")
            file.write(f"PixelWidth: {self.pixel_width}\n")
            file.write(f"PixelHeight: {self.pixel_height}\n")
            file.write(f"SamplesPerMeter: {self.image_meta.spm}\n")
            file.write(f"Area Min.X: {self.area_min_x}\n")
            file.write(f"Area Min.Y: {self.area_min_y}\n")
            file.write(f"Area Max.X: {self.area_max_x}\n")
            file.write(f"Area Max.Y: {self.area_max_y}\n")
            file.write(f"MaxHeight: {self.image_meta.max_height}\n")
            file.write(f"HeightOffset: {self.image_meta.scale}")


def _round_to_multiple_of_1024(value: int) -> int:
    if value < 0:
        return (value // 1024) * 1024
    return ((value + 1023) // 1024) * 1024


def _calculate_padding(value: int, spm: float) -> int:
    # print("_calculate_padding: value=", value, " spm=", spm, " result=", str(int(abs(_round_to_multiple_of_1024(value) - value) * spm) if spm > 0 else "0"))
    return int(abs(_round_to_multiple_of_1024(value) - value) * spm)


def generate_godot_exr_files(meta_filepath: Path, output_dir: Path) -> None:
    """Generate Godot exr files from png files."""

    print(f"Converting PNG to EXR: {meta_filepath} to {output_dir}")
    meta_file = MetaFile()
    meta_file.load_txt(meta_filepath)
    png_file = os.path.join(os.path.dirname(meta_filepath), meta_file.data_file_name)
    if not os.path.exists(png_file):
        print(f"PNG file does not exist: {png_file}")
        sys.exit(1)
    output_dir.mkdir(parents=True, exist_ok=True)
    _copy_meta_file(meta_file, output_dir)
    exr_file = os.path.join(output_dir, os.path.splitext(meta_file.data_file_name)[0] + ".exr")

    # If the area min/max is not a multiple of 1024, the image will be padded.
    pad_left = _calculate_padding(meta_file.area_min_x, meta_file.image_meta.spm)
    pad_top = _calculate_padding(meta_file.area_min_y, meta_file.image_meta.spm)
    pad_right = _calculate_padding(meta_file.area_max_x, meta_file.image_meta.spm)
    pad_bottom = _calculate_padding(meta_file.area_max_y, meta_file.image_meta.spm)
    if pad_left > 0 or pad_top > 0 or pad_right > 0 or pad_bottom > 0:
        print(f"Warning: Image will be padded by left={pad_left}, top={pad_top}, right={pad_right}, bottom={pad_bottom}")
        # Create temp png file with padding.
        temp_png_file = tempfile.NamedTemporaryFile(suffix=".png", delete=False).name
        pad_image(png_file, temp_png_file, pad_left, pad_top, pad_right, pad_bottom, meta_file.image_meta)
        png_to_exr(temp_png_file, exr_file, meta_file.image_meta)
        if meta_file.keep_temp_image:
            shutil.copyfile(temp_png_file, png_file.replace(".png", "-padded.png"))
        os.remove(temp_png_file)
    else:
        png_to_exr(png_file, exr_file, meta_file.image_meta)


def convert_godot_exr_files(levelinfo_filepath: Path, input_level_exr: Path) -> None:
    """Convert Godot exr files to png files."""

    in_exr_file = str(input_level_exr)
    out_png_file = str(input_level_exr.with_suffix(".png"))

    # Remove "_Heightfield" from the exported exr to get the original level name.
    level_name = input_level_exr.stem.removesuffix("_Heightfield")

    print(f"Converting EXR to PNG: {in_exr_file} to {out_png_file}")

    if not input_level_exr.exists():
        print(f"EXR file does not exist: {in_exr_file}")
        sys.exit(1)

    meta_file = MetaFile()
    meta_file.load_level_info(levelinfo_filepath, level_name)

    in_exr_file = str(input_level_exr)
    # Final output image should be the same image wit "png" extension.
    out_png_file = str(input_level_exr.with_suffix(".png"))

    exr_to_png(in_exr_file, out_png_file, meta_file.image_meta)


def _copy_meta_file(meta_file: MetaFile, output_dir: Path) -> None:
    shutil.copyfile(meta_file.filepath, output_dir / os.path.basename(meta_file.filepath))


def _run() -> None:
    parser = argparse.ArgumentParser(description="Convert between png and exr terrain images")
    subparsers = parser.add_subparsers(required=True)
    parser_p2e = subparsers.add_parser(PNG_TO_EXR, help="png to exr")
    parser_p2e.set_defaults(func=generate_godot_exr_files)
    parser_e2p = subparsers.add_parser(EXR_TO_PNG, help="exr to png")
    parser_e2p.set_defaults(func=convert_godot_exr_files)
    parser.add_argument("META_FILEPATH", type=str, help="Terrain meta file. Usually adjacent to terrain image")
    parser.add_argument("OUTPUT_DIR", type=str, help="Output directory to create image in")

    args = parser.parse_args()

    output_dir = Path(args.OUTPUT_DIR)
    meta_filepath = Path(args.META_FILEPATH)

    if not meta_filepath.exists():
        print(f"Meta file does not exist: {meta_filepath}")
        sys.exit(1)

    args.func(meta_filepath, output_dir)


if __name__ == "__main__":
    _run()
