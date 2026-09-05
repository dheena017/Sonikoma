import os
import re
from pathlib import Path

SRC_DIR = Path(r"c:\Users\dheen\project\Sonikoma\frontend\src")

def update_theme_css():
    theme_css_path = SRC_DIR / "styles" / "theme.css"
    content = theme_css_path.read_text(encoding="utf-8")

    # Remove accent purple variable or point it to electric blue / remove
    content = re.sub(r"\s*--color-accent-purple:\s*#[a-fA-F0-9]+;", "", content)
    content = re.sub(r"--theme-secondary:\s*[^;]+;", "--theme-secondary: 59, 130, 246; /* Electric Blue #3B82F6 */", content)

    # Gradient replacements: Blue -> Purple or similar -> purely Blue / Gunmetal / Silver
    content = re.sub(
        r"linear-gradient\(135deg,\s*#3B82F6\s*0%,\s*#A855F7\s*100%\)",
        "linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)",
        content
    )

    # Primary Button: Base Gunmetal #2A2A2A (or Dark Gray #1E1E1E), Hover Electric Blue #3B82F6
    primary_btn_pattern = re.compile(
        r"\.btn-primary,\s*\nbutton\.btn-primary\s*\{[^}]+?\}",
        re.DOTALL
    )
    new_primary_btn = """.btn-primary,
button.btn-primary {
  background-color: #2A2A2A !important;
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
        r"\.btn-primary:hover,\s*\nbutton\.btn-primary:hover\s*\{[^}]+?\}",
        re.DOTALL
    )
    new_primary_hover = """.btn-primary:hover,
button.btn-primary:hover {
  background-color: #3B82F6 !important;
  border-color: #60A5FA !important;
  color: #FFFFFF !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.45) !important;
  filter: none !important;
}"""
    content = primary_hover_pattern.sub(new_primary_hover, content)

    # Secondary button: Base Gunmetal #2A2A2A, Hover border Electric Blue #3B82F6
    secondary_btn_pattern = re.compile(
        r"\.btn-secondary,\s*\nbutton\.btn-secondary\s*\{[^}]+?\}",
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
        r"\.btn-secondary:hover,\s*\nbutton\.btn-secondary:hover\s*\{[^}]+?\}",
        re.DOTALL
    )
    new_secondary_hover = """.btn-secondary:hover,
button.btn-secondary:hover {
  background-color: #333333 !important;
  border-color: #3B82F6 !important;
  color: #FFFFFF !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.35) !important;
}"""
    content = secondary_hover_pattern.sub(new_secondary_hover, content)

    # Card interactive hover: border-color #3B82F6, box-shadow blue
    card_interactive_pattern = re.compile(
        r"\.card-interactive:hover\s*\{[^}]+?\}",
        re.DOTALL
    )
    new_card_hover = """.card-interactive:hover {
  background-color: #262626 !important;
  border-color: rgba(59, 130, 246, 0.7) !important;
  transform: translateY(-2px);
  box-shadow: 0 14px 32px -6px rgba(59, 130, 246, 0.3) !important;
}"""
    content = card_interactive_pattern.sub(new_card_hover, content)

    theme_css_path.write_text(content, encoding="utf-8")
    print(f"Updated {theme_css_path}")

def update_dark_mode_css():
    dm_path = SRC_DIR / "styles" / "dark-mode.css"
    content = dm_path.read_text(encoding="utf-8")

    content = content.replace("Accent Purple (#A855F7)", "Electric Blue (#3B82F6)")
    content = content.replace("#A855F7", "#3B82F6")
    content = content.replace("#C084FC", "#60A5FA")
    content = content.replace("rgba(168, 85, 247,", "rgba(59, 130, 246,")
    content = content.replace("rgba(168,85,247,", "rgba(59,130,246,")

    dm_path.write_text(content, encoding="utf-8")
    print(f"Updated {dm_path}")

def update_components_css():
    comp_path = SRC_DIR / "styles" / "components.css"
    content = comp_path.read_text(encoding="utf-8")

    content = content.replace("rgba(168, 85, 247, 0.35)", "rgba(59, 130, 246, 0.35)")
    content = content.replace("rgba(168, 85, 247, 0.45)", "rgba(59, 130, 246, 0.45)")
    content = content.replace("rgba(168, 85, 247, 0.5)", "rgba(59, 130, 246, 0.5)")
    content = content.replace("rgba(168, 85, 247, 0.25)", "rgba(59, 130, 246, 0.25)")
    content = content.replace("#A855F7", "#3B82F6")

    # Gradient button glow
    content = re.sub(
        r"button\.bg-purple-600:not\(:disabled\):hover[^{]+?\{[^}]+?\}",
        """button.bg-blue-600:not(:disabled):hover,
button.bg-blue-500:not(:disabled):hover,
button.bg-gradient-to-r:not(:disabled):hover {
  box-shadow: 0 10px 30px -5px rgba(59, 130, 246, 0.5),
    0 0 15px rgba(96, 165, 250, 0.3);
}""",
        content
    )

    comp_path.write_text(content, encoding="utf-8")
    print(f"Updated {comp_path}")

def update_pills_and_surfaces():
    pills_path = SRC_DIR / "styles" / "pills.css"
    if pills_path.exists():
        content = pills_path.read_text(encoding="utf-8")
        content = content.replace("rgba(168, 85, 247,", "rgba(59, 130, 246,")
        content = content.replace("#c084fc", "#60a5fa")
        content = content.replace("#C084FC", "#60A5FA")
        content = content.replace("#A855F7", "#3B82F6")
        content = content.replace("#a855f7", "#3b82f6")
        pills_path.write_text(content, encoding="utf-8")
        print(f"Updated {pills_path}")

    glass_path = SRC_DIR / "styles" / "animations" / "glass-surfaces.css"
    if glass_path.exists():
        content = glass_path.read_text(encoding="utf-8")
        content = content.replace("#A855F7", "#3B82F6")
        content = content.replace("rgba(168, 85, 247,", "rgba(59, 130, 246,")
        glass_path.write_text(content, encoding="utf-8")
        print(f"Updated {glass_path}")

    loading_path = SRC_DIR / "styles" / "animations" / "loading.css"
    if loading_path.exists():
        content = loading_path.read_text(encoding="utf-8")
        content = content.replace("rgba(168, 85, 247,", "rgba(59, 130, 246,")
        content = content.replace("#A855F7", "#3B82F6")
        loading_path.write_text(content, encoding="utf-8")
        print(f"Updated {loading_path}")

    auth_path = SRC_DIR / "styles" / "animations" / "auth.css"
    if auth_path.exists():
        content = auth_path.read_text(encoding="utf-8")
        content = content.replace("rgba(168, 85, 247,", "rgba(59, 130, 246,")
        content = content.replace("#A855F7", "#3B82F6")
        auth_path.write_text(content, encoding="utf-8")
        print(f"Updated {auth_path}")

def replace_across_all_files():
    extensions = {".tsx", ".ts", ".jsx", ".js", ".css"}

    replacements = [
        # Hex values for Accent Purple
        ("#A855F7", "#3B82F6"),
        ("#a855f7", "#3b82f6"),
        ("#C084FC", "#60A5FA"),
        ("#c084fc", "#60a5fa"),
        ("#9333EA", "#2563EB"),
        ("#7E22CE", "#1D4ED8"),
        ("#581C87", "#1E3A8A"),
        
        # RGBA values
        ("rgba(168, 85, 247,", "rgba(59, 130, 246,"),
        ("rgba(168,85,247,", "rgba(59,130,246,"),
        ("rgba(192, 132, 252,", "rgba(96, 165, 250,"),
        ("rgba(147, 51, 234,", "rgba(37, 99, 235,"),

        # Tailwind gradient endpoints & hover targeting purple
        ("from-purple-600 to-indigo-600", "from-[#2A2A2A] to-[#2A2A2A] hover:border-[#3B82F6]"),
        ("from-purple-500 to-indigo-500", "from-[#3B82F6] to-[#2563EB]"),
        ("from-purple-600", "from-blue-600"),
        ("from-purple-500", "from-blue-500"),
        ("via-purple-500", "via-blue-500"),
        ("via-purple-400", "via-blue-400"),
        ("to-purple-600", "to-blue-600"),
        ("to-purple-500", "to-blue-500"),
        ("to-purple-400", "to-blue-400"),
        
        # Hover states
        ("hover:bg-purple-600", "hover:bg-[#3B82F6]"),
        ("hover:bg-purple-500", "hover:bg-[#3B82F6]"),
        ("hover:border-purple-500", "hover:border-[#3B82F6]"),
        ("hover:border-purple-400", "hover:border-[#60A5FA]"),
        ("hover:text-purple-400", "hover:text-[#60A5FA]"),
        ("hover:text-purple-300", "hover:text-[#93C5FD]"),
        ("group-hover:text-purple-400", "group-hover:text-[#60A5FA]"),
        ("group-hover:text-purple-300", "group-hover:text-[#93C5FD]"),
        ("group-hover:border-purple-500", "group-hover:border-[#3B82F6]"),

        # Purple text & borders & backgrounds
        ("text-purple-400", "text-[#3B82F6]"),
        ("text-purple-300", "text-[#60A5FA]"),
        ("text-purple-500", "text-[#3B82F6]"),
        ("bg-purple-500/10", "bg-[#3B82F6]/10"),
        ("bg-purple-500/15", "bg-[#3B82F6]/15"),
        ("bg-purple-500/20", "bg-[#3B82F6]/20"),
        ("bg-purple-900/20", "bg-neutral-900/40"),
        ("border-purple-500/20", "border-[#3B82F6]/20"),
        ("border-purple-500/30", "border-[#3B82F6]/30"),
        ("border-purple-500/40", "border-[#3B82F6]/40"),
        ("border-purple-400/40", "border-[#60A5FA]/40"),
        ("border-purple-500", "border-[#3B82F6]"),
        ("border-purple-400", "border-[#60A5FA]"),
        ("shadow-purple-600/20", "shadow-blue-600/20"),
        ("shadow-purple-600/30", "shadow-blue-600/30"),
    ]

    modified_count = 0
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
            for old, new in replacements:
                if old in content:
                    content = content.replace(old, new)
                    changed = True

            if changed:
                p.write_text(content, encoding="utf-8")
                modified_count += 1
                print(f"Purged purple from: {p.relative_to(SRC_DIR)}")

    print(f"Purged purple completely across {modified_count} files.")

if __name__ == "__main__":
    update_theme_css()
    update_dark_mode_css()
    update_components_css()
    update_pills_and_surfaces()
    replace_across_all_files()
