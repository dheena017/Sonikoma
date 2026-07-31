from pathlib import Path

# Folder where this script is located
SCRIPT_DIR = Path(__file__).resolve().parent

# Backend app folder
ROOT = SCRIPT_DIR / "app"

OUTPUT = SCRIPT_DIR / "backend_tree.txt"

IGNORE_DIRS = {
    "__pycache__",
    ".git",
    ".idea",
    ".vscode",
    ".pytest_cache",
    ".mypy_cache",
    ".ruff_cache",
    "node_modules",
    "venv",
    ".venv",
}

if not ROOT.exists():
    print(f"ERROR: Folder not found: {ROOT}")
    exit(1)


def safe_print(text):
    # Avoid Unicode errors on Windows console
    print(text.encode("ascii", "replace").decode("ascii"))


with open(OUTPUT, "w", encoding="utf-8") as out:

    def walk(path, indent=""):
        items = sorted(
            [p for p in path.iterdir() if p.name not in IGNORE_DIRS],
            key=lambda x: (x.is_file(), x.name.lower())
        )

        for item in items:
            line = indent + "+-- " + item.name

            safe_print(line)
            out.write(line + "\n")

            if item.is_dir():
                walk(item, indent + "|   ")

    safe_print(ROOT.name)
    out.write(ROOT.name + "\n")
    walk(ROOT)

print(f"\nSaved to: {OUTPUT}")