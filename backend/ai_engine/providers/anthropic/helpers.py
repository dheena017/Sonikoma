"""
backend/app/providers/anthropic/helpers.py
─────────────────────────────────────────────────────────────────────────────
Payload formatting and message normalization helpers for Anthropic Claude.
─────────────────────────────────────────────────────────────────────────────
"""

from typing import List, Dict, Any, Optional


def normalize_messages(messages: List[Dict[str, str]]) -> List[Dict[str, str]]:
    """Ensure messages alternate properly and have stripped string content."""
    clean = []
    for msg in messages:
        clean.append({
            "role": str(msg.get("role", "user")),
            "content": str(msg.get("content", "")).strip(),
        })
    return clean


def build_message_params(
    messages: List[Dict[str, str]],
    model: str,
    max_tokens: int = 2048,
    system: Optional[str] = None,
    temperature: Optional[float] = None,
) -> Dict[str, Any]:
    """Build kwargs dictionary for messages.create call."""
    params: Dict[str, Any] = {
        "model": model,
        "messages": normalize_messages(messages),
        "max_tokens": max_tokens,
    }
    if system:
        params["system"] = system
    if temperature is not None:
        params["temperature"] = temperature
    return params
