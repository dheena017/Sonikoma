"""
backend/app/providers/pollinations/helpers.py
─────────────────────────────────────────────────────────────────────────────
URL builders and prompt encoding utilities for Pollinations AI.
─────────────────────────────────────────────────────────────────────────────
"""

import urllib.parse
from typing import Optional

DEFAULT_BASE_URL = "https://image.pollinations.ai/prompt"


def build_pollinations_url(
    prompt: str,
    width: int = 768,
    height: int = 1024,
    seed: Optional[int] = None,
    model: str = "flux-anime",
    enhance: bool = False,
    nologo: bool = True,
    base_url: str = DEFAULT_BASE_URL,
) -> str:
    """Constructs a deterministic Pollinations generative URL."""
    safe_prompt = prompt.strip().replace("\n", " ")
    encoded_prompt = urllib.parse.quote(safe_prompt)
    base = f"{base_url}/{encoded_prompt}"
    params = [
        f"model={urllib.parse.quote(model)}",
        "nologo=true" if nologo else "",
        f"enhance={'true' if enhance else 'false'}",
    ]
    # Pollinations free tier returns 402 Payment Required if width/height query params are sent.
    # Dimensions are instead resized locally if required.
    if seed is not None:
        params.append(f"seed={seed}")

    query_str = "&".join([p for p in params if p])
    return f"{base}?{query_str}"
