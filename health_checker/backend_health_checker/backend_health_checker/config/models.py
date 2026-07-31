from pydantic import BaseModel, Field
from typing import List, Dict, Optional

class LayerConfig(BaseModel):
    allowed: List[str] = []

class ArchitectureConfig(BaseModel):
    layers: Dict[str, LayerConfig] = {}

class CheckerConfig(BaseModel):
    exclude_dirs: List[str] = Field(default=["venv", ".git", "__pycache__", "node_modules", "tests"])
    exclude_files: List[str] = Field(default=[])
    max_file_lines: int = 500
    max_function_lines: int = 50
    max_class_lines: int = 300
    max_complexity: int = 10
    architecture: ArchitectureConfig = ArchitectureConfig()

class AppConfig(BaseModel):
    project_root: str = "."
    checkers: CheckerConfig = CheckerConfig()
    threads: int = 4
