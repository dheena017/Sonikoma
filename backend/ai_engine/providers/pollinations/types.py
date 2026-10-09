"""
backend/app/providers/pollinations/types.py
─────────────────────────────────────────────────────────────────────────────
Pollinations model enum and fallback routing configurations.
─────────────────────────────────────────────────────────────────────────────
"""

from enum import Enum
from typing import Dict, List


class PollinationsModel(str, Enum):
    """Available Pollinations generative diffusion models."""
    FLUX_ANIME = "flux-anime"
    TURBO = "turbo"
    FLUX = "flux"
    FLUX_REALISM = "flux-realism"
    STABLE_DIFFUSION = "stable-diffusion"
    SANA = "sana"


MODEL_FALLBACK_CHAINS: Dict[str, List[str]] = {
    "flux-anime": ["flux-anime", "turbo", "flux"],
    "turbo": ["turbo", "flux-anime", "flux"],
    "flux": ["flux", "flux-anime", "turbo"],
    "flux-realism": ["flux-realism", "flux-anime", "turbo"],
    "stable-diffusion": ["stable-diffusion", "flux-anime", "turbo"],
    "sana": ["sana", "flux-anime", "turbo"],
}
