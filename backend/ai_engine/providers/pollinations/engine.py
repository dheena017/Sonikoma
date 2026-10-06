"""
backend/app/providers/pollinations/engine.py
─────────────────────────────────────────────────────────────────────────────
Pollinations AI execution engine: multi-model diffusion runner & fallback executor.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import Optional, Tuple, Union
from ai_engine.providers.pollinations.client import PollinationsClient
from ai_engine.providers.pollinations.types import PollinationsModel

logger = logging.getLogger("sonikoma.providers.pollinations.engine")


class PollinationsEngine:
    """Execution engine coordinating multi-model diffusion synthesis with fallback recovery."""

    def __init__(self, default_model: Union[PollinationsModel, str] = PollinationsModel.FLUX_ANIME):
        self.default_model = default_model

    async def generate_panel(
        self,
        prompt: str,
        width: int = 768,
        height: int = 1024,
        model: Optional[Union[PollinationsModel, str]] = None,
        seed: Optional[int] = None,
        timeout: float = 25.0,
    ) -> Tuple[Optional[bytes], Optional[str], Optional[str]]:
        """Generate panel image across Pollinations fallback candidates."""
        target_model = model or self.default_model
        return await PollinationsClient.generate_image(
            prompt=prompt,
            model=target_model,
            width=width,
            height=height,
            seed=seed,
            timeout=timeout,
        )


_pollinations_engine_instance: Optional[PollinationsEngine] = None


def get_pollinations_engine() -> PollinationsEngine:
    global _pollinations_engine_instance
    if _pollinations_engine_instance is None:
        _pollinations_engine_instance = PollinationsEngine()
    return _pollinations_engine_instance
