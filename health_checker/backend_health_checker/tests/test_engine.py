import pytest
from pathlib import Path
from backend_health_checker.core.engine import HealthCheckEngine
from backend_health_checker.config.models import AppConfig

def test_engine_discovery(tmp_path):
    # Create dummy files
    (tmp_path / "valid.py").write_text("def test(): pass")
    (tmp_path / "invalid.py").write_text("def class pass")
    (tmp_path / ".hidden.py").write_text("pass")

    config = AppConfig(project_root=str(tmp_path))
    engine = HealthCheckEngine(config)

    files = engine.discover_files()
    assert len(files) == 2  # valid.py and invalid.py, but not .hidden.py

def test_engine_run():
    config = AppConfig()
    engine = HealthCheckEngine(config)
    # Just checking it doesn't crash on empty
    engine.run_all([])
    assert engine.metrics.total_files == 0
