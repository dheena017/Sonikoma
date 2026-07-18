import subprocess
from pathlib import Path
from typing import List
import os

class GitIntegration:
    """Wrapper to interact with Git for changed/staged files scanning."""

    @staticmethod
    def get_changed_files(project_root: Path) -> List[Path]:
        try:
            result = subprocess.run(
                ["git", "diff", "--name-only", "HEAD"],
                cwd=str(project_root),
                capture_output=True,
                text=True,
                check=True
            )
            files = []
            for line in result.stdout.splitlines():
                if line.endswith(".py"):
                    full_path = project_root / line
                    if full_path.exists():
                        files.append(full_path)
            return files
        except (subprocess.CalledProcessError, FileNotFoundError):
            return []

    @staticmethod
    def install_pre_commit_hook(project_root: Path) -> bool:
        hook_path = project_root / ".git" / "hooks" / "pre-commit"
        if not hook_path.parent.exists():
            return False

        script = "#!/bin/sh\n" \
                 "echo 'Running Backend Health Checker...'\n" \
                 "healthcheck scan .\n" \
                 "if [ $? -ne 0 ]; then\n" \
                 "    echo 'Health check failed. Please fix issues before committing.'\n" \
                 "    exit 1\n" \
                 "fi\n"

        hook_path.write_text(script)
        os.chmod(hook_path, 0o755)
        return True
