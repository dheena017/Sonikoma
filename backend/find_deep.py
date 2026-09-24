import os
import re

pattern = re.compile(r"""['"`]/api/(?!v1/)([\w\-/{}:?&=%]+)""")

scan_dirs = ['frontend/src', 'backend/app', 'browser-extension', 'e2e']
matches = []

for sdir in scan_dirs:
    for root, dirs, files in os.walk(sdir):
        if any(x in root for x in ['node_modules', '__pycache__', '.git', 'dist', '.venv']):
            continue
        for file in files:
            if file.endswith(('.ts', '.tsx', '.js', '.jsx', '.py', '.html', '.md')):
                path = os.path.join(root, file)
                try:
                    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                        for idx, line in enumerate(f, 1):
                            m = pattern.search(line)
                            if m:
                                matches.append((path, idx, m.group(0), line.strip()))
                except Exception:
                    pass

print(f"\nTotal matches found: {len(matches)}\n")
for path, line_no, matched, line in matches:
    clean_line = line[:120].encode('ascii', errors='replace').decode('ascii')
    print(f"{path}:{line_no}: [{matched}] -> {clean_line}")
