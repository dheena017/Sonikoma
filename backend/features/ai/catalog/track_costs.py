"""
backend/features/ai/catalog/track_costs.py
─────────────────────────────────────────────────────────────────────────────
Counts token consumption and calculates coin/credit deductions.
─────────────────────────────────────────────────────────────────────────────
"""

from typing import Dict, Any


# ── Internal Helpers ─────────────────────────────────────────────────────────

def _get_price_per_million(model_name: str) -> Dict[str, float]:
    """Returns estimated USD per 1M input and output tokens."""
    lower = model_name.lower()
    if "pro" in lower or "gpt-4" in lower or "opus" in lower:
        return {"input_per_m": 2.50, "output_per_m": 10.00, "credit_rate": 5}
    elif "flash" in lower or "mini" in lower or "haiku" in lower:
        return {"input_per_m": 0.15, "output_per_m": 0.60, "credit_rate": 1}
    else:
        return {"input_per_m": 1.00, "output_per_m": 3.00, "credit_rate": 2}


# ── Public API ───────────────────────────────────────────────────────────────

def calculate_token_cost(
    words_in: int,
    words_out: int,
    model_name: str
) -> Dict[str, Any]:
    """Calculates token costs and credits needed for an AI generation."""
    # Rough estimate: 1 word ~ 1.33 tokens
    tokens_in = int(words_in * 1.33)
    tokens_out = int(words_out * 1.33)
    total_tokens = tokens_in + tokens_out

    rates = _get_price_per_million(model_name)
    cost_usd = (tokens_in / 1_000_000 * rates["input_per_m"]) + (tokens_out / 1_000_000 * rates["output_per_m"])
    credits_needed = max(1, int(total_tokens / 500 * rates["credit_rate"]))

    return {
        "model": model_name,
        "input_tokens": tokens_in,
        "output_tokens": tokens_out,
        "total_tokens": total_tokens,
        "estimated_cost_usd": round(cost_usd, 6),
        "credits_deducted": credits_needed
    }


def log_ai_token_usage(
    user_id: str = "default_user",
    provider: str = "google",
    model: str = "gemini",
    feature: str = "general",
    prompt_tokens: int = 0,
    completion_tokens: int = 0,
    cost_usd: float = 0.0,
    **kwargs
) -> None:
    """Records token usage metrics for an AI call into SQLite for auditing."""
    try:
        from database.engine import get_db_connection
        import time
        with get_db_connection() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS ai_token_usage_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT,
                    provider TEXT,
                    model TEXT,
                    feature TEXT,
                    prompt_tokens INTEGER,
                    completion_tokens INTEGER,
                    cost_usd REAL,
                    timestamp REAL
                )
                """
            )
            conn.execute(
                """
                INSERT INTO ai_token_usage_logs (user_id, provider, model, feature, prompt_tokens, completion_tokens, cost_usd, timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (user_id, provider, model, feature, prompt_tokens, completion_tokens, cost_usd, time.time())
            )
            conn.commit()
    except Exception:
        pass


__all__ = ["calculate_token_cost", "log_ai_token_usage"]
