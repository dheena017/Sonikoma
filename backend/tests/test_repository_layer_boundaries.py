from pathlib import Path


ROOT = Path(__file__).resolve().parents[1] / "app"


def test_credit_repository_delegates_to_service_layer():
    source = (ROOT / "repositories" / "user" / "credits.py").read_text(encoding="utf-8")
    assert "from services.user.credit_service import" in source


def test_profile_repository_delegates_to_service_layer():
    source = (ROOT / "repositories" / "user" / "profile.py").read_text(encoding="utf-8")
    assert "from services.user.profile_service import" in source


def test_project_repository_uses_asset_service_for_cleanup():
    source = (ROOT / "repositories" / "project" / "project.py").read_text(encoding="utf-8")
    assert "from services.project.asset_service import" in source
