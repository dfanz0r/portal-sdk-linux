"""Image operations for converting between PNG and EXR formats for terrain data."""

import sys
from collections.abc import Callable
from typing import Any

import cv2
import Imath  # type: ignore
import numpy as np
import numpy.typing as npt
import OpenEXR  # type: ignore
from PIL import Image

_DEBUG = False

OP_INFOPNG = "infopng"
OP_INFOEXR = "infoexr"
OP_P2E = "p2e"
OP_E2P = "e2p"
OP_P2T = "p2t"
OP_B2T = "b2t"
OP_B2P = "b2p"
OP_B2E = "b2e"
OPS = [OP_INFOPNG, OP_INFOEXR, OP_P2E, OP_E2P, OP_P2T, OP_B2T, OP_B2P, OP_B2E]


class ImageMeta:
    """Metadata for image files."""

    # Magic numbers for scaling the pixel values
    spm: float = 1.0  # Samples per meter. Terrain3D uses 1 sample per meter. If Frostbite level uses a different number, we need to scale it down.
    scale: float = 1024.0  # Scale factor for PNG images. HeightOffset of the terrain.
    max_height: int = 512  # Max Height of the terrain
    print_info: bool = True


_DEFAULT_IMAGE_META = ImageMeta()
EPSILON = 1e-6
DOWNSAMPLE_INTERPOLATION = cv2.INTER_AREA
UPSAMPLE_INTERPOLATION = cv2.INTER_LINEAR_EXACT


def _apply_statistic(func: Callable[..., Any], img_array: npt.NDArray[Any], *args: Any, **kwargs: dict[str, Any]) -> Any:
    if img_array.ndim <= 2:
        return func(img_array, *args, **kwargs)
    else:
        return func(img_array, *args, **kwargs, axis=tuple(range(img_array.ndim - 1)))


def png_to_txt(png_file: str, txt_file: str) -> None:
    # Read the PNG file
    image = cv2.imread(png_file, cv2.IMREAD_ANYDEPTH)

    if image is None:
        raise ValueError(f"Could not read image file: {png_file}")

    # Convert the image data to text
    A = image.shape[0]
    text_data = "\n".join(" ".join(map(str, image[i])) for i in range(A))

    # Save the text data to a .txt file
    with open(txt_file, "w") as f:
        f.write(text_data)


def binary_to_txt(binary_file: str, txt_file: str) -> None:
    """
    Converts a binary file to a text file by reading the binary file and writing the data to a text file.
    """
    # Read the binary file
    data = np.fromfile(binary_file, dtype=np.uint16)
    # Reshape the data to its original dimensions
    A = int(np.sqrt(len(data)))
    data = data.reshape((A, A))
    # Write the data to a text file
    np.savetxt(txt_file, data, fmt="%u")


def binary_to_png(binary_file: str, png_file: str) -> None:
    """
    Converts a binary file to a PNG file by reading the binary file and writing the data to a PNG file.
    PNG file will be 16-bit grayscale.
    """
    # Read the binary file
    data = np.fromfile(binary_file, dtype=np.uint16)
    # Reshape the data to its original dimensions
    A = int(np.sqrt(len(data)))
    data = data.reshape((A, A))
    # Write the data to a PNG file
    cv2.imwrite(png_file, data)


def binary_to_exr(binary_file: str, output_path: str, meta: ImageMeta = _DEFAULT_IMAGE_META) -> None:
    """
    Converts a binary file to a EXR file by reading the binary file and writing the data to a EXR file.
    EXR file will be 32-bit floating-point grayscale.
    """
    # Read the binary file
    data = np.fromfile(binary_file, dtype=np.uint16)
    data_f = data.astype(np.float32)
    # Normalize the image data to the range 0 to 1
    data_f /= 65535.0
    # MAGIC NUMBERS Scale the image data
    data_f *= meta.scale

    # Reshape the data to its original dimensions
    A = int(np.sqrt(len(data_f)))
    data_f = data_f.reshape((A, A))

    # Create an EXR header with the same dimensions as the input image
    header = OpenEXR.Header(data_f.shape[1], data_f.shape[0])
    float_str = Imath.Channel(Imath.PixelType(Imath.PixelType.FLOAT))
    header["channels"] = {"R": float_str}  # Only include the 'R' channel
    # Create an EXR file
    exr_file = OpenEXR.OutputFile(output_path, header)

    # Write the image data to the EXR file
    r_channel = data_f.tobytes()
    exr_file.writePixels({"R": r_channel})


def print_img_info(img_array: npt.NDArray[Any]) -> None:
    """
    Prints information about an image, including the min, max, and average values of each channel.
    """
    d = img_array.ndim
    print(f"Channel count: {img_array.shape[d-1] if d > 2 else 1}")
    print(f"min:  {_apply_statistic(np.min, img_array)} at {np.unravel_index(np.argmin(img_array), img_array.shape)}")
    print(f"max:  {_apply_statistic(np.max, img_array)} at {np.unravel_index(np.argmax(img_array), img_array.shape)}")
    print(f"std:  {_apply_statistic(np.std, img_array)}")
    print(f"avg:  {_apply_statistic(np.mean, img_array)}")
    print(f"Q1:   {_apply_statistic(np.percentile, img_array, 25)}")
    print(f"med:  {_apply_statistic(np.median, img_array)}")
    print(f"Q3:   {_apply_statistic(np.percentile, img_array, 75)}")


def print_exr_info(input_path: str, analyze_values: bool) -> None:
    """
    Prints information about an EXR file, including the size of the image and the min, max, and average values of each channel.
    """
    print(f"\nEXR file: {input_path}")
    # Open the EXR file
    exr_file = OpenEXR.InputFile(input_path)
    # Get the header
    header = exr_file.header()
    # Print the size of the image
    print(f"Size: {header['dataWindow'].max.x + 1} x {header['dataWindow'].max.y + 1}")
    # Print the compression type of the image
    print(f"Compression: {header['compression']}")
    # Print all channel names
    channel_names = ", ".join(header["channels"].keys())
    print(f"Channel names: {channel_names}")
    # Read the pixel data from the file
    channels = exr_file.header()["channels"]
    pt = Imath.PixelType(channels[list(channels.keys())[0]].type.v)
    # Print the data type and min, max, avg of each channel
    for channel, channel_info in channels.items():
        print(f"Channel {channel} has data type {channel_info.type}")
        if not analyze_values:
            continue
        # Get the channel data
        channel_data = exr_file.channel(channel, pt)
        dtype = np.float32 if str(channel_info.type) == "FLOAT" else np.float16
        # Convert the data to half-precision floating-point format
        channel_data = np.frombuffer(channel_data, dtype=dtype)
        # Reshape the channel data to 2D
        channel_data = channel_data.reshape((header["dataWindow"].max.y + 1, header["dataWindow"].max.x + 1))
        print_img_info(channel_data)


def print_png_info(input_path: str) -> None:
    """
    Prints information about a PNG file, including the number of channels, bit depth, and min, max, and average values of each channel.
    """
    print(f"\nPNG file: {input_path}")
    # Open the image file
    img = Image.open(input_path)
    print(f"Size: {img.size[0]} x {img.size[1]}")
    # Get the number of channels and bit depth
    mode = img.mode
    print(f"Mode (channels): {mode}")
    # Infer bit depth from mode
    if mode in ["1", "L", "P"]:
        bit_depth = 8
    elif mode == "I;16":
        bit_depth = 16
    else:
        bit_depth = 8 * len(mode)
    print(f"Bit depth per channel: {bit_depth}")

    # Convert the image to an array
    img_array = np.array(img)
    print_img_info(img_array)


def png_to_exr(input_path: str, output_path: str, meta: ImageMeta = _DEFAULT_IMAGE_META) -> None:
    """
    Converts a PNG image to an EXR image.
    PNG file must be 16-bit grayscale.
    PNG file is downsampled by taking the average of the pixels around it.
    EXR file will be 32-bit floating-point grayscale.
    """
    if meta.print_info or _DEBUG:
        print_png_info(input_path)
    # Open the image file
    img = cv2.imread(input_path, cv2.IMREAD_ANYDEPTH | cv2.IMREAD_GRAYSCALE)
    # Convert the image data to a numpy array with a data type of float32
    img_data = np.array(img, dtype=np.float32)
    # Normalize the image data to the range 0 to 1
    img_data /= 65535.0
    # MAGIC NUMBERS Scale the image data
    img_data = img_data * meta.scale
    # Downsample the image by taking the average of the pixels around it
    resample_size = (int(img_data.shape[1] // 2 * 2 // meta.spm), int(img_data.shape[0] // 2 * 2 // meta.spm))
    upsample = resample_size[0] > img_data.shape[1] or resample_size[1] > img_data.shape[0]
    print(f"resample image from {(img_data.shape[1], img_data.shape[0])} to {resample_size}")
    img_data = cv2.resize(img_data, resample_size, interpolation=UPSAMPLE_INTERPOLATION if upsample else DOWNSAMPLE_INTERPOLATION)  # type: ignore
    # Create an EXR header with the same dimensions as the input image
    header = OpenEXR.Header(img_data.shape[1], img_data.shape[0])
    float_str = Imath.Channel(Imath.PixelType(Imath.PixelType.FLOAT))
    header["channels"] = {"R": float_str}  # Only include the 'R' channel
    # Create an EXR file
    exr_file = OpenEXR.OutputFile(output_path, header)

    # Write the image data to the EXR file
    r_channel = img_data.tobytes()
    exr_file.writePixels({"R": r_channel})
    if meta.print_info or _DEBUG:
        print_exr_info(output_path, False)


def exr_to_png(input_path: str, output_path: str, meta: ImageMeta = _DEFAULT_IMAGE_META) -> None:
    """
    Converts an EXR image to a PNG image.
    EXR file must be 32-bit floating-point grayscale.
    PNG file is padded to get original size + 1 dimensions. (Pixel Center Sample -> TopLeftCorner Sampling)
    PNG file will be 16-bit grayscale.
    """
    if meta.print_info or _DEBUG:
        print_exr_info(input_path, True)
    # Open the EXR file
    exr_file = OpenEXR.InputFile(input_path)
    # Get the size of the image
    dw = exr_file.header()["dataWindow"]
    size = (dw.max.x - dw.min.x + 1, dw.max.y - dw.min.y + 1)
    # Read the pixel data from the file
    channels = exr_file.header()["channels"]
    pt = Imath.PixelType(channels[list(channels.keys())[0]].type.v)
    r_str = exr_file.channel("Y", pt) if "Y" in channels else exr_file.channel("R", pt)
    # Convert the pixel data to a numpy array
    img_data = np.frombuffer(r_str, dtype=np.float32)
    img_data.shape = (size[1], size[0])  # Numpy arrays are (row, col)
    img_data = np.array(img_data / meta.max_height, dtype=np.float32)
    # Pad the image with an extra pixel at the end
    img_data = np.pad(img_data, ((0, 1), (0, 1)), mode="edge")
    # Clip the pixel to uint16.max
    img_data = np.clip(img_data * 65535.0, 0, 65535).astype(np.uint16)
    # Write the image data to a PNG file
    cv2.imwrite(output_path, img_data)
    if meta.print_info or _DEBUG:
        print_png_info(output_path)


def pad_image(input_path: str, output_path: str, left: int, up: int, right: int, bottom: int, meta: ImageMeta = _DEFAULT_IMAGE_META) -> None:
    """
    Pad an image with the given number of pixels on each side.
    """
    if meta.print_info or _DEBUG:
        print_png_info(input_path)
    img = cv2.imread(input_path, cv2.IMREAD_ANYDEPTH | cv2.IMREAD_GRAYSCALE)
    img_data = np.array(img, dtype=np.uint16)
    img_data = np.pad(img_data, ((up, bottom), (left, right)), mode="constant")
    cv2.imwrite(output_path, img_data)
    if meta.print_info or _DEBUG:
        print_png_info(output_path)


def crop_image(input_path: str, output_path: str, left: int, top: int, right: int, bottom: int, meta: ImageMeta = _DEFAULT_IMAGE_META) -> None:
    """
    Crop an image to the given size.
    """
    if meta.print_info or _DEBUG:
        print_png_info(input_path)
    img = cv2.imread(input_path, cv2.IMREAD_ANYDEPTH | cv2.IMREAD_GRAYSCALE)
    img_data = np.array(img, dtype=np.uint16)
    img_data = img_data[top:-bottom, left:-right]
    cv2.imwrite(output_path, img_data)
    if meta.print_info or _DEBUG:
        print_png_info(output_path)


def get_image_size(input_path: str) -> tuple[int, int]:
    """
    Get the size of an image.
    """
    img = Image.open(input_path)
    return img.size


def _print_usage() -> None:
    print("Usage: python script.py <ops> <input_path> <output_path>")
    print("Operations:", OPS)


def _run() -> None:
    if len(sys.argv) >= 2:
        op = sys.argv[1]
    else:
        _print_usage()
        sys.exit(1)
    err = True
    if op in (OP_INFOPNG, OP_INFOEXR):
        if len(sys.argv) == 3:
            input_path = sys.argv[2]
            if op == OP_INFOEXR:
                print_exr_info(input_path, True)
            else:
                print_png_info(input_path)
            err = False
    elif len(sys.argv) == 4:
        input_path = sys.argv[2]
        output_path = sys.argv[3]
        if op == OP_P2E:
            png_to_exr(input_path, output_path)
            err = False
        elif op == OP_E2P:
            exr_to_png(input_path, output_path)
            err = False
        elif op == OP_P2T:
            png_to_txt(input_path, output_path)
            err = False
        elif op == OP_B2T:
            binary_to_txt(input_path, output_path)
            err = False
        elif op == OP_B2P:
            binary_to_png(input_path, output_path)
            err = False
        elif op == OP_B2E:
            binary_to_exr(input_path, output_path)
            err = False
    if err:
        _print_usage()
        sys.exit(1)
    sys.exit(0)


if __name__ == "__main__":
    _run()
