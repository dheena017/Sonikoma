import os
import re
from pathlib import Path

SRC_DIR = Path(r"c:\Users\dheen\project\Sonikoma\frontend\src")

PURPLE_PATTERNS = [
    # Tailwinds purple background classes
    (r'\bbg-purple-[0-9]+(\/[0-9]+)?\b', 'bg-[#2A2A2A]'),
    (r'\bhover:bg-purple-[0-9]+(\/[0-9]+)?\b', 'hover:bg-[#333333]'),
    (r'\bfrom-purple-[0-9]+(\/[0-9]+)?\b', 'from-[#2A2A2A]'),
    (r'\bvia-purple-[0-9]+(\/[0-9]+)?\b', 'via-[#2A2A2A]'),
    (r'\bto-purple-[0-9]+(\/[0-9]+)?\b', 'to-[#2A2A2A]'),
    (r'\btext-purple-[0-9]+(\/[0-9]+)?\b', 'text-[#3B82F6]'),
    (r'\bhover:text-purple-[0-9]+(\/[0-9]+)?\b', 'hover:text-[#60A5FA]'),
    (r'\bborder-purple-[0-9]+(\/[0-9]+)?\b', 'border-[#2F2F2F]'),
    (r'\bhover:border-purple-[0-9]+(\/[0-9]+)?\b', 'hover:border-[#3B82F6]'),
    (r'\bshadow-purple-[0-9]+(\/[0-9]+)?\b', 'shadow-black/50'),
    (r'\bring-purple-[0-9]+(\/[0-9]+)?\b', 'ring-[#3B82F6]/50'),
    
    # Tailwinds indigo / violet residual classes if used as purple substitutes
    (r'\bbg-indigo-950(\/[0-9]+)?\b', 'bg-[#2A2A2A]'),
    (r'\bhover:bg-indigo-900(\/[0-9]+)?\b', 'hover:bg-[#333333]'),
    (r'\btext-indigo-300\b', 'text-neutral-300'),
    (r'\bhover:text-indigo-200\b', 'hover:text-white'),
    (r'\bborder-indigo-500(\/[0-9]+)?\b', 'border-[#2F2F2F]'),
]

def purge_purple_all():
    modified_files = 0
    for root, dirs, files in os.walk(SRC_DIR):
        for file in files:
            if file.endswith(('.tsx', '.ts', '.css')):
                file_path = Path(root) / file
                try:
                    content = file_path.read_text(encoding="utf-8")
                    new_content = content
                    for pattern, replacement in PURPLE_PATTERNS:
                        new_content = re.sub(pattern, replacement, new_content)
                    
                    if new_content != content:
                        file_path.write_text(new_content, encoding="utf-8")
                        modified_files += 1
                except Exception as e:
                    print(f"Error processing {file_path}: {e}")
                    
    print(f"Purged purple tokens across {modified_files} files.")

if __name__ == "__main__":
    purge_purple_all()
