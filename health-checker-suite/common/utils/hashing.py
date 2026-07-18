"""
Hashing utilities.
"""
import hashlib
from pathlib import Path
from typing import Union

def hash_string(text: str) -> str:
    """Generate SHA-256 hash of a string."""
    return hashlib.sha256(text.encode('utf-8')).hexdigest()

def hash_file(file_path: Union[str, Path]) -> str:
    """Generate SHA-256 hash of a file."""
    hasher = hashlib.sha256()
    with open(file_path, 'rb') as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hasher.update(chunk)
    return hasher.hexdigest()
