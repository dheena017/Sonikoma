import os
import re
from pathlib import Path

SRC_DIR = Path(r"c:\Users\dheen\project\Sonikoma\frontend\src")

def update_components():
    # 1. Update ActiveProjectSelectorDrawer filter tabs:
    drawer_path = SRC_DIR / "components" / "layout" / "ActiveProjectSelectorDrawer.tsx"
    if drawer_path.exists():
        c = drawer_path.read_text(encoding="utf-8")
        c = c.replace(
            'activeTab === tab.id\n                    ? "bg-[#2A2A2A] text-white border border-[#3B82F6]  font-bold hover:bg-[#3B82F6]"\n                    : "text-[#9CA3AF] bg-[#121212] border border-[#2F2F2F] hover:text-white hover:border-[#3B82F6] hover:bg-[#2A2A2A]"',
            'activeTab === tab.id\n                    ? "bg-[#3B82F6] text-white border border-[#60A5FA]/40 font-bold"\n                    : "text-[#9CA3AF] bg-[#121212] border border-[#2F2F2F] hover:text-white hover:border-[#3B82F6] hover:bg-[#2A2A2A]"'
        )
        drawer_path.write_text(c, encoding="utf-8")
        print("Updated ActiveProjectSelectorDrawer.tsx")

    # 2. Update AISmartRoutingDrawer filter tabs:
    ai_drawer_path = SRC_DIR / "features" / "ai_core" / "components" / "AISmartRoutingDrawer.tsx"
    if ai_drawer_path.exists():
        c = ai_drawer_path.read_text(encoding="utf-8")
        c = c.replace(
            'isSelected\n                            ? "bg-[#2A2A2A] text-white border border-[#3B82F6] font-bold hover:bg-[#3B82F6]"\n                            : "text-neutral-400 bg-[#121212] border border-[#2F2F2F] hover:text-white hover:border-[#3B82F6] hover:bg-[#2A2A2A]"',
            'isSelected\n                            ? "bg-[#3B82F6] text-white border border-[#60A5FA]/40 font-bold"\n                            : "text-neutral-400 bg-[#121212] border border-[#2F2F2F] hover:text-white hover:border-[#3B82F6] hover:bg-[#2A2A2A]"'
        )
        ai_drawer_path.write_text(c, encoding="utf-8")
        print("Updated AISmartRoutingDrawer.tsx")

    # 3. Update ChapterScraperPanel mode selector tabs:
    scraper_panel_path = SRC_DIR / "features" / "workspace_scraper" / "components" / "ChapterScraperPanel.tsx"
    if scraper_panel_path.exists():
        c = scraper_panel_path.read_text(encoding="utf-8")
        c = c.replace(
            'inputMode === "url"\n                    ? "bg-[#2A2A2A] text-white border border-[#3B82F6]  hover:bg-[#3B82F6]"\n                    : "text-neutral-400 hover:text-white hover:bg-[#1E1E1E] hover:border-[#3B82F6]/50 border border-transparent"',
            'inputMode === "url"\n                    ? "bg-[#3B82F6] text-white border border-[#60A5FA]/40 font-bold"\n                    : "text-neutral-400 hover:text-white hover:bg-[#1E1E1E] hover:border-[#3B82F6] border border-[#2F2F2F]"'
        )
        c = c.replace(
            'inputMode === "upload"\n                    ? "bg-[#2A2A2A] text-white border border-[#3B82F6]  hover:bg-[#3B82F6]"\n                    : "text-neutral-400 hover:text-white hover:bg-[#1E1E1E] hover:border-[#3B82F6]/50 border border-transparent"',
            'inputMode === "upload"\n                    ? "bg-[#3B82F6] text-white border border-[#60A5FA]/40 font-bold"\n                    : "text-neutral-400 hover:text-white hover:bg-[#1E1E1E] hover:border-[#3B82F6] border border-[#2F2F2F]"'
        )
        # also update icon inside active tab to white
        c = re.sub(
            r'<Book className="w-4 h-4 text-\[#3B82F6\]" />',
            '<Book className={`w-4 h-4 ${inputMode === "url" ? "text-white" : "text-[#3B82F6]"}`} />',
            c
        )
        c = re.sub(
            r'<UploadCloud className="w-4 h-4 text-\[#3B82F6\]" />',
            '<UploadCloud className={`w-4 h-4 ${inputMode === "upload" ? "text-white" : "text-[#3B82F6]"}`} />',
            c
        )
        scraper_panel_path.write_text(c, encoding="utf-8")
        print("Updated ChapterScraperPanel.tsx")

    # 4. Update MainSidebar navigation items:
    sidebar_path = SRC_DIR / "components" / "layout" / "MainSidebar.tsx"
    if sidebar_path.exists():
        c = sidebar_path.read_text(encoding="utf-8")
        # replace active state in main navigation link
        c = c.replace(
            'item.active\n                            ? "text-white bg-[#2A2A2A] border border-[#3B82F6]/60 hover:border-[#3B82F6]"\n                            : "text-neutral-400 bg-transparent hover:text-white hover:bg-[#1E1E1E] hover:border-[#3B82F6]/40 border border-transparent"',
            'item.active\n                            ? "text-white bg-[#3B82F6] border border-[#60A5FA]/40 shadow-sm"\n                            : "text-neutral-400 bg-transparent hover:text-white hover:bg-[#1E1E1E] hover:border-[#3B82F6] border border-transparent"'
        )
        # when active, icon and text should both be pure white
        c = c.replace(
            'item.active\n                                ? "text-[#3B82F6] group-hover:text-[#3B82F6]"\n                                : "text-neutral-400 group-hover:text-[#3B82F6]"',
            'item.active\n                                ? "text-white"\n                                : "text-neutral-400 group-hover:text-[#3B82F6]"'
        )
        sidebar_path.write_text(c, encoding="utf-8")
        print("Updated MainSidebar.tsx")

    # 5. Update EditorSidebar.tsx
    editor_sb_path = SRC_DIR / "features" / "editor_studio" / "components" / "EditorSidebar.tsx"
    if editor_sb_path.exists():
        c = editor_sb_path.read_text(encoding="utf-8")
        c = re.sub(
            r'isActive\s*\?\s*"[^"]+?"\s*:\s*"text-neutral-300 hover:text-white hover:bg-neutral-900/80 border border-transparent hover:border-neutral-800/60"',
            'isActive ? "bg-[#3B82F6] text-white border border-[#60A5FA]/40 font-bold shadow-sm" : "text-neutral-400 hover:text-white hover:bg-[#1E1E1E] hover:border-[#3B82F6] border border-transparent"',
            c
        )
        c = re.sub(
            r'isActive\s*\?\s*"text-\[#3B82F6\]"\s*:\s*"group-hover:scale-110 group-hover:text-neutral-300"',
            'isActive ? "text-white" : "group-hover:scale-110 group-hover:text-[#3B82F6]"',
            c
        )
        editor_sb_path.write_text(c, encoding="utf-8")
        print("Updated EditorSidebar.tsx")

if __name__ == "__main__":
    update_components()
