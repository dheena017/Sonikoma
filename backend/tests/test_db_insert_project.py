import os
import sys
import shutil
import tempfile
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'app')))

from database import config, bootstrap
from database.bootstrap import init_db
from repositories.user import commands as db_commands
from repositories.user.queries import get_user_by_id
from repositories.project.project import get_project, insert_project


class InsertProjectTests(unittest.TestCase):
    def setUp(self):
        data_temp_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'temp'))
        os.makedirs(data_temp_dir, exist_ok=True)

        self.temp_dir = tempfile.mkdtemp(prefix='sonikoma-test-', dir=data_temp_dir)
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

    def test_insert_project_creates_missing_user_for_anonymous_scrape(self):
        project_id = 'proj_test_123'
        insert_project({
            'project_id': project_id,
            'user_id': 'system_default',
            'title': 'Copycat',
            'genre': 'thriller',
            'episode': 'Chapter 15',
            'status': 'pending',
            'panels_count': 0,
            'url': 'https://example.com/test',
            'author': 'Test Author',
            'cover_image': 'https://example.com/cover.jpg',
            'synopsis': 'Test synopsis',
        })

        project = get_project(project_id)
        self.assertIsNotNone(project)
        assert project is not None
        self.assertEqual(project['project_id'], project_id)
        self.assertEqual(project['title'], 'Copycat')
        self.assertIsNotNone(get_user_by_id('system_default'))


if __name__ == '__main__':
    unittest.main()
