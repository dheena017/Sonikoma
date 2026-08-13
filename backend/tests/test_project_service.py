import os
import sys
import unittest
from types import SimpleNamespace

sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'app'))

from services.project.project_service import ProjectService


class FakeProjectRepository:
    def __init__(self):
        self.inserted = []
        self.updated = []
        self.panels = []
        self.projects = {}

    def get_project(self, project_id):
        return self.projects.get(project_id)

    def get_project_by_slug(self, project_id_or_slug):
        return None

    def insert_project(self, payload):
        self.projects[payload["project_id"]] = payload
        self.inserted.append(payload)

    def insert_panels(self, project_id, panels):
        self.panels = panels

    def update_project(self, project_id, updates):
        self.updated.append((project_id, updates))

    def update_project_full(self, project_id, updates):
        self.updated.append((project_id, updates))

    def increment_project_tokens(self, project_id, tokens):
        pass


class ProjectServiceTests(unittest.TestCase):
    def test_create_project_inserts_payload_for_new_project(self):
        repo = FakeProjectRepository()
        service = ProjectService(repo=repo)

        body = SimpleNamespace(
            project_id="proj_123",
            url="https://example.com/project",
            title="My Project",
            genre="adventure",
            episode="1",
            panels_count=5,
            video_url=None,
            author="Test Author",
            cover_image="https://example.com/cover.jpg",
            synopsis="A test synopsis",
        )

        result = service.create_project(body, "user-1")

        self.assertEqual(result["project_id"], "proj_123")
        self.assertEqual(repo.inserted[0]["user_id"], "user-1")
        self.assertEqual(repo.inserted[0]["status"], "pending")

    def test_save_project_panels_persists_dialogue_and_subtitle_fields(self):
        repo = FakeProjectRepository()
        repo.projects["proj_123"] = {"project_id": "proj_123", "user_id": "user-1"}
        service = ProjectService(repo=repo)

        panel = SimpleNamespace(
            image_url="https://example.com/panel.png",
            original_image_url="https://example.com/original.png",
            speech_text="Hello, hero!",
            sfx="[Whoosh]",
            duration=4.5,
            motion_type="zoom_in",
            visual_description="A hero draws their sword.",
            narrative="A cinematic opening narration.",
            brightness=None,
            contrast=None,
            saturation=None,
            grayscale=False,
            filter_preset=None,
            bubble_method=None,
            bubble_sensitivity=None,
            bubble_dilation=None,
            inpaint_radius=None,
            detection_style=None,
        )

        result = service.save_project_panels("proj_123", [panel], "user-1")

        self.assertTrue(result["success"])
        self.assertEqual(len(repo.panels), 1)
        saved_panel = repo.panels[0]
        self.assertEqual(saved_panel["speech_text"], "Hello, hero!")
        self.assertEqual(saved_panel["sfx"], "[Whoosh]")
        self.assertEqual(saved_panel["visual_description"], "A hero draws their sword.")
        self.assertEqual(saved_panel["narrative"], "A cinematic opening narration.")
        self.assertEqual(saved_panel["original_url"], "https://example.com/original.png")
        self.assertEqual(repo.updated[0][1]["panels_count"], 1)


if __name__ == "__main__":
    unittest.main()
