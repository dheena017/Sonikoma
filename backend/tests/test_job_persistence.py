import os
import sys
import shutil
import tempfile
import unittest

BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
APP_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'app'))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)
if APP_DIR not in sys.path:
    sys.path.insert(0, APP_DIR)

from database import config, bootstrap
from database.bootstrap import init_db
from database.engine import get_db_connection
from services.jobs.manager import job_manager
from services.jobs.models import JobType, JobStatus

class JobPersistenceTests(unittest.TestCase):
    def setUp(self):
        data_temp_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'temp'))
        os.makedirs(data_temp_dir, exist_ok=True)
        self.temp_dir = tempfile.mkdtemp(prefix='sonikoma-job-persistence-test-', dir=data_temp_dir)
        self.db_path = os.path.join(self.temp_dir, 'test.db')
        self.schema_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'app', 'database', 'schema.sql'))

        config.DB_PATH = self.db_path
        config.SCHEMA_PATH = self.schema_path
        config.is_postgres = False

        # Reset bootstrap state
        bootstrap._db_initialized = False

    def tearDown(self):
        if os.path.exists(self.temp_dir):
            shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_job_survives_restart_with_status_and_result(self):
        # 1. Start backend and create job
        init_db()

        conn = get_db_connection()
        conn.execute(
            "INSERT INTO users (id, username, email, password_hash, created_at, updated_at) "
            "VALUES ('user_test_1', 'test_user', 'test@example.com', 'hash', datetime('now'), datetime('now'))"
        )
        conn.commit()
        conn.close()

        job = job_manager.create_job(JobType.RENDER_VIDEO, "user_test_1", "proj_test_1")
        job_id = job.job_id

        # Verify job is QUEUED
        job_from_db = job_manager.get_job(job_id)
        self.assertIsNotNone(job_from_db)
        self.assertEqual(job_from_db.status, JobStatus.QUEUED)

        # 2. Simulate running the job to 42%
        job_manager.update_progress(job_id, 42.0, "RENDERING")

        # 3. Simulate backend restart
        bootstrap._db_initialized = False
        init_db()

        # 4. Verify progress survived
        job_restarted = job_manager.get_job(job_id)
        self.assertIsNotNone(job_restarted)
        self.assertEqual(job_restarted.status, JobStatus.RUNNING)
        self.assertEqual(job_restarted.progress, 42.0)
        self.assertEqual(job_restarted.stage, "RENDERING")

        # 5. Complete job
        job_manager.complete_job(job_id, result={"video_url": "/test/url.mp4"})

        # 6. Simulate backend restart again
        bootstrap._db_initialized = False
        init_db()

        # 7. Verify result and COMPLETED status survived
        job_final = job_manager.get_job(job_id)
        self.assertIsNotNone(job_final)
        self.assertEqual(job_final.status, JobStatus.COMPLETED)
        self.assertEqual(job_final.progress, 100.0)
        self.assertEqual(job_final.result, {"video_url": "/test/url.mp4"})

if __name__ == "__main__":
    unittest.main()
