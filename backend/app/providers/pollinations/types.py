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
    "flux-anime": ["flux-anime", "turbo", "stable-diffusion", "flux"],
    "turbo": ["turbo", "flux-anime", "stable-diffusion", "flux"],
    "flux": ["flux", "flux-anime", "turbo", "stable-diffusion"],
    "flux-realism": ["flux-realism", "flux", "turbo"],
    "stable-diffusion": ["stable-diffusion", "turbo", "flux-anime"],
    "sana": ["sana", "turbo", "flux-anime"],
}
