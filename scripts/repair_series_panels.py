"""
scripts/repair_series_panels.py
─────────────────────────────────────────────────────────────────────────────
Fast panel repair script:
1. Generates placeholder_1.webp ... placeholder_25.webp in data/local_media and frontend/public.
2. Finds all panels in data/webtoon_local.db with image_url LIKE '/placeholder_%' or pointing
   to nonexistent files.
3. Generates high-quality styled WebP artwork and updates the database.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import sys
import sqlite3
import uuid
from PIL import Image, ImageDraw, ImageFont

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
LOCAL_MEDIA_DIR = os.path.join(PROJECT_ROOT, "data", "local_media")
PUBLIC_DIR = os.path.join(PROJECT_ROOT, "frontend", "public")
DB_PATH = os.path.join(PROJECT_ROOT, "data", "webtoon_local.db")

os.makedirs(LOCAL_MEDIA_DIR, exist_ok=True)
os.makedirs(PUBLIC_DIR, exist_ok=True)


def create_artistic_panel(text: str, width: int = 800, height: int = 600, color_scheme: int = 0) -> Image.Image:
    """Generates an anime/manhwa cinematic panel fast."""
    schemes = [
        ((15, 18, 30), (45, 25, 65), (140, 110, 240)),  # Cyberpunk Violet
        ((20, 15, 28), (80, 25, 40), (250, 100, 130)),  # Crimson Sunset
        ((12, 24, 28), (18, 55, 65), (70, 210, 200)),   # Sci-Fi Cyan
        ((18, 20, 25), (40, 45, 60), (150, 170, 230)),  # Cool Slate Noir
        ((25, 20, 15), (70, 50, 20), (240, 180, 60)),   # Golden Dawn
    ]
    c_top, c_mid, c_accent = schemes[color_scheme % len(schemes)]

    # Fast 2-pixel gradient scaled up
    base = Image.new("RGB", (1, 2))
    base.putpixel((0, 0), c_top)
    base.putpixel((0, 1), c_mid)
    img = base.resize((width, height), Image.Resampling.BILINEAR)

    draw = ImageDraw.Draw(img)

    # Outer border & inner frame
    draw.rectangle([6, 6, width - 7, height - 7], outline=c_accent, width=2)
    draw.rectangle([12, 12, width - 13, height - 13], outline=(40, 45, 60), width=1)

    # Corner cinematic notches
    n = 25
    draw.line([(6, 6 + n), (6, 6), (6 + n, 6)], fill=c_accent, width=3)
    draw.line([(width - 7 - n, 6), (width - 7, 6), (width - 7, 6 + n)], fill=c_accent, width=3)
    draw.line([(6, height - 7 - n), (6, height - 7), (6 + n, height - 7)], fill=c_accent, width=3)
    draw.line([(width - 7 - n, height - 7), (width - 7, height - 7), (width - 7, height - 7 - n)], fill=c_accent, width=3)

    # Bottom badge
    display_text = (text[:45] + "...") if len(text) > 48 else text
    draw.rectangle([20, height - 44, width - 20, height - 16], fill=(10, 12, 18))
    draw.rectangle([20, height - 44, width - 20, height - 16], outline=c_accent, width=1)
    
    try:
        font = ImageFont.load_default()
    except Exception:
        font = None

    draw.text((28, height - 37), display_text, fill=(220, 230, 255), font=font)
    draw.text((width - 150, height - 37), "AI STORY STUDIO", fill=c_accent, font=font)

    return img


def generate_default_placeholders():
    """Generates placeholder_1.webp to placeholder_25.webp in both local_media and frontend/public."""
    print("[1/3] Generating default placeholder assets...", flush=True)
    for idx in range(1, 26):
        img = create_artistic_panel(f"Scene Panel #{idx}", width=800, height=600, color_scheme=idx)
        p1 = os.path.join(LOCAL_MEDIA_DIR, f"placeholder_{idx}.webp")
        img.save(p1, "WEBP", quality=80)
        p2 = os.path.join(PUBLIC_DIR, f"placeholder_{idx}.webp")
        img.save(p2, "WEBP", quality=80)
    print(f"Generated 25 placeholder assets in local_media and public!", flush=True)


def repair_database_panels():
    """Finds all panels in SQLite with placeholder or nonexistent URLs and replaces them."""
    print("[2/3] Checking SQLite database for placeholder panels...", flush=True)
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}", flush=True)
        return

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    c.execute("SELECT id, chapter_id, panel_index, image_url, narrative, speech_text FROM panels")
    all_panels = c.fetchall()

    repaired_count = 0
    for p_id, ch_id, p_idx, img_url, narr, speech in all_panels:
        needs_repair = False
        
        if not img_url:
            needs_repair = True
        elif "/placeholder_" in img_url:
            needs_repair = True
        elif img_url.startswith("/media/"):
            filename = img_url.replace("/media/", "")
            target_path = os.path.join(LOCAL_MEDIA_DIR, filename)
            if not os.path.exists(target_path):
                needs_repair = True

        if needs_repair:
            text_label = speech or narr or f"Scene {p_idx + 1}"
            img = create_artistic_panel(text_label, width=800, height=600, color_scheme=p_idx)
            new_filename = f"gen_panel_{uuid.uuid4().hex[:10]}.webp"
            new_path = os.path.join(LOCAL_MEDIA_DIR, new_filename)
            img.save(new_path, "WEBP", quality=80)
            
            new_url = f"/media/{new_filename}"
            c.execute("UPDATE panels SET image_url = ? WHERE id = ?", (new_url, p_id))
            repaired_count += 1

    conn.commit()
    conn.close()
    print(f"[3/3] Successfully repaired and generated artwork for {repaired_count} panels in {DB_PATH}!", flush=True)


if __name__ == "__main__":
    generate_default_placeholders()
    repair_database_panels()
