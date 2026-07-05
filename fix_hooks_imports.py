import os
import re

def replace_in_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    original_content = content
    content = re.sub(r'import\s+(.*?)\s+from\s+"../../../hooks/(.*?)";', r'import \1 from "../../../../hooks/\2";', content)
    content = re.sub(r'import\s+(.*?)\s+from\s+"../../../api/(.*?)";', r'import \1 from "../../../../api/\2";', content)
    content = re.sub(r'import\s+(.*?)\s+from\s+"../../../utils/(.*?)";', r'import \1 from "../../../../utils/\2";', content)

    if content != original_content:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Updated {filepath}")

replace_in_file('frontend/src/components/Feature/editor/Layout/EditorPage.tsx')
