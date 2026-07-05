import os
import re

def replace_in_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    original_content = content
    content = re.sub(r'import\s+(.*?)\s+from\s+"./LayoutEditorPage.js";', r'import \1 from "../LayoutEditorPage.js";', content)
    content = re.sub(r'import\s+(.*?)\s+from\s+"./LayoutEditorPage";', r'import \1 from "../LayoutEditorPage";', content)

    if content != original_content:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Updated {filepath}")

replace_in_file('frontend/src/components/Feature/editor/Layout/EditorPage.tsx')
