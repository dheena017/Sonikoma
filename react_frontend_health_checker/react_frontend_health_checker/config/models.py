from typing import List, Optional
from pydantic import BaseModel, Field

class ParserConfig(BaseModel):
    """
    Configuration for the JS/TS parser.
    """
    allow_jsx: bool = True
    allow_tsx: bool = True

class ScannerConfig(BaseModel):
    """
    Configuration for the project scanner.
    """
    exclude_dirs: List[str] = Field(default_factory=lambda: ["node_modules", "dist", "build", ".next", ".git"])
    include_extensions: List[str] = Field(default_factory=lambda: [".js", ".jsx", ".ts", ".tsx"])

class CheckerConfig(BaseModel):
    """
    Configuration for specific checkers.
    """
    enabled_checkers: Optional[List[str]] = None  # None means all are enabled
    disabled_checkers: List[str] = Field(default_factory=list)

class ProjectConfig(BaseModel):
    """
    Main configuration object for the health checker.
    """
    project_path: str = "."
    scanner: ScannerConfig = Field(default_factory=ScannerConfig)
    parser: ParserConfig = Field(default_factory=ParserConfig)
    checker: CheckerConfig = Field(default_factory=CheckerConfig)

    @classmethod
    def default(cls, project_path: str = ".") -> "ProjectConfig":
        return cls(project_path=project_path)
