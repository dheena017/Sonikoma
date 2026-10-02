"""
backend/app/providers/deepseek/helpers.py
─────────────────────────────────────────────────────────────────────────────
DeepSeek API request headers and payload preparation helper functions.
─────────────────────────────────────────────────────────────────────────────
"""

from typing import List, Dict, Any, Optional


def build_deepseek_headers(api_key: str) -> Dict[str, str]:
    """Construct Authorization and Content-Type headers for DeepSeek API."""
    return {
        "Authorization": f"Bearer {api_key.strip()}",
        "Content-Type": "application/json",
    }


def build_chat_payload(
    messages: List[Dict[str, str]],
    model: str = "deepseek-chat",
    temperature: float = 0.7,
    max_tokens: Optional[int] = None,
) -> Dict[str, Any]:
    """Build the JSON payload body for DeepSeek chat completions."""
    payload: Dict[str, Any] = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
    }
    if max_tokens is not None:
        payload["max_tokens"] = max_tokens
    return payload
