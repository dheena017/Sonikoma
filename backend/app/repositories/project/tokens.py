"""
backend/app/repositories/project/tokens.py
─────────────────────────────────────────────────────────────────────────────
Token usage and LLM costs logging operations.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import List, Dict, Any, Optional

from database.engine import get_db_connection

logger = logging.getLogger("sonikoma.repositories.project.tokens")


def insert_token_log(
    log_id: str,
    project_id: str,
    input_tokens: int,
    output_tokens: int,
    total_tokens: int,
    estimated_cost_usd: float,
    job_id: Optional[str] = None,
) -> None:
    """
    Inserts a new token usage log entry with project_id and job_id attribution.
    """
    conn = get_db_connection()
    try:
        if not job_id:
            try:
                ch = conn.execute("SELECT job_id FROM chapters WHERE id = ?", (project_id,)).fetchone()
                if ch and ch["job_id"]:
                    job_id = ch["job_id"]
            except Exception:
                pass
        conn.execute("""
            INSERT INTO token_usage_logs (id, project_id, job_id, input_tokens, output_tokens, total_tokens, estimated_cost_usd)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (log_id, project_id, job_id, input_tokens, output_tokens, total_tokens, estimated_cost_usd))
        conn.commit()
    except Exception as e:
        logger.error(f"Failed to insert token usage log: {e}")
    finally:
        conn.close()


def get_token_logs(user_id: str) -> List[Dict[str, Any]]:
    """
    Retrieves token usage logs for all projects owned by the user.
    """
    conn = get_db_connection()
    try:
        rows = conn.execute("""
            SELECT l.*, p.title
            FROM token_usage_logs l
            JOIN projects p ON l.project_id = p.project_id
            WHERE p.user_id = ?
            ORDER BY l.created_at DESC
        """, (user_id,)).fetchall()
        return [dict(r) for r in rows]
    except Exception:
        try:
            rows = conn.execute("""
                SELECT l.*, c.episode_number, s.title
                FROM token_usage_logs l
                JOIN chapters c ON l.project_id = c.id
                JOIN series s ON c.series_id = s.id
                WHERE s.user_id = ?
                ORDER BY l.created_at DESC
            """, (user_id,)).fetchall()
            return [dict(r) for r in rows]
        except Exception as e:
            logger.error(f"Failed to fetch token logs: {e}")
            return []
    finally:
        conn.close()
