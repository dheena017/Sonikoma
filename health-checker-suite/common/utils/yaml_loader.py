"""
YAML loading and saving utilities.
"""
import yaml
from pathlib import Path
from typing import Dict, Any, Union
from .exceptions import ConfigurationError

def load_yaml(file_path: Union[str, Path]) -> Dict[str, Any]:
    """
    Load a YAML file into a dictionary.
    """
    path = Path(file_path)
    if not path.exists():
        raise ConfigurationError(f"YAML file not found: {path}")

    try:
        with open(path, 'r', encoding='utf-8') as f:
            return yaml.safe_load(f) or {}
    except yaml.YAMLError as e:
        raise ConfigurationError(f"Invalid YAML in {path}: {str(e)}")
    except Exception as e:
        raise ConfigurationError(f"Failed to read YAML file {path}: {str(e)}")

def save_yaml(data: Dict[str, Any], file_path: Union[str, Path]) -> None:
    """
    Save a dictionary to a YAML file.
    """
    path = Path(file_path)
    path.parent.mkdir(parents=True, exist_ok=True)

    try:
        with open(path, 'w', encoding='utf-8') as f:
            yaml.safe_dump(data, f, default_flow_style=False, sort_keys=False)
    except Exception as e:
        raise ConfigurationError(f"Failed to save YAML to {path}: {str(e)}")
