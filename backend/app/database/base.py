"""SQLAlchemy declarative base."""

from __future__ import annotations

try:
    from sqlalchemy import MetaData
    from sqlalchemy.orm import DeclarativeBase
except ModuleNotFoundError:
    MetaData = None  # type: ignore[assignment]
    DeclarativeBase = object  # type: ignore[assignment]


NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


if MetaData is None:

    class Base:  # type: ignore[no-redef]
        metadata = None
else:

    class Base(DeclarativeBase):  # type: ignore[no-redef]
        metadata = MetaData(naming_convention=NAMING_CONVENTION)


def require_sqlalchemy() -> None:
    """Raise a helpful error if SQLAlchemy is unavailable."""
    if MetaData is None:
        raise RuntimeError(
            "SQLAlchemy is not installed. Install project requirements before "
            "using database models."
        )
