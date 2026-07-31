"""
File scanning utility.
"""
from pathlib import Path
from typing import List, Set, Optional, Iterator
from .filesystem import walk_directory
from .constants import MAX_FILE_SIZE_BYTES

def get_scannable_files(
    root_dir: Path,
    extensions: Optional[Set[str]] = None,
    exclude_dirs: Optional[Set[str]] = None,
    exclude_files: Optional[Set[str]] = None,
    max_size_bytes: int = MAX_FILE_SIZE_BYTES
) -> Iterator[Path]:
    """
    Get a list of files that are safe to scan (excluding large files).
    """
    for file_path in walk_directory(root_dir, extensions, exclude_dirs, exclude_files):
        # Skip files that are too large to read safely
        try:
            if file_path.stat().st_size <= max_size_bytes:
                yield file_path
        except OSError:
            # Skip files that can't be stat'd (permissions, broken symlinks, etc)
            continue
