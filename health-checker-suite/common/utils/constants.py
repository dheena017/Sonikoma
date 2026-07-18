"""
Constants used across the Health Checker Suite.
"""

DEFAULT_ENCODING = "utf-8"
DEFAULT_IGNORE_DIRS = {".git", "__pycache__", "node_modules", "venv", ".venv", ".tox", ".pytest_cache"}
DEFAULT_IGNORE_FILES = {".DS_Store"}

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB limit for text analysis
