#!/usr/bin/env python
"""
Enterprise Python Module Checker

Scans every Python module under the backend directory.

Checks:
    ✓ Syntax errors
    ✓ Import errors
    ✓ Missing modules
    ✓ Circular imports
    ✓ Runtime import exceptions

Works on Windows, Linux and macOS.
"""

import ast
import importlib.util
import os
import sys
import traceback
from pathlib import Path

# ----------------------------------------------------------
# CONFIGURATION
# ----------------------------------------------------------

SCRIPT_PATH = Path(__file__).resolve()

# backend/scripts/check_python_modules.py
# backend root:
PROJECT_ROOT = SCRIPT_PATH.parent.parent

SCAN_ROOT = PROJECT_ROOT

IGNORE_DIRS = {
    "__pycache__",
    ".git",
    ".idea",
    ".vscode",
    ".venv",
    "venv",
    "env",
    "node_modules",
    ".pytest_cache",
    ".mypy_cache",
    "build",
    "dist",
}

REPORT_FILE = PROJECT_ROOT / "python_module_report.txt"

# ----------------------------------------------------------

sys.path.insert(0, str(PROJECT_ROOT))

passed = []
failed = []
total = 0


def module_name(path: Path):
    rel = path.relative_to(PROJECT_ROOT)
    return ".".join(rel.with_suffix("").parts)


def syntax_check(file_path):
    try:
        source = file_path.read_text(encoding="utf-8")
        ast.parse(source)
        return True, None
    except Exception as e:
        return False, e


def import_check(file_path):
    name = module_name(file_path)

    try:
        spec = importlib.util.spec_from_file_location(name, str(file_path))

        if spec is None:
            return False, "Unable to create import spec."

        module = importlib.util.module_from_spec(spec)

        loader = spec.loader

        if loader is None:
            return False, "Loader is None."

        loader.exec_module(module)

        return True, None

    except Exception:
        return False, traceback.format_exc()


def log(text=""):
    print(text)
    with REPORT_FILE.open("a", encoding="utf-8") as f:
        f.write(text + "\n")


# ----------------------------------------------------------

REPORT_FILE.write_text("", encoding="utf-8")

log("=" * 80)
log("ENTERPRISE PYTHON MODULE CHECKER")
log("=" * 80)
log("")
log(f"Project Root : {PROJECT_ROOT}")
log("")

python_files = []

for root, dirs, files in os.walk(SCAN_ROOT):

    dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]

    for file in files:

        if file.endswith(".py"):

            python_files.append(Path(root) / file)

python_files.sort()

total = len(python_files)

for file in python_files:

    relative = file.relative_to(PROJECT_ROOT)

    log(f"Checking: {relative}")

    ok, err = syntax_check(file)

    if not ok:

        failed.append((relative, "Syntax Error", str(err)))

        log("   ❌ Syntax Error")
        log("")

        continue

    ok, err = import_check(file)

    if ok:

        passed.append(relative)

        log("   ✅ OK")

    else:

        failed.append((relative, "Import Error", err))

        log("   ❌ Import Error")

    log("")

# ----------------------------------------------------------

log("")
log("=" * 80)
log("SUMMARY")
log("=" * 80)
log(f"Total Files : {total}")
log(f"Passed      : {len(passed)}")
log(f"Failed      : {len(failed)}")
log("")

if failed:

    log("=" * 80)
    log("FAILED MODULES")
    log("=" * 80)

    for file, error_type, error in failed:

        log("")
        log("-" * 80)
        log(str(file))
        log(error_type)
        log("-" * 80)
        log(error)

log("")
log("=" * 80)

if failed:
    log(f"⚠ {len(failed)} module(s) failed.")
else:
    log("🎉 ALL PYTHON MODULES IMPORT SUCCESSFULLY!")

log("=" * 80)

print()
print(f"Detailed report saved to:\n{REPORT_FILE}")