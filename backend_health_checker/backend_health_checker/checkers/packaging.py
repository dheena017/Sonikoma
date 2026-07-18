from pathlib import Path
from typing import List
from .base import BaseChecker
from backend_health_checker.models.issues import Issue, Severity

class PackageChecker(BaseChecker):
    def check_project(self, file_paths: List[Path]) -> List[Issue]:
        issues = []
        directories = set(fp.parent for fp in file_paths if fp.parent.name != "")

        # We don't want to enforce __init__.py on the root or explicitly excluded dirs
        root_path = Path(self.config.project_root).resolve()

        for d in directories:
            if d == root_path:
                continue

            init_file = d / "__init__.py"
            if not init_file.exists():
                # Check if it's a namespace package (Python 3.3+), but usually explicit is better
                issues.append(
                    Issue(
                        checker_name=self.name,
                        file_path=str(d),
                        line_number=0,
                        message=f"Directory '{d.relative_to(root_path)}' contains Python files but no __init__.py (Orphan Package).",
                        severity=Severity.LOW
                    )
                )
        return issues
