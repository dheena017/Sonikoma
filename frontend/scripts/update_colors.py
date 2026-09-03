import os
import re
from pathlib import Path

SRC_DIR = Path(r"c:\Users\dheen\project\Sonikoma\frontend\src")

def update_theme_css():
    theme_css_path = SRC_DIR / "styles" / "theme.css"
    content = theme_css_path.read_text(encoding="utf-8")

    # 1. Remove Cyan and Magenta tokens
    content = re.sub(r"\s*--color-accent-cyan:\s*#00FFFF;", "", content)
    content = re.sub(r"\s*--color-accent-magenta:\s*#FF00FF;", "", content)

    # 2. Update text gradient tokens to use Electric Blue & Accent Purple only (no cyan/magenta)
    content = re.sub(
        r"linear-gradient\(135deg,\s*#3B82F6\s*0%,\s*#A855F7\s*50%,\s*#00FFFF\s*100%\)",
        "linear-gradient(135deg, #3B82F6 0%, #A855F7 100%)",
        content
    )
    content = re.sub(
        r"linear-gradient\(135deg,\s*#3B82F6\s*0%,\s*#00FFFF\s*100%\)",
        "linear-gradient(135deg, #3B82F6 0%, #A855F7 100%)",
        content
    )

    # 3. Update root primary to dark gray / gunmetal
    content = re.sub(
        r"--theme-primary:\s*59,\s*130,\s*246;[^\n]*",
        "--theme-primary: 30, 30, 30; /* Dark Gray #1E1E1E base */",
        content
    )

    # 4. Primary Button: Base is Dark Gray / Gunmetal, Hover is Accent Purple (#A855F7)
    primary_btn_pattern = re.compile(
        r"(\.btn-primary,\s*\nbutton\.btn-primary\s*\{[^}]+?\})",
        re.DOTALL
    )
    new_primary_btn = """.btn-primary,
button.btn-primary {
  background-color: #1E1E1E !important;
  color: #FFFFFF !important;
  border: 1px solid #2F2F2F !important;
  border-radius: 0.75rem !important;
  font-weight: 700 !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25) !important;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
  cursor: pointer !important;
}"""
    content = primary_btn_pattern.sub(new_primary_btn, content)

    primary_hover_pattern = re.compile(
        r"(\.btn-primary:hover,\s*\nbutton\.btn-primary:hover\s*\{[^}]+?\})",
        re.DOTALL
    )
    new_primary_hover = """.btn-primary:hover,
button.btn-primary:hover {
  background-color: #A855F7 !important;
  border-color: #C084FC !important;
  color: #FFFFFF !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 8px 20px rgba(168, 85, 247, 0.45) !important;
  filter: none !important;
}"""
    content = primary_hover_pattern.sub(new_primary_hover, content)

    # 5. Secondary Button: Base Gunmetal #2A2A2A, Hover border/glow Accent Purple
    secondary_btn_pattern = re.compile(
        r"(\.btn-secondary,\s*\nbutton\.btn-secondary\s*\{[^}]+?\})",
        re.DOTALL
    )
    new_secondary_btn = """.btn-secondary,
button.btn-secondary {
  background-color: #2A2A2A !important;
  color: #E5E5E5 !important;
  border: 1px solid #2F2F2F !important;
  border-radius: 0.75rem !important;
  font-weight: 600 !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2) !important;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
  cursor: pointer !important;
}"""
    content = secondary_btn_pattern.sub(new_secondary_btn, content)

    secondary_hover_pattern = re.compile(
        r"(\.btn-secondary:hover,\s*\nbutton\.btn-secondary:hover\s*\{[^}]+?\})",
        re.DOTALL
    )
    new_secondary_hover = """.btn-secondary:hover,
button.btn-secondary:hover {
  background-color: #2E2E2E !important;
  border-color: #A855F7 !important;
  color: #FFFFFF !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 6px 16px rgba(168, 85, 247, 0.35) !important;
}"""
    content = secondary_hover_pattern.sub(new_secondary_hover, content)

    # 6. Card interactive hover -> Accent Purple border & shadow
    card_interactive_pattern = re.compile(
        r"(\.card-interactive:hover\s*\{[^}]+?\})",
        re.DOTALL
    )
    new_card_hover = """.card-interactive:hover {
  background-color: #262626 !important;
  border-color: rgba(168, 85, 247, 0.7) !important;
  transform: translateY(-2px);
  box-shadow: 0 14px 32px -6px rgba(168, 85, 247, 0.35) !important;
}"""
    content = card_interactive_pattern.sub(new_card_hover, content)

    theme_css_path.write_text(content, encoding="utf-8")
    print(f"Updated {theme_css_path}")

def update_dark_mode_css():
    dm_path = SRC_DIR / "styles" / "dark-mode.css"
    content = dm_path.read_text(encoding="utf-8")

    # Replace comments or references to Cyan
    content = content.replace("Cyan (#00FFFF)", "Accent Purple (#A855F7)")

    # Hover on inputs -> Accent purple border
    content = re.sub(
        r"border-color:\s*rgba\(59,\s*130,\s*246,\s*0\.6\)\s*!important;",
        "border-color: rgba(168, 85, 247, 0.6) !important;",
        content
    )

    # Navigation hover -> Accent purple
    content = re.sub(
        r"border-color:\s*#3B82F6\s*!important;\s*\n\s*transition:\s*all\s*0\.15s",
        "border-color: #A855F7 !important;\n  color: #FFFFFF !important;\n  box-shadow: 0 4px 12px rgba(168, 85, 247, 0.25) !important;\n  transition: all 0.15s",
        content
    )

    # Scrollbar thumb hover -> Accent purple
    content = re.sub(
        r"::-webkit-scrollbar-thumb:hover\s*\{\s*background:\s*#3B82F6;\s*\}",
        "::-webkit-scrollbar-thumb:hover {\n  background: #A855F7;\n}",
        content
    )

    dm_path.write_text(content, encoding="utf-8")
    print(f"Updated {dm_path}")

def update_components_css():
    comp_path = SRC_DIR / "styles" / "components.css"
    content = comp_path.read_text(encoding="utf-8")

    # Universal button hover - add purple border-color
    old_hover = 'box-shadow: 0 4px 16px -4px rgba(168, 85, 247, 0.25);'
    new_hover = 'box-shadow: 0 4px 16px -4px rgba(168, 85, 247, 0.35);\n  border-color: rgba(168, 85, 247, 0.5);'
    content = content.replace(old_hover, new_hover)

    comp_path.write_text(content, encoding="utf-8")
    print(f"Updated {comp_path}")

def replace_across_codebase():
    extensions = {".tsx", ".ts", ".jsx", ".js", ".css"}
    modified_count = 0

    replacements = [
        # Gradients from Blue via Purple to Cyan -> Blue to Purple
        ("from-[#3B82F6] via-[#A855F7] to-[#00FFFF]", "from-[#3B82F6] to-[#A855F7]"),
        ("from-[#3B82F6] to-[#00FFFF]", "from-[#3B82F6] to-[#A855F7]"),
        ("via-[#A855F7] to-[#00FFFF]", "to-[#A855F7]"),

        # Hover states targeting cyan -> target accent purple
        ("group-hover:text-[#00FFFF]", "group-hover:text-[#A855F7]"),
        ("hover:text-[#00FFFF]", "hover:text-[#A855F7]"),
        ("hover:border-[#00FFFF]", "hover:border-[#A855F7]"),

        # System Cyan #00FFFF replacements
        ("#00FFFF", "#3B82F6"),
        ("#00ffff", "#3B82F6"),

        # Highlight Magenta #FF00FF replacements
        ("#FF00FF", "#A855F7"),
        ("#ff00ff", "#A855F7"),
    ]

    for root, _, files in os.walk(SRC_DIR):
        for f in files:
            p = Path(root) / f
            if p.suffix not in extensions:
                continue

            try:
                text = p.read_text(encoding="utf-8")
            except Exception:
                continue

            changed = False
            for old, new in replacements:
                if old in text:
                    text = text.replace(old, new)
                    changed = True

            if changed:
                p.write_text(text, encoding="utf-8")
                modified_count += 1
                print(f"Updated colors in: {p.relative_to(SRC_DIR)}")

    print(f"Finished. Modified {modified_count} files.")

if __name__ == "__main__":
    update_theme_css()
    update_dark_mode_css()
    update_components_css()
    replace_across_codebase()
