import os
import sys
import shutil
import asyncio
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

class JobCancellationTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        data_temp_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'temp'))
        os.makedirs(data_temp_dir, exist_ok=True)
        self.temp_dir = tempfile.mkdtemp(prefix='sonikoma-cancellation-test-', dir=data_temp_dir)
        self.db_path = os.path.join(self.temp_dir, 'test.db')
        self.schema_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'app', 'database', 'schema.sql'))

        config.DB_PATH = self.db_path
        config.SCHEMA_PATH = self.schema_path
        config.is_postgres = False

        bootstrap._db_initialized = False
        init_db()

        conn = get_db_connection()
        conn.execute(
            "INSERT INTO users (id, username, email, password_hash, created_at, updated_at) "
            "VALUES ('user_cancel_1', 'cancel_user', 'cancel@example.com', 'hash', datetime('now'), datetime('now'))"
        )
        conn.commit()
        conn.close()

    def tearDown(self):
        if os.path.exists(self.temp_dir):
            shutil.rmtree(self.temp_dir, ignore_errors=True)

    async def test_job_cancellation_aborts_background_task(self):
        job = job_manager.create_job(JobType.RENDER_VIDEO, "user_cancel_1", "proj_cancel_1")
        job_id = job.job_id

        cancellation_verified = False

        async def long_running_task(report_progress):
            nonlocal cancellation_verified
            try:
                report_progress(10.0, "STARTING")
                await asyncio.sleep(2.0)
                report_progress(100.0, "DONE")
                return {"success": True}
            except asyncio.CancelledError:
                cancellation_verified = True
                raise

        # Dispatch the job
        job_manager.run_in_background(job_id, long_running_task)

        # Allow task to start and update state to RUNNING
        await asyncio.sleep(0.1)

        job_running = job_manager.get_job(job_id)
        self.assertEqual(job_running.status, JobStatus.RUNNING)
        self.assertEqual(job_running.progress, 10.0)

        # Verify task is tracked
        self.assertIn(job_id, job_manager._tasks)

        # Cancel job
        job_manager.cancel_job(job_id)

        # Wait a little for async cancellation to propagate
        await asyncio.sleep(0.1)

        job_cancelled = job_manager.get_job(job_id)
        self.assertEqual(job_cancelled.status, JobStatus.CANCELLED)

        # Verify task is removed
        self.assertNotIn(job_id, job_manager._tasks)

        # Verify actual CancelledError was caught in the wrapper
        self.assertTrue(cancellation_verified)

if __name__ == "__main__":
    unittest.main()
