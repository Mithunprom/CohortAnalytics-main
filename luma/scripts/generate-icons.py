#!/usr/bin/env python3
"""Write Luma's App Store icon and iOS splash without Pillow."""
from __future__ import annotations

import math
import os
import struct
import zlib

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def chunk(tag: bytes, data: bytes) -> bytes:
    return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)


def write_png(path: str, pixels: list[list[tuple[int, int, int, int]]]) -> None:
    height = len(pixels)
    width = len(pixels[0])
    raw = bytearray()
    for row in pixels:
        raw.append(0)
        for r, g, b, a in row:
            raw.extend((r, g, b, a))
    png = (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(bytes(raw), 9))
        + chunk(b"IEND", b"")
    )
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as handle:
        handle.write(png)


def lerp(a: float, b: float, t: float) -> float:
    return a + (b - a) * t


def mix(c0: tuple[int, int, int], c1: tuple[int, int, int], t: float) -> tuple[int, int, int]:
    t = max(0.0, min(1.0, t))
    return (
        int(lerp(c0[0], c1[0], t)),
        int(lerp(c0[1], c1[1], t)),
        int(lerp(c0[2], c1[2], t)),
    )


def paint_icon(size: int) -> list[list[tuple[int, int, int, int]]]:
    cx = cy = (size - 1) / 2
    scale = size / 64.0
    pixels: list[list[tuple[int, int, int, int]]] = []
    void = (10, 8, 20)
    lime = (200, 255, 61)
    gold = (255, 224, 138)
    violet = (124, 58, 237)
    wing = (196, 181, 253)
    for y in range(size):
        row = []
        for x in range(size):
            dx = (x - cx) / scale
            dy = (y - cy) / scale
            # body sits a little below center, matching the SVG
            bx, by = dx, dy - 2
            dist = math.hypot(bx, by)
            glow = math.exp(-(dist * dist) / 220.0)
            color = mix(void, violet, glow * 0.55)
            color = mix(color, lime, math.exp(-(dist * dist) / 90.0) * 0.65)
            color = mix(color, gold, math.exp(-(dist * dist) / 28.0))
            # wings
            for sign, angle in ((-1, -0.49), (1, 0.49)):
                wx = dx - sign * 12
                wy = dy + 4
                ca, sa = math.cos(angle), math.sin(angle)
                rx = ca * wx + sa * wy
                ry = -sa * wx + ca * wy
                wing_d = (rx / 10.0) ** 2 + (ry / 5.0) ** 2
                if wing_d < 1:
                    color = mix(color, wing, 0.45 * (1 - wing_d))
            core = math.hypot(dx, dy - 2)
            if core < 5:
                color = mix(color, (255, 246, 214), 1 - core / 5)
            row.append((color[0], color[1], color[2], 255))
        pixels.append(row)
    return pixels


def paint_splash(size: int) -> list[list[tuple[int, int, int, int]]]:
    icon = paint_icon(size // 3)
    icon_size = len(icon)
    ox = (size - icon_size) // 2
    oy = (size - icon_size) // 2 - size // 18
    bg = (5, 4, 12, 255)
    pixels = [[bg for _ in range(size)] for _ in range(size)]
    for y, row in enumerate(icon):
        dest = pixels[oy + y]
        for x, pix in enumerate(row):
            dest[ox + x] = pix
    return pixels


def main() -> None:
    icon = paint_icon(1024)
    splash = paint_splash(1024)
    write_png(os.path.join(ROOT, "store", "icon-1024.png"), icon)
    write_png(os.path.join(ROOT, "public", "apple-touch-icon.png"), icon)
    write_png(
        os.path.join(ROOT, "ios", "App", "App", "Assets.xcassets", "AppIcon.appiconset", "AppIcon-512@2x.png"),
        icon,
    )
    write_png(
        os.path.join(ROOT, "ios", "App", "App", "Assets.xcassets", "Splash.imageset", "splash.png"),
        splash,
    )
    print("wrote Luma icons")


if __name__ == "__main__":
    main()
