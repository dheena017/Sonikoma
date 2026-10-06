"""
backend/app/providers/pollinations/client.py
─────────────────────────────────────────────────────────────────────────────
Pollinations AI Generative Diffusion Provider:
- Multi-model routing: flux-anime, turbo, flux, flux-realism, stable-diffusion, sana
- Dynamic URL generation and direct binary streaming with retry fallback
─────────────────────────────────────────────────────────────────────────────
"""

import os
import logging
import asyncio
from typing import Optional, List, Dict, Any, Tuple, Union
import httpx

from ai_engine.providers.pollinations.types import PollinationsModel, MODEL_FALLBACK_CHAINS
from ai_engine.providers.pollinations.helpers import build_pollinations_url, DEFAULT_BASE_URL

logger = logging.getLogger("sonikoma.providers.pollinations.client")


class PollinationsClient:
    """Wrapper provider client for Pollinations.ai generative diffusion models."""

    DEFAULT_BASE_URL = DEFAULT_BASE_URL
    MODEL_FALLBACK_CHAINS = MODEL_FALLBACK_CHAINS

    @classmethod
    def build_url(
        cls,
        prompt: str,
        width: int = 768,
        height: int = 1024,
        seed: Optional[int] = None,
        model: Union[PollinationsModel, str] = "flux-anime",
        enhance: bool = False,
        nologo: bool = True,
    ) -> str:
        model_str = model.value if isinstance(model, PollinationsModel) else str(model)
        return build_pollinations_url(
            prompt=prompt,
            width=width,
            height=height,
            seed=seed,
            model=model_str,
            enhance=enhance,
            nologo=nologo,
            base_url=cls.DEFAULT_BASE_URL,
        )

    @classmethod
    def get_fallback_chain(cls, requested_model: str) -> List[str]:
        """Returns ordered model candidate fallback list."""
        if requested_model in cls.MODEL_FALLBACK_CHAINS:
            return cls.MODEL_FALLBACK_CHAINS[requested_model]
        return [requested_model, "flux-anime", "turbo", "stable-diffusion"]

    @classmethod
    async def generate_image(
        cls,
        prompt: str,
        model: Union[PollinationsModel, str] = "flux-anime",
        width: int = 768,
        height: int = 1024,
        seed: Optional[int] = None,
        timeout: float = 25.0,
    ) -> Tuple[Optional[bytes], Optional[str], Optional[str]]:
        """
        Attempts to fetch generated image bytes across the model fallback chain.
        Returns: (image_bytes, successful_model, error_message)
        """
        model_str = model.value if isinstance(model, PollinationsModel) else str(model)
        candidates = cls.get_fallback_chain(model_str)
        last_error = None

        for candidate in candidates:
            url = cls.build_url(prompt, width=width, height=height, seed=seed, model=candidate)
            try:
                async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
                    resp = await client.get(url)
                    if resp.status_code == 200 and len(resp.content) > 1000:
                        c_type = resp.headers.get("content-type", "")
                        if "text" not in c_type and "json" not in c_type:
                            return resp.content, candidate, None
                    elif resp.status_code == 402:
                        last_error = f"Model '{candidate}': 402 Payment Required"
                        logger.warning(f"[PollinationsClient] {last_error}. Bypassing...")
                        continue
                    elif resp.status_code == 429:
                        last_error = f"Model '{candidate}': 429 Rate Limited"
                        logger.warning(f"[PollinationsClient] {last_error}. Retrying...")
                        await asyncio.sleep(0.5)
                        continue
                    else:
                        last_error = f"Model '{candidate}': HTTP {resp.status_code}"
            except Exception as ex:
                last_error = f"Model '{candidate}': Network failure ({ex})"
                logger.warning(f"[PollinationsClient] {last_error}")
                continue

        return None, None, last_error


# Backward compatibility alias
PollinationsProvider = PollinationsClient
