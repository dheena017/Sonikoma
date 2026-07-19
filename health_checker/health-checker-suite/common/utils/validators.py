"""
Validation utilities.
"""
from typing import Any, List
from .exceptions import ValidationError

def require_not_empty(value: Any, field_name: str) -> None:
    """Validate that a value is not empty or None."""
    if value is None or (isinstance(value, (str, list, dict, set)) and not value):
        raise ValidationError(f"Field '{field_name}' cannot be empty")

def require_type(value: Any, expected_type: type, field_name: str) -> None:
    """Validate that a value is of a specific type."""
    if not isinstance(value, expected_type):
        raise ValidationError(f"Field '{field_name}' must be of type {expected_type.__name__}, got {type(value).__name__}")

def require_one_of(value: Any, allowed_values: List[Any], field_name: str) -> None:
    """Validate that a value is in a list of allowed values."""
    if value not in allowed_values:
        raise ValidationError(f"Field '{field_name}' must be one of {allowed_values}, got {value}")
