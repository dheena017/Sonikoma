"""
backend/app/services/scraper/ai/domain_memory.py
─────────────────────────────────────────────────────────────────────────────
Self-Healing Domain Memory & Blueprint Cache
Persists AI-discovered domain extraction blueprints in SQLite so subsequent
scrapes from the same website execute in < 300ms without redundant AI calls.
Includes automatic self-healing layout-shift recovery.
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
                    status          TEXT DEFAULT 'approved',
                    requested_by    TEXT,
                    sample_url      TEXT,
                    notes           TEXT,
                    success_count   INTEGER DEFAULT 1,
                    failure_count   INTEGER DEFAULT 0,
                    last_success_at TEXT,
                    created_at      TEXT DEFAULT (datetime('now')),
                    updated_at      TEXT DEFAULT (datetime('now'))
                )
                """)
                conn.execute("CREATE INDEX IF NOT EXISTS idx_domain_blueprints_domain ON domain_blueprints(domain)")

                # Safe column migrations if table previously existed without new columns
                cursor = conn.cursor()
                cursor.execute("PRAGMA table_info(domain_blueprints)")
                existing_cols = {row[1] for row in cursor.fetchall()}
                if "status" not in existing_cols:
                    conn.execute("ALTER TABLE domain_blueprints ADD COLUMN status TEXT DEFAULT 'approved'")
                if "requested_by" not in existing_cols:
                    conn.execute("ALTER TABLE domain_blueprints ADD COLUMN requested_by TEXT")
                if "sample_url" not in existing_cols:
                    conn.execute("ALTER TABLE domain_blueprints ADD COLUMN sample_url TEXT")
                if "notes" not in existing_cols:
                    conn.execute("ALTER TABLE domain_blueprints ADD COLUMN notes TEXT")

                # Clean up legacy test domains and duplicate 'www.' prefixes
                conn.execute("DELETE FROM domain_blueprints WHERE domain LIKE '%test%' OR domain = 'example.com' OR domain LIKE 'www.%'")

                # Seed/sync all real production platform domains from AdapterRegistry
                try:
                    from ..adapters.registry import AdapterRegistry
                    for meta in AdapterRegistry.get_all_adapters_meta():
                        for d in meta.get("supported_domains", []):
                            clean_d = d.lower().replace("www.", "")
                            conn.execute("""
                            INSERT OR IGNORE INTO domain_blueprints (domain, blueprint_json, status, sample_url, notes, success_count)
                            VALUES (?, '', 'approved', ?, ?, 10)
                            """, (clean_d, f"https://{clean_d}/...", f"{meta['name']} Official Adapter: {meta['description']}"))
                except Exception as e:
                    logger.debug(f"[DomainMemory] Dynamic adapter seed notice: {e}")

                conn.commit()
                cls._initialized = True
        except Exception as e:
            logger.warning(f"[DomainMemory] Table verification notice: {e}")

    @classmethod
    def get_domain_from_url(cls, url: str) -> str:
        try:
            netloc = urlparse(url).netloc.lower()
            return netloc.replace("www.", "") if netloc.startswith("www.") else netloc
        except:
            return ""

    @classmethod
    def get_domain_status(cls, domain_or_url: str) -> str:
        """Returns 'approved', 'pending', 'blocked', or 'unregistered'."""
        cls._ensure_table()
        domain = cls.get_domain_from_url(domain_or_url) if "://" in domain_or_url else domain_or_url.lower()
        if domain.startswith("www."):
            domain = domain[4:]
        if not domain:
            return "unregistered"

        try:
            with get_db_connection() as conn:
                row = conn.execute(
                    "SELECT status FROM domain_blueprints WHERE domain = ? OR domain = ?",
                    (domain, f"www.{domain}")
                ).fetchone()
                if not row or not row["status"]:
                    return "unregistered"
                return row["status"].lower()
        except Exception as e:
            logger.debug(f"[DomainMemory] Status lookup notice: {e}")
            return "unregistered"

    @classmethod
    def get_domain_record(cls, domain_or_url: str) -> Optional[Dict[str, Any]]:
        """Retrieves full domain configuration record."""
        cls._ensure_table()
        domain = cls.get_domain_from_url(domain_or_url) if "://" in domain_or_url else domain_or_url.lower()
        if domain.startswith("www."):
            domain = domain[4:]
        if not domain:
            return None

        try:
            with get_db_connection() as conn:
                row = conn.execute(
                    "SELECT * FROM domain_blueprints WHERE domain = ? OR domain = ?",
                    (domain, f"www.{domain}")
                ).fetchone()
                if not row:
                    return None
                
                bp_dict = None
                try:
                    if row["blueprint_json"]:
                        bp_dict = json.loads(row["blueprint_json"])
                except:
                    pass

                return {
                    "domain": row["domain"],
                    "status": row["status"] or "approved",
                    "blueprint": bp_dict,
                    "success_count": row["success_count"] or 0,
                    "failure_count": row["failure_count"] or 0,
                    "requested_by": row["requested_by"],
                    "sample_url": row["sample_url"],
                    "notes": row["notes"],
                    "last_success_at": row["last_success_at"],
                    "created_at": row["created_at"],
                    "updated_at": row["updated_at"]
                }
        except Exception as e:
            logger.debug(f"[DomainMemory] Record lookup notice: {e}")
            return None

    @classmethod
    def list_domains(cls, status: Optional[str] = None) -> List[Dict[str, Any]]:
        """Lists all registered domain blueprints filtered by approval status."""
        cls._ensure_table()
        try:
            with get_db_connection() as conn:
                if status:
                    rows = conn.execute(
                        "SELECT * FROM domain_blueprints WHERE status = ? ORDER BY updated_at DESC",
                        (status.lower(),)
                    ).fetchall()
                else:
                    rows = conn.execute(
                        "SELECT * FROM domain_blueprints ORDER BY updated_at DESC"
                    ).fetchall()

                records = []
                for row in rows:
                    bp_dict = None
                    try:
                        if row["blueprint_json"]:
                            bp_dict = json.loads(row["blueprint_json"])
                    except:
                        pass

                    records.append({
                        "domain": row["domain"],
                        "status": row["status"] or "approved",
                        "blueprint": bp_dict,
                        "success_count": row["success_count"] or 0,
                        "failure_count": row["failure_count"] or 0,
                        "requested_by": row["requested_by"],
                        "sample_url": row["sample_url"],
                        "notes": row["notes"],
                        "last_success_at": row["last_success_at"],
                        "created_at": row["created_at"],
                        "updated_at": row["updated_at"]
                    })
                return records
        except Exception as e:
            logger.warning(f"[DomainMemory] List domains notice: {e}")
            return []

    @classmethod
    def get_blueprint(cls, domain_or_url: str) -> Optional[UniversalComicBlueprint]:
        """Retrieves cached domain blueprint with sub-5ms SQLite read."""
        cls._ensure_table()
        domain = cls.get_domain_from_url(domain_or_url) if "://" in domain_or_url else domain_or_url.lower()
        if domain.startswith("www."):
            domain = domain[4:]
        if not domain:
            return None

        try:
            with get_db_connection() as conn:
                row = conn.execute(
                    "SELECT blueprint_json, failure_count, status FROM domain_blueprints WHERE domain = ? OR domain = ?",
                    (domain, f"www.{domain}")
                ).fetchone()
                if not row or not row["blueprint_json"]:
                    return None

                # Disallow blocked domains
                if (row["status"] or "").lower() == "blocked":
                    return None

                data = json.loads(row["blueprint_json"])
                fail_cnt = row["failure_count"] if row["failure_count"] is not None else 0
                if fail_cnt >= 3:
                    logger.info(f"[DomainMemory] Blueprint for domain {domain} is marked stale (failures={fail_cnt}). Triggering self-heal.")
                    return None

                sanitized = UniversalComicBlueprint.sanitize_data(data)
                bp = UniversalComicBlueprint(**sanitized)
                if len(bp.sample_image_urls) == 0:
                    try:
                        job_row = conn.execute(
                            "SELECT result FROM jobs WHERE metadata LIKE ? AND status = 'COMPLETED' AND type = 'SCRAPE_CHAPTER' ORDER BY created_at DESC LIMIT 1",
                            (f"%{domain}%",)
                        ).fetchone()
                        if job_row and job_row["result"]:
                            j_res = json.loads(job_row["result"])
                            if isinstance(j_res, dict) and "images" in j_res and len(j_res["images"]) > 0:
                                samples = [img["url"] for img in j_res["images"][:3] if isinstance(img, dict) and img.get("url")]
                                if samples:
                                    bp.sample_image_urls = samples
                                    bp.total_sample_images = len(samples)
                    except Exception:
                        pass
                return bp
        except Exception as e:
            logger.debug(f"[DomainMemory] Cache lookup notice for {domain}: {e}")
            return None

    @classmethod
    def save_blueprint(
        cls,
        domain_or_url: str,
        blueprint: UniversalComicBlueprint,
        status: str = "approved",
        sample_url: Optional[str] = None,
        notes: Optional[str] = None
    ):
        """Saves or updates a domain blueprint in memory."""
        cls._ensure_table()
        domain = cls.get_domain_from_url(domain_or_url) if "://" in domain_or_url else domain_or_url.lower()
        if domain.startswith("www."):
            domain = domain[4:]
        if not domain or not blueprint:
            return

        now = datetime.datetime.now().isoformat()
        blueprint_json = blueprint.model_dump_json()

        try:
            with get_db_connection() as conn:
                conn.execute("""
                INSERT INTO domain_blueprints (domain, blueprint_json, status, sample_url, notes, success_count, failure_count, last_success_at, updated_at)
                VALUES (?, ?, ?, ?, ?, 1, 0, ?, ?)
                ON CONFLICT(domain) DO UPDATE SET
                    blueprint_json = excluded.blueprint_json,
                    status = excluded.status,
                    sample_url = COALESCE(excluded.sample_url, domain_blueprints.sample_url),
                    notes = COALESCE(excluded.notes, domain_blueprints.notes),
                    success_count = domain_blueprints.success_count + 1,
                    failure_count = 0,
                    last_success_at = excluded.last_success_at,
                    updated_at = excluded.updated_at
                """, (domain, blueprint_json, status, sample_url, notes, now, now))
                conn.commit()
                logger.debug(f"[DomainMemory] Saved domain blueprint for: {domain} (status={status})")
        except Exception as e:
            logger.warning(f"[DomainMemory] Failed to save blueprint for {domain}: {e}")

    @classmethod
    def set_domain_status(
        cls,
        domain_or_url: str,
        status: str,
        sample_url: Optional[str] = None,
        requested_by: Optional[str] = None,
        notes: Optional[str] = None,
        blueprint: Optional[UniversalComicBlueprint] = None
    ):
        """Sets or updates the approval status of a domain."""
        cls._ensure_table()
        domain = cls.get_domain_from_url(domain_or_url) if "://" in domain_or_url else domain_or_url.lower()
        if domain.startswith("www."):
            domain = domain[4:]
        if not domain:
            return

        now = datetime.datetime.now().isoformat()
        bp_json = blueprint.model_dump_json() if blueprint else None

        try:
            with get_db_connection() as conn:
                if bp_json:
                    conn.execute("""
                    INSERT INTO domain_blueprints (domain, blueprint_json, status, sample_url, requested_by, notes, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(domain) DO UPDATE SET
                        blueprint_json = excluded.blueprint_json,
                        status = excluded.status,
                        sample_url = COALESCE(excluded.sample_url, domain_blueprints.sample_url),
                        requested_by = COALESCE(excluded.requested_by, domain_blueprints.requested_by),
                        notes = COALESCE(excluded.notes, domain_blueprints.notes),
                        updated_at = excluded.updated_at
                    """, (domain, bp_json, status, sample_url, requested_by, notes, now))
                else:
                    conn.execute("""
                    INSERT INTO domain_blueprints (domain, blueprint_json, status, sample_url, requested_by, notes, updated_at)
                    VALUES (?, '', ?, ?, ?, ?, ?)
                    ON CONFLICT(domain) DO UPDATE SET
                        status = excluded.status,
                        sample_url = COALESCE(excluded.sample_url, domain_blueprints.sample_url),
                        requested_by = COALESCE(excluded.requested_by, domain_blueprints.requested_by),
                        notes = COALESCE(excluded.notes, domain_blueprints.notes),
                        updated_at = excluded.updated_at
                    """, (domain, status, sample_url, requested_by, notes, now))
                conn.commit()
        except Exception as e:
            logger.warning(f"[DomainMemory] Error setting status for {domain}: {e}")

    @classmethod
    def request_domain(cls, url: str, requested_by: Optional[str] = None, notes: Optional[str] = None) -> str:
        """Enqueues a user-requested domain into pending review state."""
        cls._ensure_table()
        domain = cls.get_domain_from_url(url)
        if domain.startswith("www."):
            domain = domain[4:]
        if not domain:
            return ""

        now = datetime.datetime.now().isoformat()
        try:
            with get_db_connection() as conn:
                conn.execute("""
                INSERT INTO domain_blueprints (domain, blueprint_json, status, sample_url, requested_by, notes, updated_at)
                VALUES (?, '', 'pending', ?, ?, ?, ?)
                ON CONFLICT(domain) DO UPDATE SET
                    sample_url = excluded.sample_url,
                    requested_by = COALESCE(excluded.requested_by, domain_blueprints.requested_by),
                    notes = COALESCE(excluded.notes, domain_blueprints.notes),
                    updated_at = excluded.updated_at
                """, (domain, url, requested_by, notes, now))
                conn.commit()
                return domain
        except Exception as e:
            logger.warning(f"[DomainMemory] Error requesting domain {domain}: {e}")
            return domain

    @classmethod
    def delete_domain(cls, domain_or_url: str):
        """Deletes a domain configuration record."""
        cls._ensure_table()
        domain = cls.get_domain_from_url(domain_or_url) if "://" in domain_or_url else domain_or_url.lower()
        if domain.startswith("www."):
            domain = domain[4:]
        if not domain:
            return

        try:
            with get_db_connection() as conn:
                conn.execute("DELETE FROM domain_blueprints WHERE domain = ? OR domain = ?", (domain, f"www.{domain}"))
                conn.commit()
        except Exception as e:
            logger.warning(f"[DomainMemory] Error deleting domain {domain}: {e}")

    @classmethod
    def record_success(cls, domain_or_url: str):
        """Increments success count and updates last_success_at timestamp."""
        cls._ensure_table()
        domain = cls.get_domain_from_url(domain_or_url) if "://" in domain_or_url else domain_or_url.lower()
        if domain.startswith("www."):
            domain = domain[4:]
        if not domain:
            return

        try:
            with get_db_connection() as conn:
                conn.execute("""
                UPDATE domain_blueprints
                SET success_count = success_count + 1,
                    last_success_at = (datetime('now')),
                    updated_at = (datetime('now'))
                WHERE domain = ? OR domain = ?
                """, (domain, f"www.{domain}"))
                conn.commit()
        except Exception as e:
            logger.debug(f"[DomainMemory] Error recording success for {domain}: {e}")

    @classmethod
    def record_failure(cls, domain_or_url: str):
        """Increments failure count to trigger self-healing if layout shifted."""
        cls._ensure_table()
        domain = cls.get_domain_from_url(domain_or_url) if "://" in domain_or_url else domain_or_url.lower()
        if domain.startswith("www."):
            domain = domain[4:]
        if not domain:
            return

        try:
            with get_db_connection() as conn:
                conn.execute("""
                UPDATE domain_blueprints
                SET failure_count = failure_count + 1, updated_at = (datetime('now'))
                WHERE domain = ? OR domain = ?
                """, (domain, f"www.{domain}"))
                conn.commit()
        except Exception as e:
            logger.debug(f"[DomainMemory] Error recording failure for {domain}: {e}")
