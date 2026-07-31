"""
Path manipulation utilities.
"""
from pathlib import Path
from typing import Union

def to_posix_path(path: Union[str, Path]) -> str:
    """
    Convert a path to a POSIX string representation for cross-platform consistency.
    """
    return Path(path).as_posix()

def get_relative_path(path: Union[str, Path], root: Union[str, Path]) -> str:
    """
    Get the relative path as a POSIX string.
    """
    try:
        return Path(path).relative_to(Path(root)).as_posix()
    except ValueError:
        # Fallback if path is not relative to root
        return to_posix_path(path)
