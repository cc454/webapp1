"""Render the existing vector brand mark into Android launcher assets.

Run with Python and Pillow after changing assets/brand/adaptai-mark.svg.
Committed PNGs let normal Expo builds run without Python.
"""
from pathlib import Path
import xml.etree.ElementTree as ET
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parent.parent
brand = root / "assets" / "brand"
svg = ET.parse(brand / "adaptai-mark.svg").getroot()
polygons = [
    [tuple(map(float, point.split(","))) for point in node.attrib["points"].split()]
    for node in svg.iter("{http://www.w3.org/2000/svg}polygon")
]


def render(name, scale, background, color):
    supersample = 4
    image = Image.new("RGBA", (1024 * supersample, 1024 * supersample), background)
    draw = ImageDraw.Draw(image)
    for polygon in polygons:
        points = [((512 + (x - 54) * scale) * supersample,
                   (512 + (y - 50) * scale) * supersample) for x, y in polygon]
        draw.polygon(points, fill=color)
    image.resize((1024, 1024), Image.Resampling.LANCZOS).save(brand / name)


render("launcher-icon.png", 7.1, "#0B0F0F", "#24CEB1")
# Adaptive foreground artwork stays within the central 66/108 safe circle.
# Android masks and parallax can crop the outer portion of the 108dp layer.
render("launcher-foreground.png", 5.0, (0, 0, 0, 0), "#24CEB1")
render("launcher-monochrome.png", 5.0, (0, 0, 0, 0), "white")
