"""FastAPI database dependencies."""

from __future__ import annotations

from typing import Generator

from database.engine import get_db_connection
from database.session import get_session


def get_db():
    """Yield the existing raw DB connection used by repository modules."""
    conn = get_db_connection()
    try:
        yield conn
    finally:
        conn.close()


def get_db_session() -> Generator:
    """Yield an SQLAlchemy session for newer repository code."""
    session = get_session()
    try:
        yield session
    finally:
        session.close()
