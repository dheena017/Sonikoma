import os, re, sys

# Matches HTTP route usage: after fetch/url= or inside strings but NOT pure import lines
http_pattern = re.compile(r"""['"` ]/api/(?!v1/)[\w\-/{}:?&=%]+""")
skip = ['node_modules', '__pycache__', '.git', 'dist', '.venv', '.next', 'build', 'coverage',
        '.llm-chat-history', 'image_cache', 'docs', 'editHistory']
ext = ('.ts', '.tsx', '.js', '.jsx', '.py', '.html', '.yaml', '.yml', '.sh')

matches = []
for root, dirs, files in os.walk('.'):
    dirs[:] = [d for d in dirs if not any(s in os.path.join(root, d) for s in skip)]
    for file in files:
        if file.endswith(ext):
            path = os.path.join(root, file)
            try:
                with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                    for idx, line in enumerate(f, 1):
                        m = http_pattern.search(line)
                        if m:
                            stripped = line.strip()
                            # Skip pure TS import/from lines (module path aliases)
                            if stripped.startswith('import ') or stripped.startswith('from '):
                                continue
                            matches.append((path, idx, m.group(0), stripped))
            except Exception:
                pass

sys.stdout.reconfigure(encoding='utf-8')
print(f'Remaining HTTP /api/ (non-v1) matches: {len(matches)}')
for path, line_no, matched, line in matches:
    print(f'  {path}:{line_no}: {line[:120]}')
