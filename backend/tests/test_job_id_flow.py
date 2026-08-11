import os
import sys
import shutil
import tempfile
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'app')))

from database import config, bootstrap
from database.bootstrap import init_db
from database.engine import get_db_connection
from repositories.project.project import get_project, insert_project
from repositories.project.tokens import insert_token_log
from services.project.project_service import ProjectService
from schemas.project import ProjectUpdateRequest


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
        """Test 1: Create project with job_id (P1/J1)."""
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
        self.assertEqual(project['project_id'], project_id)
        self.assertEqual(project['job_id'], job_id)

    def test_2_partial_update_preserves_job_id(self):
        """Test 2: Partial update title only preserves job_id."""
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
        self.assertEqual(updated['title'], 'Updated Title Only')
        self.assertEqual(updated['job_id'], job_id, "Partial update must preserve existing job_id")

    def test_3_explicit_null_clears_job_id(self):
        """Test 3: Explicit null in update clears job_id."""
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
        self.assertIsNone(updated['job_id'], "Explicit null in payload should clear job_id")

    def test_4_set_new_job_id(self):
        """Test 4: Setting a new job_id updates P1/J1 to P1/J2."""
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
        service.update_project_details(project_id, update_req, 'user_test_1')

        updated = get_project(project_id)
        self.assertEqual(updated['job_id'], job_id_2)

    def test_5_token_logging_attaches_job_id(self):
        """Test 5: Token log persistence attaches job_id correctly."""
        project_id = 'proj_job_5'
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
            'url': 'https://example.com/webtoon5',
            'author': 'Author Five',
        })

        log_id = 'log_101'
        insert_token_log(log_id, project_id, 1000, 500, 1500, 0.00075)

        conn = get_db_connection()
        try:
            row = conn.execute("SELECT * FROM token_usage_logs WHERE id = ?", (log_id,)).fetchone()
            self.assertIsNotNone(row)
            self.assertEqual(row['project_id'], project_id)
            self.assertEqual(row['job_id'], job_id, "Token log should automatically acquire job_id from chapter")
        finally:
            conn.close()

    def test_6_get_project_with_job_context(self):
        """Test 6: GET project with matching job_id context."""
        project_id = 'proj_job_6'
        job_id = 'job_ctx_666'
        insert_project({
            'project_id': project_id,
            'job_id': job_id,
            'user_id': 'user_test_1',
            'title': 'GET Context Test',
            'genre': 'comedy',
            'episode': 'Chapter 1',
            'status': 'pending',
            'panels_count': 0,
            'url': 'https://example.com/webtoon6',
            'author': 'Author Six',
        })

        project = get_project(project_id)
        self.assertEqual(project['job_id'], job_id)

    def test_7_migration_is_idempotent(self):
        """Test 7: Schema migration idempotency."""
        init_db()
        init_db()
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("PRAGMA table_info(chapters)")
            cols = [row['name'] for row in cursor.fetchall()]
            self.assertIn('job_id', cols)
        finally:
            conn.close()


if __name__ == '__main__':
    unittest.main()
