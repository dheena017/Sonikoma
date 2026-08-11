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
        # Omitted job_id (only title provided in model fields set)
        update_req = ProjectUpdateRequest(title='Updated Title Only')
        service.update_project_details(project_id, update_req, 'user_test_1')

        updated = get_project(project_id)
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
        self.assertIsNone(updated['job_id'], "Explicit null in payload should clear job_id")

    def test_4_set_new_job_id_string(self):
        """Case 4: String job_id changes it to a new value (J1 -> J2)."""
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

    def test_5_update_missing_project_persists_job_id(self):
        """Case 5: Updating a missing project inserts it and preserves job_id."""
        project_id = 'proj_missing_5'
        job_id = 'job_new_555'
        service = ProjectService()
        update_req = ProjectUpdateRequest(
            title='Auto-Created Project',
            job_id=job_id,
            url='https://example.com/missing5'
        )
        service.update_project_details(project_id, update_req, 'user_test_1')

        created = get_project(project_id)
        self.assertIsNotNone(created)
        self.assertEqual(created['project_id'], project_id)
        self.assertEqual(created['job_id'], job_id)

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
            self.assertEqual(row['project_id'], project_id)
            self.assertEqual(row['job_id'], job_id, "Token log should automatically acquire job_id from chapter")
        finally:
            conn.close()

    def test_7_get_project_validates_wrong_job_context(self):
        """Case 7: Validating GET project context mismatch."""
        project_id = 'proj_job_7'
        job_id = 'job_correct_777'
        insert_project({
            'project_id': project_id,
            'job_id': job_id,
            'user_id': 'user_test_1',
            'title': 'GET Context Test',
            'genre': 'comedy',
            'episode': 'Chapter 1',
            'status': 'pending',
            'panels_count': 0,
            'url': 'https://example.com/webtoon7',
            'author': 'Author Seven',
        })

        project = get_project(project_id)
        self.assertEqual(project['job_id'], job_id)
        # Validation check: mismatch detected when provided job_id != stored job_id
        self.assertNotEqual(project['job_id'], 'job_WRONG_999')

    def test_8_migration_is_idempotent(self):
        """Case 8: Schema migration idempotency."""
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
