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
from api.v1.scraper import router as scraper_router
from api.dependencies.auth import get_current_user
from services.user.credit_service import record_credit_transaction
from services.jobs.manager import job_manager

class OneJobFlowTests(unittest.TestCase):
    def setUp(self):
        data_temp_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'temp'))
        os.makedirs(data_temp_dir, exist_ok=True)
        self.temp_dir = tempfile.mkdtemp(prefix='sonikoma-one-job-flow-test-', dir=data_temp_dir)
        self.db_path = os.path.join(self.temp_dir, 'test.db')
        self.schema_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'app', 'database', 'schema.sql'))

        config.DB_PATH = self.db_path
        config.SCHEMA_PATH = self.schema_path
        config.is_postgres = False

        bootstrap._db_initialized = False
        init_db()

        self.app = FastAPI()
        self.app.include_router(video_render_router, prefix="/api/video")
        self.app.include_router(scraper_router, prefix="/api/scraper")

        self.current_user = {"user_id": "user_one_job", "email": "user@example.com"}
        self.app.dependency_overrides[get_current_user] = lambda: self.current_user

        conn = get_db_connection()
        conn.execute(
            "INSERT INTO users (id, username, email, password_hash, created_at, updated_at) "
            "VALUES ('user_one_job', 'test_user', 'user@example.com', 'hash', datetime('now'), datetime('now'))"
        )
        conn.commit()
        conn.close()

        record_credit_transaction("user_one_job", 100, "test_grant")

        insert_project({
            'project_id': 'P_ONE_JOB',
            'user_id': 'user_one_job',
            'title': 'One Job Test Project',
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

    def test_one_job_video_render(self):
        # Record number of jobs before
        jobs_before = len(job_manager.list_jobs("user_one_job"))

        payload = {
            "project_id": "P_ONE_JOB",
            "panels": [{"id": 1, "image_url": "https://example.com/p1.png"}]
        }
        res = self.client.post("/api/video/render", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()

        self.assertTrue(data["success"])
        self.assertIn("job_id", data)
        self.assertNotIn("execution_id", data)
        self.assertNotIn("workspace_job_id", data)

        job_id = data["job_id"]

        # Verify EXACTLY one job was created
        jobs_after = job_manager.list_jobs("user_one_job")
        self.assertEqual(len(jobs_after), jobs_before + 1)

        # Verify the returned job matches the one in manager
        job = job_manager.get_job(job_id)
        self.assertIsNotNone(job)
        self.assertEqual(job.job_id, job_id)
        self.assertEqual(job.project_id, "P_ONE_JOB")

    def test_one_job_batch_scrape(self):
        jobs_before = len(job_manager.list_jobs("user_one_job"))

        payload = {
            "project_id": "P_ONE_JOB",
            "urls": ["https://example.com/webtoon1", "https://example.com/webtoon2"]
        }
        res = self.client.post("/api/scraper/batch", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()

        self.assertTrue(data["success"])
        self.assertIn("job_id", data)
        self.assertNotIn("execution_id", data)
        self.assertNotIn("workspace_job_id", data)
        self.assertNotIn("batch_execution_id", data)

        job_id = data["job_id"]

        jobs_after = job_manager.list_jobs("user_one_job")
        self.assertEqual(len(jobs_after), jobs_before + 1)

        job = job_manager.get_job(job_id)
        self.assertIsNotNone(job)
        self.assertEqual(job.job_id, job_id)
        self.assertEqual(job.project_id, "P_ONE_JOB")

if __name__ == "__main__":
    unittest.main()
