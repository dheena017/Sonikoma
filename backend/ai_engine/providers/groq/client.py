"""
backend/app/providers/groq/client.py
─────────────────────────────────────────────────────────────────────────────
Groq LPU Ultra-Fast Inference Provider Client:
- Models: llama-3.3-70b-versatile, llama-3.1-8b-instant
─────────────────────────────────────────────────────────────────────────────
"""

import os
import logging
from typing import Optional, Any, Dict, List, Union
import httpx

from ai_engine.providers.groq.types import GroqModel, GroqMessage
from ai_engine.providers.groq.helpers import build_groq_headers, build_groq_payload

logger = logging.getLogger("sonikoma.providers.groq.client")


class GroqClient:
    """Wrapper provider client for Groq Cloud ultra-fast LPU inference."""

    BASE_URL = "https://api.groq.com/openai/v1"

    @classmethod
    def get_api_key(cls, api_key: Optional[str] = None) -> Optional[str]:
        return api_key or os.getenv("GROQ_API_KEY", "").strip() or None

    @classmethod
    async def chat_completion(
        cls,
        messages: List[Dict[str, str]],
        model: Union[GroqModel, str] = GroqModel.LLAMA_3_3_70B,
        temperature: float = 0.6,
        max_tokens: Optional[int] = None,
        api_key: Optional[str] = None,
    ) -> Optional[str]:
        key = cls.get_api_key(api_key)
        if not key:
            logger.warning("[GroqClient] No GROQ_API_KEY configured.")
            return None

        model_str = model.value if isinstance(model, GroqModel) else str(model)
        headers = build_groq_headers(key)
        payload = build_groq_payload(
            messages=messages,
            model=model_str,
            temperature=temperature,
            max_tokens=max_tokens,
        )

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(f"{cls.BASE_URL}/chat/completions", json=payload, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    return data["choices"][0]["message"]["content"]
                else:
                    logger.warning(f"[GroqClient] Request failed ({resp.status_code}): {resp.text[:100]}")
                    return None
        except Exception as exc:
            logger.error(f"[GroqClient] Error: {exc}")
            return None


# Backward compatibility alias
GroqProvider = GroqClient
