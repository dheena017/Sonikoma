import os
import sys
import tempfile
import unittest

sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'app'))

import database.db as db


class InsertProjectTests(unittest.TestCase):
    def test_insert_project_creates_missing_user_for_anonymous_scrape(self):
        temp_dir = tempfile.mkdtemp(prefix='sonikoma-test-', dir=os.getcwd())
        db_path = os.path.join(temp_dir, 'test.db')
        schema_path = os.path.join(os.path.dirname(__file__), '..', 'app', 'database', 'schema.sql')

        db.DB_PATH = db_path
        db.SCHEMA_PATH = schema_path
        db._db_initialized = False
        db._is_postgres = False

        db.init_db()

        project_id = 'proj_test_123'
        db.insert_project({
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

        project = db.get_project(project_id)
        self.assertIsNotNone(project)
        self.assertEqual(project['project_id'], project_id)
        self.assertEqual(project['title'], 'Copycat')
        self.assertIsNotNone(db.get_user_by_id('system_default'))


if __name__ == '__main__':
    unittest.main()
