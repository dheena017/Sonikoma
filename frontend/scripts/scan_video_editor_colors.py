import os
import re
from pathlib import Path
from collections import Counter

VIDEO_EDITOR_DIR = Path(r"c:\Users\dheen\project\Sonikoma\frontend\src\features\editor_video")

hex_counter = Counter()
tailwind_color_counter = Counter()

HEX_REGEX = re.compile(r'#(?:[0-9a-fA-F]{3,4}){1,2}\b')
TAILWIND_COLOR_REGEX = re.compile(r'\b(?:bg|text|border|from|via|to|ring|accent)-(?:[a-z]+)-(?:[0-9]+)(?:\/[0-9]+)?\b')

for root, _, files in os.walk(VIDEO_EDITOR_DIR):
    for f in files:
        if f.endswith(('.tsx', '.ts', '.css')):
            path = Path(root) / f
            try:
                content = path.read_text(encoding='utf-8')
                for hex_match in HEX_REGEX.findall(content):
                    hex_counter[hex_match.upper()] += 1
                for tw_match in TAILWIND_COLOR_REGEX.findall(content):
                    tailwind_color_counter[tw_match] += 1
            except Exception:
                pass

print("=== HEX COLORS FOUND ===")
for hex_code, count in hex_counter.most_common():
    print(f"{hex_code}: {count}")

print("\n=== TAILWIND COLORS FOUND ===")
for tw_code, count in tailwind_color_counter.most_common():
    print(f"{tw_code}: {count}")
