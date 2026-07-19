from typer.testing import CliRunner
from react_frontend_health_checker.cli.main import app
import json

runner = CliRunner()

def test_scan_terminal(tmp_path):
    # Create dummy js
    (tmp_path / "app.jsx").write_text("import React from 'react';\nconsole.log(eval('2+2'));")
    result = runner.invoke(app, ["scan", str(tmp_path)])
    assert result.exit_code == 0
    assert "Usage of eval() detected." in result.stdout

def test_scan_json(tmp_path):
    (tmp_path / "app.jsx").write_text("import React from 'react';\nconsole.log(eval('2+2'));")
    result = runner.invoke(app, ["scan", str(tmp_path), "--format", "json"])
    assert result.exit_code == 0

    with open("health-report.json") as f:
        data = json.load(f)

    # Check if there is at least one finding regarding eval()
    eval_finding = next((f for f in data["findings"] if f["message"] == "Usage of eval() detected."), None)
    assert eval_finding is not None
