"""
backend/app/providers/deepseek/client.py
─────────────────────────────────────────────────────────────────────────────
DeepSeek AI Provider Client:
- Models: deepseek-chat (V3), deepseek-reasoner (R1)
─────────────────────────────────────────────────────────────────────────────
"""

import os
import logging
from typing import Optional, Any, Dict, List, Union
import httpx

from ai_engine.providers.deepseek.types import DeepSeekModel, DeepSeekMessage
from ai_engine.providers.deepseek.helpers import build_deepseek_headers, build_chat_payload

logger = logging.getLogger("sonikoma.providers.deepseek.client")


class DeepSeekClient:
    """Wrapper provider client for DeepSeek OpenAI-compatible API."""

    BASE_URL = "https://api.deepseek.com/v1"

    @classmethod
    def get_api_key(cls, api_key: Optional[str] = None) -> Optional[str]:
        return api_key or os.getenv("DEEPSEEK_API_KEY", "").strip() or None

    @classmethod
    async def chat_completion(
        cls,
        messages: List[Dict[str, str]],
        model: Union[DeepSeekModel, str] = DeepSeekModel.CHAT,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        api_key: Optional[str] = None,
    ) -> Optional[str]:
        key = cls.get_api_key(api_key)
        if not key:
            logger.warning("[DeepSeekClient] No DEEPSEEK_API_KEY configured.")
            return None

        model_str = model.value if isinstance(model, DeepSeekModel) else str(model)
        headers = build_deepseek_headers(key)
        payload = build_chat_payload(
            messages=messages,
            model=model_str,
            temperature=temperature,
            max_tokens=max_tokens,
        )

        try:
            async with httpx.AsyncClient(timeout=45.0) as client:
                resp = await client.post(f"{cls.BASE_URL}/chat/completions", json=payload, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    return data["choices"][0]["message"]["content"]
                else:
                    logger.warning(f"[DeepSeekClient] Request failed ({resp.status_code}): {resp.text[:100]}")
                    return None
        except Exception as exc:
            logger.error(f"[DeepSeekClient] Error: {exc}")
            return None


# Backward compatibility alias
DeepSeekProvider = DeepSeekClient
