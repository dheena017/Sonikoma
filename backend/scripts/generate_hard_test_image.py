"""
backend/scripts/generate_hard_test_image.py
─────────────────────────────────────────────────────────────────────────────
Synthetic Hard Challenge Generator for Comic & Manga Panel Detection:
Creates edge-case benchmark images:
1. 'hard_test_manga_grid_2d.png' (1200x1800):
   - Slanted/diagonal 15-degree action dividers
   - Multi-column 3-panel tiers
   - Overlapping speech bubbles protruding into gutters
   - Inset picture-in-picture mini panels
   - Dark/black background flashback gutters

2. 'hard_test_webtoon_scroll.png' (800x8000):
   - Ultra-tight 10px gutters
   - Dark blue textured background gutters
   - Borderless splash scenes with continuous gradient transitions
   - Diagonal cut panel frames
   - Floating speech bubbles in outer margins
─────────────────────────────────────────────────────────────────────────────
"""

import os
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFont

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data", "test_assets")
os.makedirs(DATA_DIR, exist_ok=True)


def draw_speech_bubble(draw: ImageDraw.ImageDraw, x: int, y: int, w: int, h: int, text: str = "DIALOGUE"):
    """Draws a white rounded speech bubble with black outline and tail."""
    # Outer bubble
    draw.rounded_rectangle([x, y, x + w, y + h], radius=15, fill=(255, 255, 255), outline=(0, 0, 0), width=3)
    # Speech tail
    tail_x = x + w // 2
    tail_y = y + h
    draw.polygon([(tail_x - 8, tail_y - 2), (tail_x + 8, tail_y - 2), (tail_x - 15, tail_y + 16)], fill=(255, 255, 255), outline=(0, 0, 0))
    # Fill tail inner
    draw.polygon([(tail_x - 6, tail_y - 3), (tail_x + 6, tail_y - 3), (tail_x - 13, tail_y + 14)], fill=(255, 255, 255))
    draw.text((x + 12, y + h // 3), text, fill=(0, 0, 0))


def generate_hard_manga_grid() -> str:
    """Generates a 1200x1800 2D multi-tier Manga page with edge cases."""
    w, h = 1200, 1800
    img = Image.new("RGB", (w, h), color=(255, 255, 255))
    draw = ImageDraw.ImageDraw(img)

    # ── Tier 1 (y: 60..450): 2 Panels with a Diagonal Slanted Gutter (15-degree tilt) ──
    # Panel 1A (Left)
    poly_1a = [(80, 80), (540, 80), (480, 440), (80, 440)]
    draw.polygon(poly_1a, fill=(245, 240, 240), outline=(0, 0, 0))
    # Draw simple character figure inside 1A
    draw.ellipse([180, 120, 280, 220], fill=(220, 180, 150), outline=(0, 0, 0), width=2)
    draw.rectangle([150, 220, 310, 420], fill=(50, 90, 160))
    draw_speech_bubble(draw, 300, 100, 140, 60, "HEY!")

    # Panel 1B (Right)
    poly_1b = [(570, 80), (1120, 80), (1120, 440), (510, 440)]
    draw.polygon(poly_1b, fill=(240, 245, 248), outline=(0, 0, 0))
    draw.ellipse([700, 140, 820, 260], fill=(230, 190, 160), outline=(0, 0, 0), width=2)
    draw_speech_bubble(draw, 850, 110, 180, 70, "LOOK OUT!")

    # ── Tier 2 (y: 490..900): 3 Multi-Column Panels with Protruding Bubble ───
    # Panel 2A
    draw.rectangle([80, 500, 390, 890], fill=(235, 235, 245), outline=(0, 0, 0), width=3)
    draw.ellipse([160, 580, 260, 680], fill=(200, 160, 130), outline=(0, 0, 0), width=2)

    # Panel 2B (With speech bubble protruding 25px into the top gutter)
    draw.rectangle([420, 500, 770, 890], fill=(245, 245, 235), outline=(0, 0, 0), width=3)
    draw_speech_bubble(draw, 500, 465, 200, 70, "OVERFLOW!")

    # Panel 2C
    draw.rectangle([800, 500, 1120, 890], fill=(240, 240, 240), outline=(0, 0, 0), width=3)
    draw.ellipse([900, 560, 1020, 680], fill=(220, 180, 150), outline=(0, 0, 0), width=2)

    # ── Tier 3 (y: 940..1350): Wide Splash Panel with Inset Mini-Panel ────────
    draw.rectangle([80, 950, 1120, 1340], fill=(225, 235, 240), outline=(0, 0, 0), width=3)
    # Background action speed lines
    for lx in range(100, 1100, 35):
        draw.line([(lx, 960), (600, 1150)], fill=(200, 210, 220), width=2)
    # Inset picture-in-picture mini panel
    draw.rectangle([780, 1050, 1080, 1310], fill=(255, 240, 240), outline=(0, 0, 0), width=3)
    draw.text((820, 1150), "[INSET CLOSEUP]", fill=(0, 0, 0))

    # ── Tier 4 (y: 1390..1750): Dark Background Flashback Panels ─────────────
    # Dark gutter background
    draw.rectangle([60, 1370, 1140, 1760], fill=(35, 38, 48))
    # Panel 4A
    draw.rectangle([80, 1390, 570, 1730], fill=(20, 20, 25), outline=(200, 200, 200), width=2)
    draw.ellipse([250, 1450, 370, 1570], fill=(180, 140, 120), outline=(255, 255, 255), width=2)
    draw_speech_bubble(draw, 140, 1600, 180, 60, "DARK PAST...")

    # Panel 4B
    draw.rectangle([610, 1390, 1120, 1730], fill=(25, 20, 25), outline=(200, 200, 200), width=2)
    draw.ellipse([780, 1450, 900, 1570], fill=(210, 170, 140), outline=(255, 255, 255), width=2)

    out_path = os.path.join(DATA_DIR, "hard_test_manga_grid_2d.png")
    img.save(out_path)
    print(f"Generated 2D Manga Grid Challenge: {out_path} ({w}x{h}px)")
    return out_path


def generate_hard_webtoon_scroll() -> str:
    """Generates an 800x8000 Webtoon Scroll with tight, dark, and borderless scenes."""
    w, h = 800, 8000
    img = Image.new("RGB", (w, h), color=(255, 255, 255))
    draw = ImageDraw.ImageDraw(img)

    # 1. Top Panel right at y=20 (Top margin edge case)
    draw.rectangle([40, 20, 760, 750], fill=(245, 240, 240), outline=(0, 0, 0), width=3)
    draw.ellipse([300, 150, 500, 350], fill=(220, 180, 150), outline=(0, 0, 0), width=2)
    draw_speech_bubble(draw, 100, 80, 220, 80, "TOP OF CHAPTER!")

    # 2. Tight 10px Gutter (y: 750..760) followed by Panel 2
    draw.rectangle([40, 760, 760, 1450], fill=(240, 245, 250), outline=(0, 0, 0), width=3)
    draw.ellipse([320, 880, 480, 1040], fill=(210, 170, 140), outline=(0, 0, 0), width=2)
    draw_speech_bubble(draw, 450, 820, 220, 80, "TIGHT 10PX GUTTER!")

    # 3. Dark Blue/Purple Night-Sky Gutter (y: 1450..1800) with Panel 3
    for y_bg in range(1450, 3200):
        ratio = (y_bg - 1450) / 1750.0
        r = int(25 + 20 * ratio)
        g = int(30 + 15 * ratio)
        b = int(50 + 35 * ratio)
        draw.line([(0, y_bg), (w, y_bg)], fill=(r, g, b))

    # Panel 3 (inside dark background)
    draw.rectangle([50, 1800, 750, 2500], fill=(15, 20, 35), outline=(120, 150, 200), width=2)
    draw.ellipse([300, 1950, 500, 2150], fill=(230, 190, 160), outline=(255, 255, 255), width=2)
    draw_speech_bubble(draw, 120, 1850, 220, 80, "DARK NIGHT SCENE")

    # 4. Diagonal Slash Panel (y: 2600..3300)
    poly_diag = [(50, 2650), (750, 2550), (750, 3350), (50, 3450)]
    draw.polygon(poly_diag, fill=(240, 235, 230), outline=(0, 0, 0))
    draw.ellipse([280, 2800, 480, 3000], fill=(220, 175, 145), outline=(0, 0, 0), width=2)
    draw_speech_bubble(draw, 400, 2700, 240, 80, "DIAGONAL ACTION!")

    # 5. Continuous Borderless Scene (y: 3600..5200) with transition at 4400
    for y_forest in range(3500, 5300):
        t = (y_forest - 3500) / 1800.0
        draw.line([(0, y_forest), (w, y_forest)], fill=(int(40 + 60*t), int(70 + 80*t), int(50 + 50*t)))

    # Upper forest figure
    draw.ellipse([200, 3750, 380, 3930], fill=(230, 190, 160), outline=(0, 0, 0), width=2)
    draw_speech_bubble(draw, 400, 3700, 220, 80, "IN THE FOREST...")

    # Lower forest confrontation
    draw.ellipse([450, 4600, 630, 4780], fill=(220, 180, 150), outline=(0, 0, 0), width=2)
    draw_speech_bubble(draw, 150, 4550, 240, 80, "WHO ARE YOU?!")

    # 6. Two Consecutive Bottom Panels (y: 5400..7900)
    draw.rectangle([50, 5450, 750, 6500], fill=(250, 250, 250), outline=(0, 0, 0), width=3)
    draw.ellipse([300, 5650, 500, 5850], fill=(210, 170, 140), outline=(0, 0, 0), width=2)
    draw_speech_bubble(draw, 120, 5550, 220, 80, "FINAL CLIMAX")

    draw.rectangle([50, 6600, 750, 7850], fill=(245, 245, 248), outline=(0, 0, 0), width=3)
    draw.ellipse([300, 6850, 500, 7050], fill=(230, 190, 160), outline=(0, 0, 0), width=2)
    draw_speech_bubble(draw, 420, 6750, 220, 80, "TO BE CONTINUED")

    out_path = os.path.join(DATA_DIR, "hard_test_webtoon_scroll.png")
    img.save(out_path)
    print(f"Generated Webtoon Scroll Challenge: {out_path} ({w}x{h}px)")
    return out_path


if __name__ == "__main__":
    generate_hard_manga_grid()
    generate_hard_webtoon_scroll()
