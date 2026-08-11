import os
import sys
import shutil
import tempfile
import unittest
from fastapi import FastAPI
from fastapi.testclient import TestClient

BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
APP_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'app'))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)
if APP_DIR not in sys.path:
    sys.path.insert(0, APP_DIR)

from database import config, bootstrap
from database.bootstrap import init_db
from database.engine import get_db_connection
from repositories.project.project import insert_project
from api.v1.video.render import router as video_render_router
from api.v1.projects.router import project_router
from api.dependencies.auth import get_current_user
from services.user.credit_service import record_credit_transaction


class VideoRenderAuthorizationTests(unittest.TestCase):
    def setUp(self):
        data_temp_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'temp'))
        os.makedirs(data_temp_dir, exist_ok=True)

        self.temp_dir = tempfile.mkdtemp(prefix='sonikoma-render-auth-test-', dir=data_temp_dir)
        db_path = os.path.join(self.temp_dir, 'test.db')
        schema_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'app', 'database', 'schema.sql'))

        config.DB_PATH = db_path
        config.SCHEMA_PATH = schema_path
        bootstrap._db_initialized = False
        config.is_postgres = False

        init_db()

        self.app = FastAPI()
        self.app.include_router(video_render_router, prefix="/api/video")
        self.app.include_router(project_router, prefix="/api/projects")

        # Mock auth override
        self.current_user = {"user_id": "user_owner_1", "email": "owner@example.com"}
        self.app.dependency_overrides[get_current_user] = lambda: self.current_user

        conn = get_db_connection()
        conn.execute(
            "INSERT INTO users (id, username, email, password_hash, created_at, updated_at) "
            "VALUES ('user_owner_1', 'owner_user', 'owner@example.com', 'hash', datetime('now'), datetime('now'))"
        )
        conn.execute(
            "INSERT INTO users (id, username, email, password_hash, created_at, updated_at) "
            "VALUES ('user_other_2', 'other_user', 'other@example.com', 'hash', datetime('now'), datetime('now'))"
        )
        conn.commit()
        conn.close()

        record_credit_transaction("user_owner_1", 100, "test_grant")
        record_credit_transaction("user_other_2", 100, "test_grant")

        # Insert test project (P1 / J1 owned by user_owner_1)
        insert_project({
            'project_id': 'P1',
            'job_id': 'J1',
            'user_id': 'user_owner_1',
            'title': 'Owner Project',
            'genre': 'action',
            'episode': 'Chapter 1',
            'status': 'pending',
            'panels_count': 1,
            'url': 'https://example.com/p1'
        })

        self.client = TestClient(self.app)

    def tearDown(self):
        if os.path.exists(self.temp_dir):
            shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_render_nonexistent_project_returns_404(self):
        payload = {
            "project_id": "P_DOES_NOT_EXIST",
            "job_id": "J1",
            "panels": [{"id": 1, "image_url": "https://example.com/p1.png"}]
        }
        res = self.client.post("/api/video/render", json=payload)
        self.assertEqual(res.status_code, 404)

    def test_render_unauthorized_project_returns_403(self):
        self.app.dependency_overrides[get_current_user] = lambda: {"user_id": "user_other_2", "email": "other@example.com"}
        payload = {
            "project_id": "P1",
            "job_id": "J1",
            "panels": [{"id": 1, "image_url": "https://example.com/p1.png"}]
        }
        res = self.client.post("/api/video/render", json=payload)
        self.assertEqual(res.status_code, 403)

    def test_render_workspace_job_id_mismatch_returns_400(self):
        payload = {
            "project_id": "P1",
            "job_id": "J_WRONG_JOB",
            "panels": [{"id": 1, "image_url": "https://example.com/p1.png"}]
        }
        res = self.client.post("/api/video/render", json=payload)
        self.assertEqual(res.status_code, 400)

    def test_render_valid_project_and_job_succeeds(self):
        payload = {
            "project_id": "P1",
            "job_id": "J1",
            "panels": [{"id": 1, "image_url": "https://example.com/p1.png"}]
        }
        res = self.client.post("/api/video/render", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertIn("execution_id", data)
        self.assertIn("job_id", data)
        self.assertEqual(data["project_id"], "P1")
        self.assertEqual(data["workspace_job_id"], "J1")

    def test_public_project_endpoint_omits_job_id(self):
        res = self.client.get("/api/projects/public/P1")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertIn("project", data)
        self.assertNotIn("job_id", data["project"])
        self.assertEqual(data["project"]["project_id"], "P1")


if __name__ == "__main__":
    unittest.main()
