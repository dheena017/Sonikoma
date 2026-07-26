import os

files_to_fix = [
    "backend/app/services/project/project_service.py",
    "backend/app/services/project/asset_service.py",
    "backend/app/services/scraper/cache.py",
    "backend/app/services/image/stitch_cache_service.py",
    "backend/app/services/auth/auth_service.py",
    "backend/app/services/audio/audio.py"
]

for filepath in files_to_fix:
    with open(filepath, 'r') as f:
        content = f.read()

    # Simple heuristic to extract the docstring added at the end
    if '"""' in content:
        parts = content.rsplit('"""', 2)
        if len(parts) >= 3:
            docstring = parts[1].strip()
            rest_of_code = parts[0].strip()

            new_content = f'"""\n{docstring}\n"""\n\n{rest_of_code}\n'

            with open(filepath, 'w') as f:
                f.write(new_content)
