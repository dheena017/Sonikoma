# Database Migrations

This directory serves two roles:

- `__init__.py` preserves the existing bootstrap migration functions used by
  `database.bootstrap`.
- `env.py`, `script.py.mako`, and `versions/` provide an Alembic-compatible
  structure for future SQLAlchemy migrations.

The current application still initializes SQLite/Postgres schemas through
`database.bootstrap.init_db()`.
