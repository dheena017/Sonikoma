import os
import sys
import shutil
import tempfile
import unittest
import asyncio
from fastapi import FastAPI, HTTPException
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
from repositories.project.project import get_project, insert_project
from repositories.project.tokens import insert_token_log
from services.project.project_service import ProjectService
from schemas.project import ProjectUpdateRequest
from api.v1.projects.router import project_router, get_single_project
from api.dependencies.auth import get_current_user


class JobIdFlowTests(unittest.TestCase):
    def setUp(self):
        data_temp_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'temp'))
        os.makedirs(data_temp_dir, exist_ok=True)

        self.temp_dir = tempfile.mkdtemp(prefix='sonikoma-jobid-test-', dir=data_temp_dir)
        db_path = os.path.join(self.temp_dir, 'test.db')
        schema_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'app', 'database', 'schema.sql'))

        config.DB_PATH = db_path
        config.SCHEMA_PATH = schema_path
        bootstrap._db_initialized = False
        config.is_postgres = False

        init_db()

    def tearDown(self):
        if os.path.exists(self.temp_dir):
            shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_1_create_project_persists_job_id(self):
        """Case 1: Create project with job_id (P1/J1)."""
        project_id = 'proj_job_1'
        job_id = 'job_alpha_123'
        insert_project({
            'project_id': project_id,
            'job_id': job_id,
            'user_id': 'user_test_1',
            'title': 'Job Test Webtoon',
            'genre': 'action',
            'episode': 'Chapter 1',
            'status': 'pending',
            'panels_count': 0,
            'url': 'https://example.com/webtoon1',
            'author': 'Author One',
        })

        project = get_project(project_id)
        self.assertIsNotNone(project)
        assert project is not None
        self.assertEqual(project['project_id'], project_id)
        self.assertEqual(project['job_id'], job_id)

    def test_2_partial_update_omitted_job_id_preserves_existing(self):
        """Case 2: Omitted job_id in partial update preserves existing value."""
        project_id = 'proj_job_2'
        job_id = 'job_beta_456'
        insert_project({
            'project_id': project_id,
            'job_id': job_id,
            'user_id': 'user_test_1',
            'title': 'Original Title',
            'genre': 'fantasy',
            'episode': 'Chapter 1',
            'status': 'pending',
            'panels_count': 0,
            'url': 'https://example.com/webtoon2',
            'author': 'Author Two',
        })

        service = ProjectService()
        update_req = ProjectUpdateRequest(title='Updated Title Only')
        service.update_project_details(project_id, update_req, 'user_test_1')

        updated = get_project(project_id)
        assert updated is not None
        self.assertEqual(updated['title'], 'Updated Title Only')
        self.assertEqual(updated['job_id'], job_id, "Omitted job_id must preserve existing value")

    def test_3_explicit_null_clears_job_id(self):
        """Case 3: Explicit job_id: null in payload clears job_id."""
        project_id = 'proj_job_3'
        job_id = 'job_gamma_789'
        insert_project({
            'project_id': project_id,
            'job_id': job_id,
            'user_id': 'user_test_1',
            'title': 'Clear Test',
            'genre': 'drama',
            'episode': 'Chapter 1',
            'status': 'pending',
            'panels_count': 0,
            'url': 'https://example.com/webtoon3',
            'author': 'Author Three',
        })

        service = ProjectService()
        update_req = ProjectUpdateRequest(job_id=None)
        service.update_project_details(project_id, update_req, 'user_test_1')

        updated = get_project(project_id)
        assert updated is not None
        self.assertIsNone(updated['job_id'], "Explicit null in payload should clear job_id")

    def test_4_update_project_with_mismatched_job_id_is_rejected(self):
        """Case 4: update_project_details rejects a mismatching job_id to prevent cross-job data corruption.

        Previously this tested free job_id mutation. Now that the service enforces job
        boundary integrity (issue #2 of the workspace isolation audit), providing a
        different job_id from the one already stored on the project must raise ValueError.
        """
        project_id = 'proj_job_4'
        job_id_1 = 'job_initial_111'
        job_id_2 = 'job_updated_222'
        insert_project({
            'project_id': project_id,
            'job_id': job_id_1,
            'user_id': 'user_test_1',
            'title': 'New Job Test',
            'genre': 'action',
            'episode': 'Chapter 1',
            'status': 'pending',
            'panels_count': 0,
            'url': 'https://example.com/webtoon4',
            'author': 'Author Four',
        })

        service = ProjectService()
        update_req = ProjectUpdateRequest(job_id=job_id_2)
        with self.assertRaises(ValueError) as ctx:
            service.update_project_details(project_id, update_req, 'user_test_1')
        self.assertIn('job_id mismatch', str(ctx.exception))

        # Verify the original job_id was NOT modified.
        stored = get_project(project_id)
        assert stored is not None
        self.assertEqual(stored['job_id'], job_id_1, "job_id must remain unchanged after a rejected update.")

    def test_5_update_missing_project_raises_error(self):
        """Case 5: Updating a missing project raises ValueError instead of auto-creating."""
        project_id = 'proj_missing_5'
        job_id = 'job_new_555'
        service = ProjectService()
        update_req = ProjectUpdateRequest(
            title='Auto-Created Project',
            job_id=job_id,
            url='https://example.com/missing5'
        )
        with self.assertRaises(ValueError):
            service.update_project_details(project_id, update_req, 'user_test_1')

    def test_7_project_lifecycle_promotion(self):
        """Case 7: Temp project promotion flips project_type to permanent."""
        project_id = 'temp_proj_lifecycle_7'
        insert_project({
            'project_id': project_id,
            'project_type': 'temp',
            'user_id': 'user_test_1',
            'title': 'Temp Workspace',
            'genre': 'fantasy',
            'episode': 'Chapter 1',
            'status': 'pending',
            'panels_count': 0,
            'url': 'https://example.com/temp7',
            'author': 'Author Seven',
        })

        initial = get_project(project_id)
        assert initial is not None
        self.assertEqual(initial['project_type'], 'temp')

        service = ProjectService()
        res = service.promote_project(project_id, 'user_test_1')
        self.assertTrue(res['success'])

        promoted = get_project(project_id)
        assert promoted is not None
        self.assertEqual(promoted['project_type'], 'permanent')
        self.assertEqual(promoted['project_id'], project_id, "Project ID remains identical post-promotion")

    def test_6_token_logging_attaches_job_id(self):
        """Case 6: Token log persistence attaches job_id correctly."""
        project_id = 'proj_job_6'
        job_id = 'job_delta_101'
        insert_project({
            'project_id': project_id,
            'job_id': job_id,
            'user_id': 'user_test_1',
            'title': 'Token Test',
            'genre': 'scifi',
            'episode': 'Chapter 1',
            'status': 'pending',
            'panels_count': 0,
            'url': 'https://example.com/webtoon6',
            'author': 'Author Six',
        })

        log_id = 'log_101'
        insert_token_log(log_id, project_id, 1000, 500, 1500, 0.00075)

        conn = get_db_connection()
        try:
            row = conn.execute("SELECT * FROM token_usage_logs WHERE id = ?", (log_id,)).fetchone()
            self.assertIsNotNone(row)
            assert row is not None
            self.assertEqual(row['project_id'], project_id)
            self.assertEqual(row['job_id'], job_id, "Token log should automatically acquire job_id from chapter")
        finally:
            conn.close()

    def test_router_get_single_project_matrix_http_client(self):
        """
        Direct HTTP API router tests via FastAPI TestClient for all 4 security matrix cases:
        1. User A (owner) + P1 + J1 -> HTTP 200
        2. User A (owner) + P1 + WRONG_JOB -> HTTP 400
        3. User B (foreign) + P1 + J1 -> HTTP 403
        4. User B (foreign) + P1 + WRONG_JOB -> HTTP 403
        """
        app = FastAPI()
        app.include_router(project_router, prefix="/api/projects")
        client = TestClient(app)

        project_id = 'proj_matrix_http_100'
        correct_job = 'job_matrix_http_100'
        wrong_job = 'job_matrix_http_WRONG'
        user_a = {'user_id': 'user_A'}
        user_b = {'user_id': 'user_B'}

        insert_project({
            'project_id': project_id,
            'job_id': correct_job,
            'user_id': 'user_A',
            'title': 'Matrix HTTP Test Project',
            'genre': 'action',
            'episode': 'Chapter 1',
            'status': 'pending',
            'panels_count': 0,
            'url': 'https://example.com/matrix_http_100',
            'author': 'Matrix Author',
        })

        try:
            # Case 1: User A + P1 + J1 -> 200
            app.dependency_overrides[get_current_user] = lambda: user_a
            res1 = client.get(f"/api/projects/{project_id}?job_id={correct_job}")
            self.assertEqual(res1.status_code, 200)
            data1 = res1.json()
            self.assertTrue(data1.get('success'))
            self.assertEqual(data1['project']['project_id'], project_id)
            self.assertEqual(data1['project']['job_id'], correct_job)

            # Case 2: User A + P1 + WRONG_JOB -> 400
            res2 = client.get(f"/api/projects/{project_id}?job_id={wrong_job}")
            self.assertEqual(res2.status_code, 400)
            data2 = res2.json()
            self.assertIn("Job ID mismatch", data2.get("detail", ""))

            # Case 3: User B + P1 + J1 -> 403
            app.dependency_overrides[get_current_user] = lambda: user_b
            res3 = client.get(f"/api/projects/{project_id}?job_id={correct_job}")
            self.assertEqual(res3.status_code, 403)
            data3 = res3.json()
            self.assertEqual(data3.get("detail"), "Access denied.")

            # Case 4: User B + P1 + WRONG_JOB -> 403
            res4 = client.get(f"/api/projects/{project_id}?job_id={wrong_job}")
            self.assertEqual(res4.status_code, 403)
            data4 = res4.json()
            self.assertEqual(data4.get("detail"), "Access denied.")
        finally:
            app.dependency_overrides.clear()

    def test_migration_is_idempotent_and_creates_job_id_in_all_tables(self):
        """Case 8: Schema migration idempotency and table verification for job_id in both chapters and token_usage_logs."""
        # Test idempotency
        init_db()
        init_db()
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("PRAGMA table_info(chapters)")
            chapters_cols = [row['name'] for row in cursor.fetchall()]
            self.assertIn('job_id', chapters_cols, "chapters table must contain job_id column")

            cursor.execute("PRAGMA table_info(token_usage_logs)")
            token_logs_cols = [row['name'] for row in cursor.fetchall()]
            self.assertIn('job_id', token_logs_cols, "token_usage_logs table must contain job_id column")
        finally:
            conn.close()

    def test_fresh_sqlite_migration_without_existing_schema(self):
        """Verify fresh SQLite DB migration creates job_id column in both chapters and token_usage_logs."""
        fresh_temp_dir = tempfile.mkdtemp(prefix='sonikoma-fresh-db-test-', dir=self.temp_dir)
        fresh_db_path = os.path.join(fresh_temp_dir, 'fresh.db')

        # Point DB path to fresh db
        config.DB_PATH = fresh_db_path
        bootstrap._db_initialized = False
        init_db()

        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("PRAGMA table_info(chapters)")
            chapters_cols = [row['name'] for row in cursor.fetchall()]
            self.assertIn('job_id', chapters_cols, "chapters table must contain job_id column on fresh DB")

            cursor.execute("PRAGMA table_info(token_usage_logs)")
            token_logs_cols = [row['name'] for row in cursor.fetchall()]
            self.assertIn('job_id', token_logs_cols, "token_usage_logs table must contain job_id column on fresh DB")
        finally:
            conn.close()


if __name__ == '__main__':
    unittest.main()
