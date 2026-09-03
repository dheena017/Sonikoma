import os
import re
from pathlib import Path

VIDEO_EDITOR_DIR = Path(r"c:\Users\dheen\project\Sonikoma\frontend\src\features\editor_video")

# Additional exact replacements and regex replacements
REPLACEMENTS = [
    # 1. Dark background hexes
    (r'\bbg-\[\#06060c\]\b', 'bg-[#09090B]'),
    (r'\bbg-\[\#0c0d12\]\b', 'bg-[#121212]'),
    (r'\bbg-\[\#0c0d18\]\b', 'bg-[#121212]'),
    (r'\bbg-\[\#0c0d1b\]\b', 'bg-[#121212]'),
    (r'\bbg-\[\#0c0d20\]\b', 'bg-[#121212]'),
    (r'\bbg-\[\#090914\]\b', 'bg-[#18181B]'),
    (r'\bbg-\[\#0e0f1e\]\b', 'bg-[#18181B]'),
    (r'\bbg-\[\#0e0f17\]\b', 'bg-[#18181B]'),
    (r'\bbg-\[\#090A0F\]\b', 'bg-[#121212]'),
    (r'\bbg-\[\#0B0C10\]\b', 'bg-[#121212]'),
    (r'\bbg-\[\#05050A\]\b', 'bg-[#09090B]'),
    (r'\bbg-\[\#0a0b10\]\b', 'bg-[#121212]'),
    (r'\bbg-\[\#0d0e15\]\b', 'bg-[#18181B]'),
    (r'\bbg-\[\#0f111a\]\b', 'bg-[#18181B]'),
    (r'\bbg-\[\#10121b\]\b', 'bg-[#18181B]'),
    (r'\bbg-\[\#131520\]\b', 'bg-[#18181B]'),
    (r'\bbg-\[\#141624\]\b', 'bg-[#18181B]'),
    (r'\bbg-\[\#161826\]\b', 'bg-[#18181B]'),
    (r'rgba\(88,28,235,0\.08\)', 'rgba(59,130,246,0.04)'),

    # 2. Glowing shadow replacements
    (r'shadow-\[inset_0_0_16px_rgba\(59,130,246,0\.12\)\]', 'shadow-sm'),
    (r'shadow-\[0_0_12px_rgba\(192,132,252,0\.9\)\]', 'shadow-sm'),
    (r'shadow-\[0_8px_25px_rgba\(59,130,246,0\.2\)\]', 'shadow-md'),
    (r'shadow-\[0_0_10px_\#3B82F6\]', 'shadow-sm'),
    (r'shadow-\[0_0_6px_\#3B82F6\]', 'shadow-sm'),
    (r'shadow-\[0_0_10px_rgba\(99,102,241,0\.3\)\]', 'shadow-sm'),
    (r'shadow-\[0_0_18px_rgba\(99,102,241,0\.18\)\]', 'shadow-sm'),
    (r'shadow-\[0_0_14px_rgba\(129,140,248,0\.5\)\]', 'shadow-sm'),

    # 3. Gradients
    (r'bg-gradient-to-r from-blue-500 via-indigo-500 to-fuchsia-500', 'bg-blue-600'),
    (r'bg-gradient-to-br from-\[\#2A2A2A\] via-indigo-900 to-slate-950', 'bg-gradient-to-br from-[#2A2A2A] to-[#121212]'),

    # 4. Pink tokens
    (r'\bbg-pink-950(\/[0-9]+)?\b', 'bg-neutral-900'),
    (r'\bbg-pink-600\b', 'bg-[#3B82F6]'),
    (r'\bhover:bg-pink-500\b', 'hover:bg-[#2563EB]'),
    (r'\bbg-pink-500(\/[0-9]+)?\b', 'bg-[#3B82F6]/20'),
    (r'\bborder-pink-500(\/[0-9]+)?\b', 'border-[#3B82F6]/30'),
    (r'\bhover:border-pink-500(\/[0-9]+)?\b', 'hover:border-[#3B82F6]'),
    (r'\btext-pink-400\b', 'text-[#60A5FA]'),
    (r'\btext-pink-300\b', 'text-[#60A5FA]'),
    (r'\btext-pink-200\b', 'text-neutral-200'),
    (r'\btext-pink-100\b', 'text-white'),
    (r'\bring-pink-500(\/[0-9]+)?\b', 'ring-[#3B82F6]/50'),

    # 5. Indigo tokens
    (r'\bbg-indigo-600\b', 'bg-[#3B82F6]'),
    (r'\bhover:bg-indigo-500\b', 'hover:bg-[#2563EB]'),
    (r'\bbg-indigo-950(\/[0-9]+)?\b', 'bg-neutral-900'),
    (r'\bbg-indigo-500(\/[0-9]+)?\b', 'bg-[#3B82F6]/20'),
    (r'\bborder-indigo-500(\/[0-9]+)?\b', 'border-[#2F2F2F]'),
    (r'\bborder-indigo-400(\/[0-9]+)?\b', 'border-[#3B82F6]/40'),
    (r'\bborder-indigo-300\b', 'border-[#3B82F6]'),
    (r'\btext-indigo-400\b', 'text-[#60A5FA]'),
    (r'\btext-indigo-300\b', 'text-neutral-300'),
    (r'\btext-indigo-200\b', 'text-neutral-200'),
    (r'\bhover:text-indigo-200\b', 'hover:text-white'),
    (r'\bring-indigo-500(\/[0-9]+)?\b', 'ring-[#3B82F6]/50'),
    (r'\baccent-indigo-500\b', 'accent-[#3B82F6]'),

    # 6. Purple tokens
    (r'\baccent-purple-600\b', 'accent-[#3B82F6]'),
    (r'\bbg-purple-600\b', 'bg-[#3B82F6]'),
    (r'\bhover:bg-purple-500\b', 'hover:bg-[#2563EB]'),
    (r'\bbg-purple-950(\/[0-9]+)?\b', 'bg-neutral-900'),
    (r'\bbg-purple-[0-9]+(\/[0-9]+)?\b', 'bg-[#2A2A2A]'),
    (r'\bhover:bg-purple-[0-9]+(\/[0-9]+)?\b', 'hover:bg-[#333333]'),
    (r'\bfrom-purple-[0-9]+\b', 'from-blue-600'),
    (r'\bvia-fuchsia-[0-9]+\b', 'via-blue-600'),
    (r'\bvia-purple-[0-9]+\b', 'via-blue-600'),
    (r'\bto-indigo-[0-9]+\b', 'to-blue-600'),
    (r'\bto-purple-[0-9]+\b', 'to-blue-600'),
    (r'\btext-purple-[0-9]+\b', 'text-[#3B82F6]'),
    (r'\bhover:text-purple-[0-9]+\b', 'hover:text-[#60A5FA]'),
    (r'\bborder-purple-[0-9]+(\/[0-9]+)?\b', 'border-[#2F2F2F]'),
]

def purge_video_editor_theme():
    modified_files = 0
    for root, dirs, files in os.walk(VIDEO_EDITOR_DIR):
        for file in files:
            if file.endswith(('.tsx', '.ts', '.css')):
                file_path = Path(root) / file
                try:
                    content = file_path.read_text(encoding="utf-8")
                    new_content = content
                    for pattern, replacement in REPLACEMENTS:
                        new_content = re.sub(pattern, replacement, new_content)
                    
                    if new_content != content:
                        file_path.write_text(new_content, encoding="utf-8")
                        modified_files += 1
                        print(f"Updated theme in: {file_path.relative_to(VIDEO_EDITOR_DIR)}")
                except Exception as e:
                    print(f"Error processing {file_path}: {e}")
                    
    print(f"Finished purging legacy theme tokens across {modified_files} Video Editor files.")

if __name__ == "__main__":
    purge_video_editor_theme()
