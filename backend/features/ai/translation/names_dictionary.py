"""
Character and terminology dictionary for comic translation continuity.

Stores standard translation pairs for character names, weapon titles,
ranks, and attack spells so they are translated consistently across chapters.
"""

from typing import Dict
import json
import logging
from database.engine import get_db_connection

logger = logging.getLogger("sonikoma.features.ai.translation.names")


def _validate_words(words: Dict[str, str]) -> Dict[str, str]:
    """Cleans whitespace and validates word dictionary pairs."""
    cleaned = {}
    for k, v in (words or {}).items():
        if k and str(k).strip() and v and str(v).strip():
            cleaned[str(k).strip()] = str(v).strip()
    return cleaned


def _ensure_dictionary_table() -> None:
    try:
        with get_db_connection() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS series_name_dictionary (
                    series_id TEXT,
                    language  TEXT,
                    term_map  TEXT,
                    PRIMARY KEY (series_id, language)
                )
                """
            )
            conn.commit()
    except Exception as e:
        logger.warning(f"Error ensuring name dictionary table: {e}")


def get_names(series_id: str, language: str) -> Dict[str, str]:
    """Returns canonical name and term translations for the series and target language."""
    _ensure_dictionary_table()
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT term_map FROM series_name_dictionary WHERE series_id = ? AND language = ?",
                (series_id, language.lower())
            )
            row = cursor.fetchone()
            if row and row[0]:
                return json.loads(row[0])
    except Exception as e:
        logger.error(f"Error loading name dictionary: {e}")
    return {}


def save_names(series_id: str, language: str, word_pairs: Dict[str, str]) -> Dict[str, str]:
    """Saves updated name and term translations to the dictionary."""
    _ensure_dictionary_table()
    validated = _validate_words(word_pairs)
    try:
        with get_db_connection() as conn:
            conn.execute(
                """
                INSERT INTO series_name_dictionary (series_id, language, term_map)
                VALUES (?, ?, ?)
                ON CONFLICT(series_id, language) DO UPDATE SET term_map = excluded.term_map
                """,
                (series_id, language.lower(), json.dumps(validated))
            )
            conn.commit()
    except Exception as e:
        logger.error(f"Error saving name dictionary: {e}")
    return validated


__all__ = ["get_names", "save_names"]
