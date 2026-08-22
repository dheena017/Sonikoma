"""
backend/app/services/scraper/domain_memory.py
─────────────────────────────────────────────────────────────────────────────
Domain Whitelist & Strategy Registry Memory.
Stores site domain records, status (approved, pending, blocked), and configuration
in SQLite with confidence scoring and health tracking.
─────────────────────────────────────────────────────────────────────────────
"""

import json
import logging
import datetime
from typing import Optional, Dict, List, Any
from urllib.parse import urlparse

try:
    from database.engine import get_db_connection
except ImportError:
    try:
        from app.database.engine import get_db_connection
    except ImportError:
        get_db_connection = None

logger = logging.getLogger("sonikoma.scraper.memory")


class DomainStrategy:
    """Represents a configuration strategy for a specific domain."""
    def __init__(
        self,
        domain: str,
        blueprint: Optional[Any] = None,
        strategy_id: Optional[str] = None,
        version: int = 1,
        confidence: float = 1.0,
        status: str = "approved",
        success_count: int = 1,
        failure_count: int = 0,
        last_success_at: Optional[str] = None,
        last_failure_at: Optional[str] = None,
        notes: Optional[str] = None
    ):
        self.domain = domain
        self.blueprint = blueprint
        self.strategy_id = strategy_id or f"{domain}_v{version}"
        self.version = version
        self.confidence = confidence
        self.status = status
        self.success_count = success_count
        self.failure_count = failure_count
        self.last_success_at = last_success_at
        self.last_failure_at = last_failure_at
        self.notes = notes

    @property
    def is_valid(self) -> bool:
        return self.status != "blocked" and self.confidence >= 0.5 and self.failure_count < 3


class DomainMemory:
    """Domain approval store and whitelist registry backed by SQLite."""

    _initialized = False

    @classmethod
    def _ensure_table(cls):
        if cls._initialized:
            return
        try:
            with get_db_connection() as conn:
                conn.execute("""
                CREATE TABLE IF NOT EXISTS domain_blueprints (
                    domain          TEXT PRIMARY KEY,
                    blueprint_json  TEXT NOT NULL,
                    strategy_id     TEXT,
                    version         INTEGER DEFAULT 1,
                    confidence      REAL DEFAULT 1.0,
                    status          TEXT DEFAULT 'approved',
                    requested_by    TEXT,
                    sample_url      TEXT,
                    notes           TEXT,
                    success_count   INTEGER DEFAULT 1,
                    failure_count   INTEGER DEFAULT 0,
                    last_success_at TEXT,
                    last_failure_at TEXT,
                    created_at      TEXT DEFAULT (datetime('now')),
                    updated_at      TEXT DEFAULT (datetime('now'))
                )
                """)
                conn.execute("CREATE INDEX IF NOT EXISTS idx_domain_blueprints_domain ON domain_blueprints(domain)")
                cls._initialized = True
        except Exception as e:
            logger.debug(f"[DomainMemory] DB Init notice: {e}")

    @classmethod
    def get_domain_from_url(cls, url: str) -> str:
        try:
            parsed = urlparse(url if "://" in url else f"https://{url}")
            domain = (parsed.netloc or parsed.path).lower().split(":")[0]
            if domain.startswith("www."):
                domain = domain[4:]
            return domain
        except Exception:
            return url.lower()

    @classmethod
    def get_domain_status(cls, url: str) -> str:
        domain = cls.get_domain_from_url(url)
        if not get_db_connection:
            return "approved"
        cls._ensure_table()
        try:
            with get_db_connection() as conn:
                row = conn.execute(
                    "SELECT status FROM domain_blueprints WHERE domain = ?", (domain,)
                ).fetchone()
                if row and row["status"]:
                    return row["status"].lower()
        except Exception as e:
            logger.debug(f"[DomainMemory] get_domain_status notice: {e}")
        return "approved"

    @classmethod
    def list_domains(cls, status: Optional[str] = None) -> List[Dict[str, Any]]:
        if not get_db_connection:
            return []
        cls._ensure_table()
        try:
            with get_db_connection() as conn:
                if status:
                    rows = conn.execute(
                        "SELECT * FROM domain_blueprints WHERE LOWER(status) = ? ORDER BY updated_at DESC",
                        (status.lower(),)
                    ).fetchall()
                else:
                    rows = conn.execute(
                        "SELECT * FROM domain_blueprints ORDER BY updated_at DESC"
                    ).fetchall()
                return [dict(r) for r in rows]
        except Exception as e:
            logger.debug(f"[DomainMemory] list_domains notice: {e}")
            return []

    @classmethod
    def request_domain(cls, url: str, requested_by: str = "user", notes: Optional[str] = None) -> str:
        domain = cls.get_domain_from_url(url)
        if not get_db_connection:
            return domain
        cls._ensure_table()
        try:
            with get_db_connection() as conn:
                conn.execute("""
                INSERT INTO domain_blueprints (domain, blueprint_json, status, requested_by, sample_url, notes, updated_at)
                VALUES (?, '{}', 'pending', ?, ?, ?, datetime('now'))
                ON CONFLICT(domain) DO UPDATE SET
                    sample_url = excluded.sample_url,
                    notes = COALESCE(excluded.notes, domain_blueprints.notes),
                    updated_at = datetime('now')
                """, (domain, requested_by, url, notes))
                conn.commit()
        except Exception as e:
            logger.debug(f"[DomainMemory] request_domain notice: {e}")
        return domain

    @classmethod
    def set_domain_status(
        cls,
        domain_or_url: str,
        status: str,
        sample_url: Optional[str] = None,
        notes: Optional[str] = None,
        blueprint: Optional[Any] = None
    ) -> bool:
        domain = cls.get_domain_from_url(domain_or_url)
        if not get_db_connection:
            return True
        cls._ensure_table()
        bp_json = json.dumps(blueprint.model_dump() if hasattr(blueprint, "model_dump") else (blueprint or {}))
        try:
            with get_db_connection() as conn:
                conn.execute("""
                INSERT INTO domain_blueprints (domain, blueprint_json, status, sample_url, notes, updated_at)
                VALUES (?, ?, ?, ?, ?, datetime('now'))
                ON CONFLICT(domain) DO UPDATE SET
                    status = excluded.status,
                    blueprint_json = CASE WHEN excluded.blueprint_json != '{}' THEN excluded.blueprint_json ELSE domain_blueprints.blueprint_json END,
                    sample_url = COALESCE(excluded.sample_url, domain_blueprints.sample_url),
                    notes = COALESCE(excluded.notes, domain_blueprints.notes),
                    updated_at = datetime('now')
                """, (domain, bp_json, status.lower(), sample_url, notes))
                conn.commit()
            return True
        except Exception as e:
            logger.error(f"[DomainMemory] set_domain_status failure: {e}")
            return False

    @classmethod
    def delete_domain(cls, domain_or_url: str) -> bool:
        domain = cls.get_domain_from_url(domain_or_url)
        if not get_db_connection:
            return True
        cls._ensure_table()
        try:
            with get_db_connection() as conn:
                conn.execute("DELETE FROM domain_blueprints WHERE domain = ?", (domain,))
                conn.commit()
            return True
        except Exception as e:
            logger.error(f"[DomainMemory] delete_domain failure: {e}")
            return False

    @classmethod
    def record_success(cls, url: str):
        pass

    @classmethod
    def record_failure(cls, url: str):
        pass
