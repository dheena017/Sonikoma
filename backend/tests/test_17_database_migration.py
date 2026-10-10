import sqlite3

from database.migrator import init_sqlite


def test_legacy_rows_migrate_to_canonical_tables_idempotently():
    conn = sqlite3.connect(":memory:")
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.executescript(
        """
        CREATE TABLE users (
            id TEXT PRIMARY KEY,
            username TEXT NOT NULL,
            email TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            credits INTEGER DEFAULT 840,
            credit_balance INTEGER DEFAULT 840,
            creator_role TEXT DEFAULT 'creator',
            created_at TEXT,
            updated_at TEXT
        );
        CREATE TABLE series (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            title TEXT NOT NULL,
            author TEXT NOT NULL,
            slug TEXT,
            created_at TEXT,
            updated_at TEXT
        );
        CREATE INDEX idx_series_created_at ON series(created_at);
        CREATE TABLE chapters (
            id TEXT PRIMARY KEY,
            series_id TEXT NOT NULL,
            episode_number TEXT NOT NULL,
            slug TEXT,
            created_at TEXT,
            updated_at TEXT
        );
        CREATE TABLE user_api_keys (
            id TEXT PRIMARY KEY,
            key_id TEXT NOT NULL UNIQUE,
            user_id TEXT NOT NULL,
            name TEXT NOT NULL,
            api_key TEXT NOT NULL UNIQUE,
            created_at TEXT
        );
        CREATE TABLE user_unlinked_youtube_channels (
            user_id TEXT NOT NULL,
            channel_id TEXT NOT NULL,
            unlinked_at TEXT,
            PRIMARY KEY (user_id, channel_id)
        );
        CREATE TABLE ai_token_usage_ledger (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            provider TEXT NOT NULL,
            model TEXT NOT NULL,
            feature TEXT NOT NULL,
            prompt_tokens INTEGER DEFAULT 0,
            completion_tokens INTEGER DEFAULT 0,
            total_tokens INTEGER DEFAULT 0,
            latency_ms REAL DEFAULT 0,
            cost_estimate_usd REAL DEFAULT 0,
            status TEXT DEFAULT 'SUCCESS',
            created_at TEXT
        );
        CREATE TABLE series_feedback_events (
            id TEXT PRIMARY KEY,
            series_id TEXT NOT NULL,
            chapter_number INTEGER,
            panel_index INTEGER,
            feedback_type TEXT NOT NULL,
            user_comment TEXT,
            applied_fix TEXT,
            created_at TEXT
        );
        CREATE TABLE system_logs (
            id INTEGER PRIMARY KEY,
            timestamp TEXT,
            message TEXT NOT NULL,
            level TEXT NOT NULL,
            module TEXT NOT NULL,
            details TEXT,
            correlation_id TEXT,
            user_id TEXT,
            snapshot TEXT,
            created_at TEXT
        );
        """
    )
    conn.execute(
        "INSERT INTO users (id, username, email, password_hash) VALUES (?, ?, ?, ?)",
        ("usr_1", "creator", "creator@example.test", "hash"),
    )
    conn.execute(
        "INSERT INTO series (id, user_id, title, author) VALUES (?, ?, ?, ?)",
        ("ser_1", "usr_1", "A Tale", "Creator"),
    )
    conn.execute(
        "INSERT INTO chapters (id, series_id, episode_number) VALUES (?, ?, ?)",
        ("ch_1", "ser_1", "Chapter 1"),
    )
    conn.execute(
        "INSERT INTO user_api_keys (id, key_id, user_id, name, api_key) VALUES (?, ?, ?, ?, ?)",
        ("legacy_key_row", "key_1", "usr_1", "Automation", "secret-value"),
    )
    conn.execute(
        "INSERT INTO user_unlinked_youtube_channels (user_id, channel_id) VALUES (?, ?)",
        ("usr_1", "channel_1"),
    )
    conn.execute(
        "INSERT INTO ai_token_usage_ledger (id, user_id, provider, model, feature) VALUES (?, ?, ?, ?, ?)",
        ("request_1", "usr_1", "google", "model-1", "story"),
    )
    conn.execute(
        "INSERT INTO series_feedback_events (id, series_id, feedback_type) VALUES (?, ?, ?)",
        ("feedback_1", "ser_1", "edit"),
    )
    conn.execute(
        "INSERT INTO system_logs (id, timestamp, message, level, module) VALUES (?, ?, ?, ?, ?)",
        (1, "12:00:00", "Legacy log", "INFO", "test"),
    )

    init_sqlite(conn)
    init_sqlite(conn)

    assert conn.execute("SELECT id FROM auth_users WHERE id = 'usr_1'").fetchone()
    assert conn.execute("SELECT id FROM platform_series WHERE id = 'ser_1'").fetchone()
    assert conn.execute("SELECT id FROM workspace_chapters WHERE id = 'ch_1'").fetchone()
    assert conn.execute("SELECT key_id FROM profile_api_keys WHERE key_id = 'key_1'").fetchone()
    assert conn.execute(
        "SELECT channel_id FROM creative_youtube_unlinked_channels WHERE channel_id = 'channel_1'"
    ).fetchone()
    ledger_row = conn.execute(
        "SELECT request_id FROM intelligence_ledger WHERE request_id = 'request_1'"
    ).fetchone()
    assert ledger_row
    feedback_row = conn.execute(
        "SELECT feedback_id FROM intelligence_feedback_events WHERE feedback_id = 'feedback_1'"
    ).fetchone()
    assert feedback_row
    log_row = conn.execute(
        "SELECT timestamp FROM platform_system_logs WHERE id = 1"
    ).fetchone()
    assert log_row and log_row["timestamp"] == "12:00:00"
    assert conn.execute("SELECT COUNT(*) FROM auth_users").fetchone()[0] == 1
    assert conn.execute("SELECT COUNT(*) FROM users").fetchone()[0] == 1
    index_row = conn.execute(
        "SELECT tbl_name FROM sqlite_master WHERE type = 'index' AND name = 'idx_platform_series_created_at'"
    ).fetchone()
    assert index_row and index_row["tbl_name"] == "platform_series"
    conn.close()


def test_fresh_database_creates_all_canonical_tables():
    conn = sqlite3.connect(":memory:")
    conn.row_factory = sqlite3.Row

    init_sqlite(conn)

    tables = {
        row[0]
        for row in conn.execute(
            "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'"
        )
    }
    assert len(tables) == 29
    assert {
        "auth_users",
        "workspace_chapters",
        "image_panels",
        "platform_series",
        "platform_jobs",
        "intelligence_ledger",
    } <= tables
    assert "users" not in tables
    conn.close()