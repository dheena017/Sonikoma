import os
import sys
import unittest
from types import SimpleNamespace

sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'app'))

from services.project.project_service import ProjectService


class FakeProjectRepository:
    def __init__(self):
        self.inserted = []
        self.projects = {}

    def get_project(self, project_id):
        return self.projects.get(project_id)

    def get_project_by_slug(self, project_id_or_slug):
        return None

    def insert_project(self, payload):
        self.projects[payload["project_id"]] = payload
        self.inserted.append(payload)


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


if __name__ == "__main__":
    unittest.main()
