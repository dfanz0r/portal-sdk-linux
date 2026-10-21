"""Visualize RasterQuadtreeNodeData leaf nodes from a DBX file."""

import argparse
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from pathlib import Path

import matplotlib.patches as patches
import matplotlib.pyplot as plt


@dataclass
class Rectangle:
    """Represents a rectangle with min/max coordinates and optional name."""

    min_x: float
    min_y: float
    max_x: float
    max_y: float
    name: str | None = None


def parse_dbx_quadtree(dbx_path: Path) -> list[Rectangle]:
    """
    Parse a DBX file and extract WorldCoverage rectangles from
    RasterQuadtreeNodeData instances that have no Children.

    Args:
        dbx_path: Path to the DBX file.

    Returns:
        List of Rectangle objects representing leaf node coverages.
    """
    tree = ET.parse(dbx_path)
    root = tree.getroot()

    rectangles: list[Rectangle] = []

    def parse_float(elem: ET.Element | None) -> float:
        if elem is None or elem.text is None:
            return 0.0
        return float(elem.text)

    for instance in root.findall(".//instance[@type='TerrainBase.RasterQuadtreeNodeData']"):
        # Skip nodes that have Children
        children = instance.find("array[@name='Children']")
        if children is not None:
            continue

        # Extract WorldCoverage
        world_coverage = instance.find("complex[@name='WorldCoverage']")
        if world_coverage is None:
            continue

        min_complex = world_coverage.find("complex[@name='Min']")
        max_complex = world_coverage.find("complex[@name='Max']")

        # Default to 0,0 if Min or Max is missing
        if min_complex is not None:
            min_x_elem = min_complex.find("field[@name='x']")
            min_y_elem = min_complex.find("field[@name='y']")
        else:
            min_x_elem = None
            min_y_elem = None

        if max_complex is not None:
            max_x_elem = max_complex.find("field[@name='x']")
            max_y_elem = max_complex.find("field[@name='y']")
        else:
            max_x_elem = None
            max_y_elem = None

        # Extract RasterFile name if present
        raster_file_elem = instance.find("field[@name='RasterFile']")
        raster_file = raster_file_elem.text if raster_file_elem is not None else None

        rect = Rectangle(
            min_x=parse_float(min_x_elem),
            min_y=parse_float(min_y_elem),
            max_x=parse_float(max_x_elem),
            max_y=parse_float(max_y_elem),
            name=raster_file,
        )
        rectangles.append(rect)

    return rectangles


def visualize_rectangles(rectangles: list[Rectangle], title: str = "Quadtree Leaf Nodes") -> None:
    """
    Visualize rectangles using matplotlib.

    Args:
        rectangles: List of Rectangle objects to visualize.
        title: Title for the plot.
    """
    if not rectangles:
        print("No rectangles to visualize.")
        return

    fig, ax = plt.subplots(1, 1, figsize=(12, 12))

    # Generate colors for the rectangles
    cmap = plt.colormaps["tab20"]

    for i, rect in enumerate(rectangles):
        width = rect.max_x - rect.min_x
        height = rect.max_y - rect.min_y

        color = cmap(i % 20)
        patch = patches.Rectangle(
            (rect.min_x, rect.min_y),
            width,
            height,
            linewidth=1,
            edgecolor="black",
            facecolor=color,
            alpha=0.5,
        )
        ax.add_patch(patch)

        # Add label if RasterFile name exists
        if rect.name:
            center_x = rect.min_x + width / 2
            center_y = rect.min_y + height / 2
            ax.text(
                center_x,
                center_y,
                rect.name,
                ha="center",
                va="center",
                fontsize=6,
                rotation=45,
            )

    # Set axis limits based on all rectangles
    all_min_x = min(r.min_x for r in rectangles)
    all_min_y = min(r.min_y for r in rectangles)
    all_max_x = max(r.max_x for r in rectangles)
    all_max_y = max(r.max_y for r in rectangles)

    margin = max(all_max_x - all_min_x, all_max_y - all_min_y) * 0.05
    ax.set_xlim(all_min_x - margin, all_max_x + margin)
    ax.set_ylim(all_min_y - margin, all_max_y + margin)

    ax.set_aspect("equal")
    ax.set_xlabel("X")
    ax.set_ylabel("Y")
    ax.set_title(f"{title}\n({len(rectangles)} leaf nodes)")
    ax.grid(True, alpha=0.3)

    plt.tight_layout()
    plt.show()


def main() -> None:
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Visualize RasterQuadtreeNodeData leaf nodes from a DBX file.")
    parser.add_argument("dbx_file", type=Path, help="Path to the DBX file")
    args = parser.parse_args()

    dbx_path = Path(args.dbx_file)
    if not dbx_path.exists():
        print(f"Error: File not found: {dbx_path}")
        return

    print(f"Parsing {dbx_path}...")
    rectangles = parse_dbx_quadtree(dbx_path)
    print(f"Found {len(rectangles)} leaf nodes without children.")

    visualize_rectangles(rectangles, title=dbx_path.stem)


if __name__ == "__main__":
    main()
