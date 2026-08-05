import os
import json
import numpy as np
from PIL import Image, ImageDraw

def generate_webtoon_benchmark_dataset(base_dir: str):
    """
    Generates synthetic Webtoon benchmark test cases with ground-truth panels.json.
    """
    sample_dir = os.path.join(base_dir, "sample_chapter")
    os.makedirs(sample_dir, exist_ok=True)
    
    # 1. Sample 4-panel strip (800x1700)
    width = 800
    panel_height = 300
    gutter_height = 100
    num_panels = 4
    total_height = num_panels * panel_height + (num_panels + 1) * gutter_height
    img = Image.new("RGB", (width, total_height), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)

    gt_panels = []
    for i in range(num_panels):
        top_y = gutter_height + i * (panel_height + gutter_height)
        bottom_y = top_y + panel_height
        left_x = 50
        right_x = width - 50
        draw.rectangle([left_x, top_y, right_x, bottom_y], outline=(0, 0, 0), fill=(180, 180, 200), width=3)
        draw.ellipse([left_x + 30, top_y + 30, right_x - 30, bottom_y - 30], fill=(50, 100, 150))
        gt_panels.append({
            "id": i + 1,
            "x": left_x,
            "y": top_y,
            "w": right_x - left_x,
            "h": bottom_y - top_y
        })

    img_path = os.path.join(sample_dir, "merged.png")
    json_path = os.path.join(sample_dir, "panels.json")
    img.save(img_path)
    with open(json_path, "w") as f:
        json.dump(gt_panels, f, indent=2)

    print(f"Generated benchmark dataset at {sample_dir}")

if __name__ == "__main__":
    base = os.path.dirname(os.path.abspath(__file__))
    generate_webtoon_benchmark_dataset(base)
