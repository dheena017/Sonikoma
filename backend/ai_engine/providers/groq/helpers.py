"""
backend/app/providers/groq/helpers.py
─────────────────────────────────────────────────────────────────────────────
Request header and payload formatting helpers for Groq Cloud API.
─────────────────────────────────────────────────────────────────────────────
"""

from typing import List, Dict, Any, Optional


def build_groq_headers(api_key: str) -> Dict[str, str]:
    """Construct Authorization and Content-Type headers for Groq API."""
    return {
        "Authorization": f"Bearer {api_key.strip()}",
        "Content-Type": "application/json",
    }


def build_groq_payload(
    messages: List[Dict[str, str]],
    model: str = "llama-3.3-70b-versatile",
    temperature: float = 0.6,
    max_tokens: Optional[int] = None,
) -> Dict[str, Any]:
    """Build the JSON payload body for Groq chat completions."""
    payload: Dict[str, Any] = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
    }
    if max_tokens is not None:
        payload["max_tokens"] = max_tokens
    return payload
