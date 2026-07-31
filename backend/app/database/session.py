"""Database session helpers.

The application still uses raw SQLite/Postgres-compatible connections in many
repositories. This module preserves the small identifier helpers those paths
depend on and adds an optional SQLAlchemy session factory for new code.
"""

from __future__ import annotations

import datetime
import uuid
from pathlib import Path
from typing import Any, Generator

import database.config as config

try:
    from sqlalchemy import create_engine, event
    from sqlalchemy.engine import Engine
    from sqlalchemy.orm import Session, sessionmaker
except ModuleNotFoundError:
    create_engine = None  # type: ignore[assignment]
    event = None  # type: ignore[assignment]
    Engine = Any  # type: ignore[misc, assignment]
    Session = Any  # type: ignore[misc, assignment]
    sessionmaker = None  # type: ignore[assignment]


_engine: Engine | None = None
_session_factory: sessionmaker | None = None


def uuid_hex() -> str:
    """Return a short 8-character hex string from a random UUID."""
    return uuid.uuid4().hex[:8]


def datetime_now_date() -> str:
    """Return today's date formatted as YYYY-MM-DD."""
    return datetime.datetime.now().strftime("%Y-%m-%d")


def get_database_url() -> str:
    """Return the SQLAlchemy-compatible database URL for the current config."""
    if config.DATABASE_URL:
        if config.DATABASE_URL.startswith("postgres://"):
            return config.DATABASE_URL.replace("postgres://", "postgresql+psycopg2://", 1)
        if config.DATABASE_URL.startswith("postgresql://"):
            return config.DATABASE_URL.replace(
                "postgresql://", "postgresql+psycopg2://", 1
            )
        return config.DATABASE_URL

    return f"sqlite:///{Path(config.DB_PATH).as_posix()}"


def _require_sqlalchemy() -> None:
    if create_engine is None or sessionmaker is None:
        raise RuntimeError(
            "SQLAlchemy is not installed. Install project requirements before "
            "using database.session SQLAlchemy helpers."
        )


def get_engine(**engine_kwargs: Any) -> Engine:
    """Return a cached SQLAlchemy engine."""
    global _engine
    _require_sqlalchemy()

    if _engine is None:
        database_url = get_database_url()
        defaults: dict[str, Any] = {"pool_pre_ping": True}
        if database_url.startswith("sqlite"):
            defaults["connect_args"] = {"check_same_thread": False}
        defaults.update(engine_kwargs)
        _engine = create_engine(database_url, **defaults)

        if database_url.startswith("sqlite") and event is not None:

            @event.listens_for(_engine, "connect")
            def _set_sqlite_pragma(dbapi_connection, _connection_record) -> None:
                cursor = dbapi_connection.cursor()
                cursor.execute("PRAGMA foreign_keys=ON")
                cursor.close()

    return _engine


def get_session_factory() -> sessionmaker:
    """Return a cached SQLAlchemy sessionmaker."""
    global _session_factory
    _require_sqlalchemy()

    if _session_factory is None:
        _session_factory = sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=get_engine(),
        )
    return _session_factory


def get_session() -> Session:
    """Create a new SQLAlchemy Session."""
    return get_session_factory()()


def iter_session() -> Generator[Session, None, None]:
    """Yield a SQLAlchemy Session and close it afterwards."""
    session = get_session()
    try:
        yield session
    finally:
        session.close()


def dispose_engine() -> None:
    """Dispose the cached SQLAlchemy engine and reset the session factory."""
    global _engine, _session_factory
    if _engine is not None:
        _engine.dispose()
    _engine = None
    _session_factory = None
