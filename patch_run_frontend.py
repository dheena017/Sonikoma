import re

with open("scripts/run-frontend.js", "r") as f:
    content = f.read()

new_content = content.replace('    ? path.resolve(__dirname, "../.venv/Scripts/python.exe")\n    : "python3";', '    ? path.resolve(__dirname, "../.venv/Scripts/python.exe")\n    : path.resolve(__dirname, "../.venv/bin/python");')

with open("scripts/run-frontend.js", "w") as f:
    f.write(new_content)
