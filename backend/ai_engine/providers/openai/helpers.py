"""
backend/app/providers/openai/helpers.py
─────────────────────────────────────────────────────────────────────────────
Message formatting and completion parameter builders for OpenAI API.
─────────────────────────────────────────────────────────────────────────────
"""

from typing import List, Dict, Any, Optional


def sanitize_messages(messages: List[Dict[str, str]]) -> List[Dict[str, str]]:
    """Clean and strip messages content."""
    clean = []
    for msg in messages:
        clean.append({
            "role": str(msg.get("role", "user")),
            "content": str(msg.get("content", "")).strip(),
        })
    return clean


def build_completion_params(
    messages: List[Dict[str, str]],
    model: str = "gpt-4o",
    temperature: float = 0.7,
    max_tokens: Optional[int] = None,
) -> Dict[str, Any]:
    """Construct kwargs dict for chat.completions.create call."""
    params: Dict[str, Any] = {
        "model": model,
        "messages": sanitize_messages(messages),
        "temperature": temperature,
    }
    if max_tokens is not None:
        params["max_tokens"] = max_tokens
    return params
