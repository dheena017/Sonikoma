from pathlib import Path

class CIGenerator:
    @staticmethod
    def generate_github_actions(project_root: Path):
        workflow_dir = project_root / ".github" / "workflows"
        workflow_dir.mkdir(parents=True, exist_ok=True)

        content = """name: Backend Health Check

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3

    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: "3.11"

    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install backend-health-checker

    - name: Run Healthcheck
      run: healthcheck scan .

    - name: Generate Reports
      run: healthcheck report . --out reports
      if: always()

    - name: Upload Artifacts
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: healthcheck-reports
        path: reports/
"""
        (workflow_dir / "healthcheck.yml").write_text(content)
