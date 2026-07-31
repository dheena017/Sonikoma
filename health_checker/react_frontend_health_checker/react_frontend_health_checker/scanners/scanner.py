import os
from pathlib import Path
from typing import List, Generator
from react_frontend_health_checker.config.models import ScannerConfig

class ProjectScanner:
    """
    Discovers files in the React project based on configuration.
    """
    def __init__(self, project_path: str, config: ScannerConfig):
        self.project_path = Path(project_path)
        self.config = config

    def scan(self) -> Generator[Path, None, None]:
        """
        Yields all valid file paths in the project.
        """
        for root, dirs, files in os.walk(self.project_path):
            # Exclude directories
            dirs[:] = [d for d in dirs if d not in self.config.exclude_dirs]

            for file in files:
                file_path = Path(root) / file
                if file_path.suffix in self.config.include_extensions:
                    yield file_path

    def get_all_files(self) -> List[Path]:
        """
        Returns a list of all valid file paths.
        """
        return list(self.scan())
