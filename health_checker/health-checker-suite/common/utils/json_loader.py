"""
JSON loading and saving utilities.
"""
import json
from pathlib import Path
from typing import Dict, Any, Union
from .exceptions import ConfigurationError

def load_json(file_path: Union[str, Path]) -> Dict[str, Any]:
    """
    Load a JSON file into a dictionary.
    """
    path = Path(file_path)
    if not path.exists():
        raise ConfigurationError(f"JSON file not found: {path}")

    try:
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except json.JSONDecodeError as e:
        raise ConfigurationError(f"Invalid JSON in {path}: {str(e)}")
    except Exception as e:
        raise ConfigurationError(f"Failed to read JSON file {path}: {str(e)}")

def save_json(data: Dict[str, Any], file_path: Union[str, Path], indent: int = 2) -> None:
    """
    Save a dictionary to a JSON file.
    """
    path = Path(file_path)
    path.parent.mkdir(parents=True, exist_ok=True)

    try:
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=indent)
    except Exception as e:
        raise ConfigurationError(f"Failed to save JSON to {path}: {str(e)}")
