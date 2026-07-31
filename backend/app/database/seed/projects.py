"""Project seed helpers."""

from __future__ import annotations

from database.health import ensure_user_exists


def seed_demo_project(conn, user_id: str = "system_default") -> str:
    """Create a small demo series/chapter pair if it does not exist."""
    ensure_user_exists(conn, user_id, fallback_username="system")
    series_id = "demo_series"
    chapter_id = "demo_chapter"

    conn.execute(
        """
        INSERT OR IGNORE INTO series
            (id, user_id, title, slug, author, genre, synopsis)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            series_id,
            user_id,
            "Demo Series",
            "demo-series",
            "Sonikoma",
            "demo",
            "A seed series used for local development.",
        ),
    )
    conn.execute(
        """
        INSERT OR IGNORE INTO chapters
            (id, series_id, episode_number, slug, status, panels_count)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (chapter_id, series_id, "1", "demo-series-1", "pending", 0),
    )
    conn.commit()
    return chapter_id
