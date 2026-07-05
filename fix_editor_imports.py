import os
import re

def replace_in_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    original_content = content
    content = re.sub(r'import\s+(.*?)\s+from\s+"../scraper/(.*?)";', r'import \1 from "../../scraper/\2";', content)
    content = re.sub(r'import\s+(.*?)\s+from\s+"../video/(.*?)";', r'import \1 from "../../video/\2";', content)
    content = re.sub(r'import\s+(.*?)\s+from\s+"../timeline/(.*?)";', r'import \1 from "../../timeline/\2";', content)
    content = re.sub(r'import\s+(.*?)\s+from\s+"../audio_lab/(.*?)";', r'import \1 from "../../audio_lab/\2";', content)
    content = re.sub(r'import\s+(.*?)\s+from\s+"../voice/(.*?)";', r'import \1 from "../../voice/\2";', content)
    content = re.sub(r'import\s+(.*?)\s+from\s+"../characters/(.*?)";', r'import \1 from "../../characters/\2";', content)
    content = re.sub(r'import\s+(.*?)\s+from\s+"../youtube/(.*?)";', r'import \1 from "../../youtube/\2";', content)
    content = re.sub(r'import\s+(.*?)\s+from\s+"../thumbnails/(.*?)";', r'import \1 from "../../thumbnails/\2";', content)
    content = re.sub(r'import\s+(.*?)\s+from\s+"../pipeline/(.*?)";', r'import \1 from "../../pipeline/\2";', content)
    content = re.sub(r'import\s+(.*?)\s+from\s+"../processing/(.*?)";', r'import \1 from "../../processing/\2";', content)

    # Internal editor components
    content = re.sub(r'import\s+(.*?)\s+from\s+"./EditorSidebar";', r'import \1 from "../EditorSidebar";', content)


    if content != original_content:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Updated {filepath}")

replace_in_file('frontend/src/components/Feature/editor/Layout/EditorPage.tsx')
