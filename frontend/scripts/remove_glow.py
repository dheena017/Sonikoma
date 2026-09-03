import os
import re
from pathlib import Path

SRC_DIR = Path(r"c:\Users\dheen\project\Sonikoma\frontend\src")

def clean_theme_css():
    theme_path = SRC_DIR / "styles" / "theme.css"
    content = theme_path.read_text(encoding="utf-8")

    # Replace glow shadows on primary buttons with clean subtle shadows
    content = re.sub(
        r"box-shadow:\s*0\s*8px\s*20px\s*rgba\(59,\s*130,\s*246,\s*0\.45\)\s*!important;",
        "box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35) !important;",
        content
    )
    content = re.sub(
        r"box-shadow:\s*0\s*6px\s*16px\s*rgba\(59,\s*130,\s*246,\s*0\.35\)\s*!important;",
        "box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;",
        content
    )
    content = re.sub(
        r"box-shadow:\s*0\s*14px\s*32px\s*-6px\s*rgba\(59,\s*130,\s*246,\s*0\.3\)\s*!important;",
        "box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.5) !important;",
        content
    )

    theme_path.write_text(content, encoding="utf-8")
    print("Cleaned theme.css shadows.")

def clean_dark_mode_css():
    dm_path = SRC_DIR / "styles" / "dark-mode.css"
    content = dm_path.read_text(encoding="utf-8")

    # Remove glow from inputs focus and nav items
    content = re.sub(r"box-shadow:\s*0\s*0\s*0\s*2px\s*rgba\(59,\s*130,\s*246,\s*0\.25\)\s*!important;", "", content)
    content = re.sub(r"box-shadow:\s*0\s*4px\s*12px\s*rgba\(59,\s*130,\s*246,\s*0\.25\)\s*!important;", "box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25) !important;", content)

    dm_path.write_text(content, encoding="utf-8")
    print("Cleaned dark-mode.css shadows.")

def clean_components_css():
    comp_path = SRC_DIR / "styles" / "components.css"
    content = comp_path.read_text(encoding="utf-8")

    # Clean button hover shadow
    content = re.sub(
        r"box-shadow:\s*0\s*4px\s*18px\s*-2px\s*rgba\(59,\s*130,\s*246,\s*0\.45\);",
        "box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.4);",
        content
    )
    content = re.sub(
        r"box-shadow:\s*0\s*10px\s*30px\s*-5px\s*rgba\(59,\s*130,\s*246,\s*0\.5\),\s*\n\s*0\s*0\s*15px\s*rgba\(96,\s*165,\s*250,\s*0\.3\);",
        "box-shadow: 0 4px 14px -2px rgba(0, 0, 0, 0.4);",
        content
    )

    comp_path.write_text(content, encoding="utf-8")
    print("Cleaned components.css shadows.")

def clean_all_shadow_glows():
    extensions = {".tsx", ".ts", ".jsx", ".js", ".css"}
    modified = 0

    glow_patterns = [
        # Glow shadows
        (re.compile(r"shadow-\[0_0_1[0-9]px_rgba\(59,130,246,[0-9\.]+\)\]"), ""),
        (re.compile(r"shadow-\[0_0_2[0-9]px_rgba\(59,130,246,[0-9\.]+\)\]"), ""),
        (re.compile(r"shadow-\[0_0_8px_rgba\(59,130,246,[0-9\.]+\)\]"), ""),
        (re.compile(r"hover:shadow-\[0_0_1[0-9]px_rgba\(59,130,246,[0-9\.]+\)\]"), ""),
        (re.compile(r"hover:shadow-\[0_0_2[0-9]px_rgba\(59,130,246,[0-9\.]+\)\]"), ""),
        (re.compile(r"group-hover:shadow-\[0_0_1[0-9]px_rgba\(59,130,246,[0-9\.]+\)\]"), ""),
        (re.compile(r"group-hover:shadow-\[0_0_2[0-9]px_rgba\(59,130,246,[0-9\.]+\)\]"), ""),
        (re.compile(r"shadow-\[0_0_10px_#3B82F6\]"), ""),
        (re.compile(r"shadow-\[0_0_6px_#3B82F6\]"), ""),
        (re.compile(r"shadow-blue-600/[0-9]+"), "shadow-sm"),
    ]

    for root, _, files in os.walk(SRC_DIR):
        for f in files:
            p = Path(root) / f
            if p.suffix not in extensions:
                continue

            try:
                content = p.read_text(encoding="utf-8")
            except Exception:
                continue

            changed = False
            for pattern, rep in glow_patterns:
                if pattern.search(content):
                    content = pattern.sub(rep, content)
                    changed = True

            if changed:
                p.write_text(content, encoding="utf-8")
                modified += 1
                print(f"Removed glow from: {p.relative_to(SRC_DIR)}")

    print(f"Finished removing glow types across {modified} files.")

if __name__ == "__main__":
    clean_theme_css()
    clean_dark_mode_css()
    clean_components_css()
    clean_all_shadow_glows()
