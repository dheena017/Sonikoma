import os
import re
from pathlib import Path

SRC_DIR = Path(r"c:\Users\dheen\project\Sonikoma\frontend\src")

def update_global_css():
    # 1. Update theme.css
    theme_css_path = SRC_DIR / "styles" / "theme.css"
    content = theme_css_path.read_text(encoding="utf-8")
    
    # Make sure all buttons default to Dark Gray & Gunmetal
    # And on hover shift to Accent Purple (#A855F7)
    content = re.sub(r"\s*--color-accent-cyan:\s*#[a-fA-F0-9]+;", "", content)
    content = re.sub(r"\s*--color-accent-magenta:\s*#[a-fA-F0-9]+;", "", content)
    content = re.sub(r"--theme-primary:\s*[^;]+;", "--theme-primary: 30, 30, 30;", content)
    
    # Text gradients
    content = re.sub(r"linear-gradient\(135deg,\s*#3B82F6\s*0%,\s*#A855F7\s*50%,\s*#00FFFF\s*100%\)", "linear-gradient(135deg, #3B82F6 0%, #A855F7 100%)", content)
    content = re.sub(r"linear-gradient\(135deg,\s*#3B82F6\s*0%,\s*#00FFFF\s*100%\)", "linear-gradient(135deg, #3B82F6 0%, #A855F7 100%)", content)

    # Primary Button
    content = re.sub(
        r"\.btn-primary,\s*\nbutton\.btn-primary\s*\{[^}]+?\}",
        """.btn-primary,
button.btn-primary {
  background-color: #1E1E1E !important;
  color: #FFFFFF !important;
  border: 1px solid #2F2F2F !important;
  border-radius: 0.75rem !important;
  font-weight: 700 !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25) !important;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
  cursor: pointer !important;
}""",
        content
    )
    content = re.sub(
        r"\.btn-primary:hover,\s*\nbutton\.btn-primary:hover\s*\{[^}]+?\}",
        """.btn-primary:hover,
button.btn-primary:hover {
  background-color: #A855F7 !important;
  border-color: #C084FC !important;
  color: #FFFFFF !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 8px 20px rgba(168, 85, 247, 0.45) !important;
  filter: none !important;
}""",
        content
    )

    # Secondary button
    content = re.sub(
        r"\.btn-secondary,\s*\nbutton\.btn-secondary\s*\{[^}]+?\}",
        """.btn-secondary,
button.btn-secondary {
  background-color: #2A2A2A !important;
  color: #E5E5E5 !important;
  border: 1px solid #2F2F2F !important;
  border-radius: 0.75rem !important;
  font-weight: 600 !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2) !important;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
  cursor: pointer !important;
}""",
        content
    )
    content = re.sub(
        r"\.btn-secondary:hover,\s*\nbutton\.btn-secondary:hover\s*\{[^}]+?\}",
        """.btn-secondary:hover,
button.btn-secondary:hover {
  background-color: #2E2E2E !important;
  border-color: #A855F7 !important;
  color: #FFFFFF !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 6px 16px rgba(168, 85, 247, 0.35) !important;
}""",
        content
    )

    theme_css_path.write_text(content, encoding="utf-8")
    print(f"Updated {theme_css_path}")

    # 2. Update components.css universal button hover
    comp_css_path = SRC_DIR / "styles" / "components.css"
    comp_content = comp_css_path.read_text(encoding="utf-8")
    comp_content = re.sub(
        r"button:not\(:disabled\):not\(\.no-hover-lift\):not\(\[data-no-transform\]\):hover,\s*\n\[role=\"button\"\]:not\(\[aria-disabled=\"true\"\]\):not\(\.no-hover-lift\):not\(\s*\[data-no-transform\]\s*\):hover,\s*\n\.btn:not\(:disabled\):not\(\.no-hover-lift\):not\(\[data-no-transform\]\):hover\s*\{[^}]+?\}",
        """button:not(:disabled):not(.no-hover-lift):not([data-no-transform]):hover,
[role="button"]:not([aria-disabled="true"]):not(.no-hover-lift):not(
    [data-no-transform]
  ):hover,
.btn:not(:disabled):not(.no-hover-lift):not([data-no-transform]):hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 18px -2px rgba(168, 85, 247, 0.45);
  border-color: #A855F7 !important;
}""",
        comp_content
    )
    comp_css_path.write_text(comp_content, encoding="utf-8")
    print(f"Updated {comp_css_path}")

    # 3. Update dark-mode.css
    dm_path = SRC_DIR / "styles" / "dark-mode.css"
    dm_content = dm_path.read_text(encoding="utf-8")
    dm_content = dm_content.replace("#00FFFF", "#3B82F6")
    dm_content = dm_content.replace("#FF00FF", "#A855F7")
    dm_content = re.sub(
        r"::-webkit-scrollbar-thumb:hover\s*\{[^}]+?\}",
        "::-webkit-scrollbar-thumb:hover {\n  background: #A855F7 !important;\n}",
        dm_content
    )
    dm_path.write_text(dm_content, encoding="utf-8")
    print(f"Updated {dm_path}")

    # 4. Update glass-surfaces.css
    glass_path = SRC_DIR / "styles" / "animations" / "glass-surfaces.css"
    if glass_path.exists():
        glass_content = glass_path.read_text(encoding="utf-8")
        glass_content = glass_content.replace("border-color: #3B82F6 !important; /* Electric Blue hover accent */", "border-color: #A855F7 !important; /* Accent Purple hover */")
        glass_content = glass_content.replace("#00FFFF", "#3B82F6")
        glass_path.write_text(glass_content, encoding="utf-8")
        print(f"Updated {glass_path}")

    # 5. Update loading.css
    loading_path = SRC_DIR / "styles" / "animations" / "loading.css"
    if loading_path.exists():
        l_content = loading_path.read_text(encoding="utf-8")
        l_content = l_content.replace("rgba(0, 255, 255, 0.95)", "rgba(168, 85, 247, 0.95)")
        l_content = l_content.replace("#00FFFF", "#3B82F6")
        loading_path.write_text(l_content, encoding="utf-8")
        print(f"Updated {loading_path}")

def update_all_pages_and_components():
    extensions = {".tsx", ".ts", ".jsx", ".js", ".css"}
    
    # Systematic Tailwind / class / color replacements
    # 1. Cyan replacements -> Electric Blue or Accent Purple
    tailwind_replacements = [
        # Direct hex values
        ("rgba(0, 255, 255,", "rgba(168, 85, 247,"),
        ("rgba(0,255,255,", "rgba(168, 85, 247,"),
        ("#00FFFF", "#3B82F6"),
        ("#00ffff", "#3B82F6"),
        ("#FF00FF", "#A855F7"),
        ("#ff00ff", "#A855F7"),

        # Gradient endpoints with cyan -> purple
        ("to-cyan-400", "to-purple-400"),
        ("to-cyan-500", "to-purple-500"),
        ("to-cyan-600", "to-purple-600"),
        ("to-cyan-700", "to-purple-700"),
        ("via-cyan-400", "via-purple-400"),
        ("via-cyan-500", "via-purple-500"),
        ("from-cyan-400", "from-blue-400"),
        ("from-cyan-500", "from-blue-500"),

        # Hover states targeting cyan -> target accent purple
        ("hover:text-cyan-400", "hover:text-purple-400"),
        ("hover:text-cyan-300", "hover:text-purple-300"),
        ("hover:text-cyan-500", "hover:text-purple-400"),
        ("hover:border-cyan-400", "hover:border-purple-500"),
        ("hover:border-cyan-500", "hover:border-purple-500"),
        ("hover:bg-cyan-500", "hover:bg-purple-600"),
        ("group-hover:text-cyan-400", "group-hover:text-purple-400"),
        ("group-hover:text-cyan-300", "group-hover:text-purple-300"),

        # General cyan text / border / bg elements
        ("text-cyan-400", "text-blue-400"),
        ("text-cyan-300", "text-blue-300"),
        ("text-cyan-500", "text-blue-500"),
        ("border-cyan-500/30", "border-blue-500/30"),
        ("border-cyan-500/20", "border-blue-500/20"),
        ("border-cyan-500/25", "border-blue-500/25"),
        ("border-cyan-500", "border-blue-500"),
        ("border-cyan-400", "border-blue-400"),
        ("bg-cyan-500/10", "bg-blue-500/10"),
        ("bg-cyan-500/20", "bg-blue-500/20"),
        ("bg-cyan-500", "bg-blue-500"),
        ("bg-cyan-400", "bg-blue-400"),

        # Highlight Magenta replacements
        ("text-magenta-400", "text-purple-400"),
        ("border-magenta-500", "border-purple-500"),
        ("bg-magenta-500", "bg-purple-600"),
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
            for old, new in tailwind_replacements:
                if old in content:
                    content = content.replace(old, new)
                    changed = True

            if changed:
                p.write_text(content, encoding="utf-8")
                modified_count += 1
                print(f"Updated: {p.relative_to(SRC_DIR)}")

    print(f"Batch processed all pages. Total files updated: {modified_count}")

if __name__ == "__main__":
    update_global_css()
    update_all_pages_and_components()
