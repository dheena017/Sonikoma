import os
import re
from pathlib import Path

VIDEO_EDITOR_DIR = Path(r"c:\Users\dheen\project\Sonikoma\frontend\src\features\editor_video")

# Exact replacements (case-insensitive for hex) and regex replacements
HEX_REPLACEMENTS = [
    # Deep background hexes -> #121212 or #18181B
    (r'#0C0C16', '#121212'),
    (r'#07060F', '#09090B'),
    (r'#100F20', '#121212'),
    (r'#0C0D1B', '#121212'),
    (r'#0A0A10', '#121212'),
    (r'#090912', '#121212'),
    (r'#0C0D18', '#121212'),
    (r'#0C0C14', '#121212'),
    (r'#0C0D12', '#121212'),
    (r'#121218', '#121212'),
    (r'#06060C', '#09090B'),
    (r'#0E0E16', '#18181B'),
    (r'#0D0D14', '#18181B'),
    (r'#0F0F1C', '#18181B'),
    (r'#0D0B14', '#18181B'),
    (r'#090914', '#18181B'),
    (r'#0E0F1E', '#18181B'),
    (r'#201833', '#121212'),

    # Surface / border hexes -> #2A2A2A or #1E1E1E or #2F2F2F
    (r'#282A32', '#2A2A2A'),
    (r'#202127', '#2A2A2A'),
    (r'#18181C', '#18181B'),
    (r'#33353E', '#2A2A2A'),
    (r'#4B4E5C', '#2F2F2F'),
    (r'#18191E', '#18181B'),
    (r'#12121E', '#121212'),
    (r'#14141C', '#18181B'),
    (r'#1E1E24', '#1E1E1E'),
    (r'#2B2D35', '#2A2A2A'),
    (r'#24252C', '#1E1E1E'),

    # Purple/violet accents -> #3B82F6 / #60A5FA
    (r'#8B5CF6', '#3B82F6'),
    (r'#7C3AED', '#3B82F6'),
    (r'#D8B4FE', '#93C5FD'),
    (r'#6B21A8', '#2563EB'),
    (r'#E9D5FF', '#93C5FD'),
]

TAILWIND_REPLACEMENTS = [
    # Violet tokens
    (r'\bviolet-900\b', 'neutral-900'),
    (r'\bviolet-500\b', 'blue-500'),
    (r'\bviolet-400\b', '[#60A5FA]'),
    (r'\bviolet-300\b', '[#60A5FA]'),
    (r'\bviolet-200\b', 'neutral-200'),
    (r'\bviolet-100\b', 'white'),

    # Fuchsia tokens
    (r'\bfuchsia-900\b', 'neutral-900'),
    (r'\bfuchsia-500\b', 'blue-500'),
    (r'\bfuchsia-400\b', '[#60A5FA]'),
    (r'\bfuchsia-300\b', '[#60A5FA]'),
    (r'\bfuchsia-200\b', 'neutral-200'),
    (r'\bfuchsia-100\b', 'white'),

    # Cyan tokens (non-functional)
    (r'\bcyan-950\b', 'neutral-900'),
    (r'\bcyan-900\b', 'neutral-900'),
    (r'\bcyan-600\b', '[#3B82F6]'),
    (r'\bcyan-500\b', '[#3B82F6]'),
    (r'\bcyan-400\b', '[#60A5FA]'),
    (r'\bcyan-300\b', '[#60A5FA]'),
    (r'\bcyan-200\b', 'neutral-200'),
    (r'\bcyan-100\b', 'white'),

    # Residual Indigo tokens
    (r'\bindigo-950\b', 'neutral-900'),
    (r'\bindigo-900\b', 'neutral-900'),
    (r'\bindigo-600\b', '[#3B82F6]'),
    (r'\bindigo-500\b', '[#3B82F6]'),
    (r'\bindigo-400\b', '[#60A5FA]'),
    (r'\bindigo-300\b', 'neutral-300'),
    (r'\bindigo-200\b', 'neutral-200'),
    (r'\bindigo-100\b', 'white'),

    # Non-standard dark gradients
    (r'to-slate-950', 'to-[#121212]'),
]

def purge_deep_colors():
    modified_files = 0
    for root, _, files in os.walk(VIDEO_EDITOR_DIR):
        for file in files:
            if file.endswith(('.tsx', '.ts', '.css')):
                path = Path(root) / file
                try:
                    content = path.read_text(encoding="utf-8")
                    new_content = content

                    # Replace hexes case-insensitively
                    for old_hex, new_hex in HEX_REPLACEMENTS:
                        pattern = re.compile(re.escape(old_hex), re.IGNORECASE)
                        new_content = pattern.sub(new_hex, new_content)

                    # Replace tailwind patterns
                    for pattern_str, rep in TAILWIND_REPLACEMENTS:
                        new_content = re.sub(pattern_str, rep, new_content)

                    if new_content != content:
                        path.write_text(new_content, encoding="utf-8")
                        modified_files += 1
                        print(f"Deep purged theme in: {path.relative_to(VIDEO_EDITOR_DIR)}")
                except Exception as e:
                    print(f"Error processing {path}: {e}")

    print(f"\nFinished deep purging legacy colors across {modified_files} Video Editor files.")

if __name__ == "__main__":
    purge_deep_colors()
