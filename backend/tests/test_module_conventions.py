import importlib
import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'app'))
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from services.project import ProjectService
from services.processing import CompoundProcessor
from services.image.scraper import scrape_images_from_url


def test_service_packages_expose_authoritative_symbols():
    assert ProjectService is not None
    assert CompoundProcessor is not None
    assert callable(scrape_images_from_url)


def test_media_engine_wrappers_resolve_to_canonical_modules():
    wrappers = [
        ("media.audio.librosa_engine", "app.providers.librosa"),
        ("media.audio.whisper_engine", "app.providers.whisper"),
        ("media.video.ffmpeg_engine", "app.providers.ffmpeg"),
        ("media.image.imagemagick_engine", "services.image.processing.imagemagick"),
    ]

    for wrapper_name, canonical_name in wrappers:
        module = importlib.import_module(wrapper_name)
        assert module.__name__ == canonical_name


def test_repository_modules_are_canonical():
    project_repo = importlib.import_module("repositories.project")
    system_repo = importlib.import_module("repositories.system")
    user_repo = importlib.import_module("repositories.user")

    assert project_repo is not None
    assert system_repo is not None
    assert user_repo is not None


def test_project_panels_exposes_edit_history_helpers():
    panels_module = importlib.import_module("repositories.project.panels")

    assert hasattr(panels_module, "save_edit_history")
    assert hasattr(panels_module, "get_edit_history")
