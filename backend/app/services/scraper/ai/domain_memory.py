"""
backend/app/services/scraper/ai/domain_memory.py
─────────────────────────────────────────────────────────────────────────────
Self-Healing Versioned Domain Strategy Memory.
Stores AI-learned and verified site extraction blueprints in SQLite with
confidence scores, version tracking, and self-healing invalidation on layout shifts.
─────────────────────────────────────────────────────────────────────────────
"""

import json
import logging
import datetime
from typing import Optional, Dict, List, Any
from urllib.parse import urlparse

from database.engine import get_db_connection
from .orchestrator_scraper import UniversalComicBlueprint

logger = logging.getLogger("sonikoma.scraper.memory")


class DomainStrategy:
    """Represents a versioned, learned extraction strategy for a specific domain."""
    def __init__(
        self,
        domain: str,
        blueprint: Optional[UniversalComicBlueprint] = None,
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
        """A strategy is valid if confidence >= 0.5 and failure count < 3 and status != 'blocked'."""
        return self.status != "blocked" and self.confidence >= 0.5 and self.failure_count < 3


class DomainMemory:
    """Self-healing blueprint cache and domain approval store backed by SQLite."""

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

                # Safe column migrations
                cursor = conn.cursor()
                cursor.execute("PRAGMA table_info(domain_blueprints)")
                existing_cols = {row[1] for row in cursor.fetchall()}
                if "version" not in existing_cols:
                    conn.execute("ALTER TABLE domain_blueprints ADD COLUMN version INTEGER DEFAULT 1")
                if "confidence" not in existing_cols:
                    conn.execute("ALTER TABLE domain_blueprints ADD COLUMN confidence REAL DEFAULT 1.0")
                if "strategy_id" not in existing_cols:
                    conn.execute("ALTER TABLE domain_blueprints ADD COLUMN strategy_id TEXT")
                if "last_failure_at" not in existing_cols:
                    conn.execute("ALTER TABLE domain_blueprints ADD COLUMN last_failure_at TEXT")

                conn.commit()
                cls._initialized = True
        except Exception as e:
            logger.error(f"[DomainMemory] DB initialization error: {e}")

    @classmethod
    def get_domain_from_url(cls, url: str) -> str:
        """Extracts normalized root domain (e.g. 'asuracomic.net') from any URL."""
        if not url:
            return ""
        parsed = urlparse(url if url.startswith("http") else f"https://{url}")
        host = (parsed.netloc or parsed.path).lower()
        if ":" in host:
            host = host.split(":")[0]
        if host.startswith("www."):
            host = host[4:]
        return host.strip()

    @classmethod
    def get_strategy(cls, domain_or_url: str) -> Optional[DomainStrategy]:
        """Retrieves active strategy for domain if confidence is high and failure count is low."""
        cls._ensure_table()
        domain = cls.get_domain_from_url(domain_or_url)
        if not domain:
            return None

        try:
            with get_db_connection() as conn:
                row = conn.execute(
                    "SELECT domain, blueprint_json, strategy_id, version, confidence, status, success_count, failure_count, last_success_at, last_failure_at, notes FROM domain_blueprints WHERE domain = ?",
                    (domain,)
                ).fetchone()

                if row and row["blueprint_json"] and row["blueprint_json"].strip():
                    raw_data = json.loads(row["blueprint_json"])
                    sanitized = UniversalComicBlueprint.sanitize_data(raw_data)
                    bp = UniversalComicBlueprint(**sanitized)
                    strat = DomainStrategy(
                        domain=row["domain"],
                        blueprint=bp,
                        strategy_id=row["strategy_id"],
                        version=row["version"] or 1,
                        confidence=row["confidence"] if row["confidence"] is not None else 1.0,
                        status=row["status"] or "approved",
                        success_count=row["success_count"] or 1,
                        failure_count=row["failure_count"] or 0,
                        last_success_at=row["last_success_at"],
                        last_failure_at=row["last_failure_at"],
                        notes=row["notes"]
                    )
                    return strat if strat.is_valid else None
        except Exception as e:
            logger.debug(f"[DomainMemory] get_strategy error: {e}")
        return None

    @classmethod
    def get_blueprint(cls, domain_or_url: str) -> Optional[UniversalComicBlueprint]:
        strat = cls.get_strategy(domain_or_url)
        return strat.blueprint if strat else None

    @classmethod
    def save_blueprint(
        cls,
        domain_or_url: str,
        blueprint: UniversalComicBlueprint,
        sample_url: Optional[str] = None
    ) -> None:
        """Saves a verified blueprint, incrementing version if strategy changed."""
        cls._ensure_table()
        domain = cls.get_domain_from_url(domain_or_url)
        if not domain or not blueprint:
            return

        try:
            bp_json = json.dumps(blueprint.model_dump())
            with get_db_connection() as conn:
                existing = conn.execute("SELECT version FROM domain_blueprints WHERE domain = ?", (domain,)).fetchone()
                new_ver = (existing["version"] + 1) if existing and existing["version"] else 1
                strat_id = f"{domain}_v{new_ver}"

                conn.execute("""
                INSERT INTO domain_blueprints (domain, blueprint_json, strategy_id, version, confidence, status, sample_url, success_count, failure_count, last_success_at, updated_at)
                VALUES (?, ?, ?, ?, 1.0, 'approved', ?, 1, 0, datetime('now'), datetime('now'))
                ON CONFLICT(domain) DO UPDATE SET
                    blueprint_json  = excluded.blueprint_json,
                    strategy_id     = excluded.strategy_id,
                    version         = excluded.version,
                    confidence      = 1.0,
                    failure_count   = 0,
                    sample_url      = COALESCE(excluded.sample_url, domain_blueprints.sample_url),
                    updated_at      = datetime('now')
                """, (domain, bp_json, strat_id, new_ver, sample_url))
                conn.commit()
                logger.info(f"[DomainMemory] Saved verified strategy {strat_id} for {domain}")
        except Exception as e:
            logger.error(f"[DomainMemory] Failed to save blueprint: {e}")

    @classmethod
    def record_success(cls, domain_or_url: str) -> None:
        """Self-healing: Increments success counter, lowers failure count, raises confidence."""
        cls._ensure_table()
        domain = cls.get_domain_from_url(domain_or_url)
        if not domain:
            return
        try:
            with get_db_connection() as conn:
                conn.execute("""
                UPDATE domain_blueprints
                SET success_count = success_count + 1,
                    failure_count = 0,
                    confidence = MIN(1.0, confidence + 0.1),
                    last_success_at = datetime('now'),
                    updated_at = datetime('now')
                WHERE domain = ?
                """, (domain,))
                conn.commit()
        except Exception:
            pass

    @classmethod
    def record_failure(cls, domain_or_url: str) -> None:
        """Self-healing: Increments failure count; invalidates strategy if failures >= 2."""
        cls._ensure_table()
        domain = cls.get_domain_from_url(domain_or_url)
        if not domain:
            return
        try:
            with get_db_connection() as conn:
                row = conn.execute("SELECT failure_count FROM domain_blueprints WHERE domain = ?", (domain,)).fetchone()
                if row:
                    new_fails = (row["failure_count"] or 0) + 1
                    # Invalidate confidence if consecutive failures occur
                    new_conf = 0.0 if new_fails >= 2 else 0.5
                    conn.execute("""
                    UPDATE domain_blueprints
                    SET failure_count = ?,
                        confidence = ?,
                        last_failure_at = datetime('now'),
                        updated_at = datetime('now')
                    WHERE domain = ?
                    """, (new_fails, new_conf, domain))
                    conn.commit()
                    if new_fails >= 2:
                        logger.warning(f"[DomainMemory] Strategy for {domain} INVALIDATED due to {new_fails} consecutive execution failures. Relearning scheduled.")
        except Exception:
            pass

    @classmethod
    def get_domain_status(cls, domain_or_url: str) -> str:
        """Returns 'approved', 'pending', or 'blocked'."""
        cls._ensure_table()
        domain = cls.get_domain_from_url(domain_or_url)
        if not domain:
            return "pending"
        try:
            with get_db_connection() as conn:
                row = conn.execute("SELECT status FROM domain_blueprints WHERE domain = ?", (domain,)).fetchone()
                if row and row["status"]:
                    return row["status"].lower()
        except Exception:
            pass
        return "approved"

    @classmethod
    def list_domains(cls, status: Optional[str] = None) -> List[Dict[str, Any]]:
        cls._ensure_table()
        try:
            with get_db_connection() as conn:
                query = "SELECT * FROM domain_blueprints"
                params = []
                if status:
                    query += " WHERE LOWER(status) = ?"
                    params.append(status.lower())
                query += " ORDER BY updated_at DESC"
                rows = conn.execute(query, tuple(params)).fetchall()
                out = []
                for r in rows:
                    bp = None
                    if r["blueprint_json"]:
                        try:
                            bp = json.loads(r["blueprint_json"])
                        except Exception:
                            pass
                    out.append({
                        "domain": r["domain"],
                        "status": r["status"] or "approved",
                        "strategy_id": r["strategy_id"],
                        "version": r["version"] or 1,
                        "confidence": r["confidence"] or 1.0,
                        "blueprint": bp,
                        "success_count": r["success_count"] or 0,
                        "failure_count": r["failure_count"] or 0,
                        "sample_url": r["sample_url"],
                        "notes": r["notes"],
                        "last_success_at": r["last_success_at"],
                        "created_at": r["created_at"],
                        "updated_at": r["updated_at"]
                    })
                return out
        except Exception as e:
            logger.error(f"[DomainMemory] list_domains error: {e}")
            return []

    @classmethod
    def set_domain_status(
        cls,
        domain_or_url: str,
        status: str,
        sample_url: Optional[str] = None,
        notes: Optional[str] = None,
        blueprint: Optional[UniversalComicBlueprint] = None
    ) -> None:
        cls._ensure_table()
        domain = cls.get_domain_from_url(domain_or_url)
        if not domain:
            return
        bp_json = json.dumps(blueprint.model_dump()) if blueprint else ""
        try:
            with get_db_connection() as conn:
                conn.execute("""
                INSERT INTO domain_blueprints (domain, status, blueprint_json, sample_url, notes, updated_at)
                VALUES (?, ?, ?, ?, ?, datetime('now'))
                ON CONFLICT(domain) DO UPDATE SET
                    status          = excluded.status,
                    blueprint_json  = CASE WHEN excluded.blueprint_json != '' THEN excluded.blueprint_json ELSE domain_blueprints.blueprint_json END,
                    sample_url      = COALESCE(excluded.sample_url, domain_blueprints.sample_url),
                    notes           = COALESCE(excluded.notes, domain_blueprints.notes),
                    updated_at      = datetime('now')
                """, (domain, status.lower(), bp_json, sample_url, notes))
                conn.commit()
        except Exception as e:
            logger.error(f"[DomainMemory] set_domain_status error: {e}")

    @classmethod
    def request_domain(cls, url: str, requested_by: str = "user", notes: Optional[str] = None) -> str:
        cls._ensure_table()
        domain = cls.get_domain_from_url(url)
        if not domain:
            return ""
        try:
            with get_db_connection() as conn:
                conn.execute("""
                INSERT INTO domain_blueprints (domain, status, requested_by, sample_url, notes, blueprint_json, created_at, updated_at)
                VALUES (?, 'pending', ?, ?, ?, '', datetime('now'), datetime('now'))
                ON CONFLICT(domain) DO UPDATE SET
                    requested_by    = COALESCE(excluded.requested_by, domain_blueprints.requested_by),
                    sample_url      = COALESCE(excluded.sample_url, domain_blueprints.sample_url),
                    notes           = COALESCE(excluded.notes, domain_blueprints.notes),
                    updated_at      = datetime('now')
                """, (domain, requested_by, url, notes))
                conn.commit()
        except Exception as e:
            logger.error(f"[DomainMemory] request_domain error: {e}")
        return domain

    @classmethod
    def delete_domain(cls, domain: str) -> None:
        cls._ensure_table()
        try:
            with get_db_connection() as conn:
                conn.execute("DELETE FROM domain_blueprints WHERE domain = ?", (domain.lower().replace("www.", ""),))
                conn.commit()
        except Exception as e:
            logger.error(f"[DomainMemory] delete_domain error: {e}")
