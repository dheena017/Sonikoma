"""
Filesystem utilities.
"""
from pathlib import Path
from typing import List, Set, Optional, Iterator
import os
from .constants import DEFAULT_IGNORE_DIRS, DEFAULT_IGNORE_FILES

def walk_directory(
    root_dir: Path,
    extensions: Optional[Set[str]] = None,
    exclude_dirs: Optional[Set[str]] = None,
    exclude_files: Optional[Set[str]] = None
) -> Iterator[Path]:
    """
    Walk a directory and yield matching files.
    """
    ignore_dirs = DEFAULT_IGNORE_DIRS | (exclude_dirs or set())
    ignore_files = DEFAULT_IGNORE_FILES | (exclude_files or set())

    for dirpath, dirnames, filenames in os.walk(root_dir):
        # Modify dirnames in-place to prune excluded directories
        dirnames[:] = [d for d in dirnames if d not in ignore_dirs]

        current_dir = Path(dirpath)
        for filename in filenames:
            if filename in ignore_files:
                continue

            file_path = current_dir / filename
            if extensions is None or file_path.suffix in extensions:
                yield file_path
