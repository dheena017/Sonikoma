import re

with open("frontend/vite.config.ts", "r") as f:
    content = f.read()

# Replace hardcoded Windows path with os-aware path
new_content = content.replace('path.resolve(__dirname, "../backend/app")', 'path.resolve(__dirname, "../backend")')

with open("frontend/vite.config.ts", "w") as f:
    f.write(new_content)
