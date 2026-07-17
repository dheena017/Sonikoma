from repositories.user import commands as db_commands

import os
import sys
import tempfile
import unittest
from database import config
from database import bootstrap
from repositories.user.queries import get_user_by_id
from repositories.project.project import get_project, insert_project
from database.bootstrap import init_db

sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'app'))



class InsertProjectTests(unittest.TestCase):
    def test_insert_project_creates_missing_user_for_anonymous_scrape(self):
        temp_dir = tempfile.mkdtemp(prefix='sonikoma-test-', dir=os.getcwd())
        db_path = os.path.join(temp_dir, 'test.db')
        schema_path = os.path.join(os.getcwd(), 'backend', 'app', 'database', 'schema.sql')

        config.DB_PATH = db_path
        config.SCHEMA_PATH = schema_path
        bootstrap._db_initialized = False
        config.is_postgres = False

        init_db()

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
        self.assertEqual(project['project_id'], project_id)
        self.assertEqual(project['title'], 'Copycat')
        self.assertIsNotNone(get_user_by_id('system_default'))


if __name__ == '__main__':
    unittest.main()
