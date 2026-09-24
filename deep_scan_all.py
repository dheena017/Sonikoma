import os, re, sys

# All patterns that indicate actual HTTP route usage (not TS module aliases)
patterns = [
    # Fetch/axios/http calls
    re.compile(r"""(?:fetch|axios|\.get|\.post|\.put|\.delete|\.patch|http\.get|requests\.(get|post|put|delete|patch))\s*\(['"` ]*/api/(?!v1/)"""),
    # String-assigned URLs  
    re.compile(r"""(?:url|endpoint|path|route|href|src|action)\s*[=:]\s*['"` ]*/api/(?!v1/)"""),
    # Template literals with /api/
    re.compile(r"""`[^`]*/api/(?!v1/)[\w\-/{}:?&=%]+"""),
    # Direct string /api/ references (quotes)
    re.compile(r"""['"]/api/(?!v1/)[\w\-/{}:?&=%]{3,}['"?]"""),
    # Python decorator routes  
    re.compile(r"""@(?:router|app)\.(get|post|put|delete|patch)\s*\(\s*['"]/api/(?!v1/)"""),
    # include_router with prefix
    re.compile(r"""prefix\s*=\s*['"]/api/(?!v1/)"""),
    # Proxy target config
    re.compile(r"""['"]/api/(?!v1/)[\w\-/]+['"].*(?:target|proxy|rewrite)"""),
]

skip_dirs = ['node_modules', '__pycache__', '.git', 'dist', '.venv', '.next', 'build', 'coverage', '.llm-chat-history', 'editHistory', '.pytest_cache']
skip_files = ['.pyc', '.pyo', '.map', '.lock', '.sum']

ALL_EXT = (
    '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
    '.py', '.html', '.htm',
    '.yaml', '.yml', '.json', '.env', '.env.local', '.env.production', '.env.development',
    '.toml', '.cfg', '.ini', '.conf', '.nginx',
    '.sh', '.bash', '.zsh', '.ps1',
    '.md', '.txt', '.rst',
)

sys.stdout.reconfigure(encoding='utf-8')

all_matches = {}  # path -> [(line_no, pattern_name, line)]

for root, dirs, files in os.walk('.'):
    dirs[:] = [d for d in dirs if not any(s in os.path.join(root, d) for s in skip_dirs)]
    for file in files:
        if any(file.endswith(s) for s in skip_files):
            continue
        if not any(file.endswith(ext) or ('.' not in file) for ext in ALL_EXT):
            continue
        path = os.path.join(root, file)
        try:
            with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                lines = f.readlines()
            for idx, line in enumerate(lines, 1):
                stripped = line.strip()
                # Skip pure import/from lines (TS module aliases like @/api/...)  
                if stripped.startswith('import ') or stripped.startswith('from ') or stripped.startswith('* from'):
                    if '/api/v1' not in stripped and re.search(r'from\s+["\']@?/api/', stripped):
                        continue
                for pat in patterns:
                    m = pat.search(line)
                    if m:
                        if path not in all_matches:
                            all_matches[path] = []
                        all_matches[path].append((idx, m.group(0).strip(), stripped))
                        break
        except Exception as e:
            pass

total = sum(len(v) for v in all_matches.values())
print(f"\n{'='*80}")
print(f"DEEP SCAN COMPLETE — {total} potential legacy /api/ HTTP usages in {len(all_matches)} files")
print(f"{'='*80}\n")

for path in sorted(all_matches.keys()):
    hits = all_matches[path]
    print(f"\n📄 {path}  ({len(hits)} hits)")
    for line_no, matched, line in hits:
        print(f"   L{line_no:>4}: {line[:110]}")
