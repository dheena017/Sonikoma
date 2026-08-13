import json, sys
from collections import defaultdict

filename = sys.argv[1] if len(sys.argv) > 1 else "pyright_out.json"
start = int(sys.argv[2]) if len(sys.argv) > 2 else 0

with open(filename, "r", encoding="utf-8") as f:
    raw = f.read().strip()

idx = raw.find('{')
if idx > 0:
    raw = raw[idx:]

data = json.loads(raw)
errors = [d for d in data.get('generalDiagnostics', []) if d['severity'] == 'error']
print(f'Total errors: {len(errors)}')

by_file = defaultdict(list)
for d in errors:
    fname = d['file'].replace('\\', '/').split('/')[-1]
    line = d['range']['start']['line'] + 1
    msg = d['message'].encode('ascii', 'replace').decode('ascii')[:110]
    rule = d.get('rule', '')
    by_file[fname].append((line, rule, msg))

files_sorted = sorted(by_file.keys())
for fname in files_sorted[start:]:
    print(f"\n=== {fname} ({len(by_file[fname])} errors) ===")
    for line, rule, msg in sorted(by_file[fname]):
        print(f"  L{line} [{rule}] {msg}")
