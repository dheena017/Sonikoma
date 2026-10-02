"""
backend/app/providers/stable_diffusion/helpers.py
─────────────────────────────────────────────────────────────────────────────
Helper utilities: prompt sanitization, seed calculation, and image param builders.
─────────────────────────────────────────────────────────────────────────────
"""

import re
import random
from typing import Optional, Any, Dict


# ─── Seed ─────────────────────────────────────────────────────────────────────

def generate_seed(seed: Optional[int] = None) -> int:
    """Generate a random 32-bit positive integer seed if not provided."""
    if seed is None or seed < 0:
        return random.randint(0, 2**31 - 1)
    return seed


# ─── Prompt ───────────────────────────────────────────────────────────────────

def sanitize_prompt(prompt: str) -> str:
    """Sanitize prompt text by trimming excess whitespace and invalid characters."""
    clean = re.sub(r'[\r\n\t]+', ' ', prompt)
    clean = re.sub(r'\s+', ' ', clean).strip()
    return clean


# ─── Filename ─────────────────────────────────────────────────────────────────

def format_seed_filename(prefix: str, seed: int, ext: str = "png") -> str:
    """Generate a consistent filename containing the generation seed."""
    safe_prefix = re.sub(r'[^a-zA-Z0-9_\-]', '_', prefix)[:30]
    return f"{safe_prefix}_{seed}.{ext.lstrip('.')}"


# ─── Param Builder ────────────────────────────────────────────────────────────

def build_generation_params(
    prompt: str,
    negative_prompt: str = "",
    width: int = 512,
    height: int = 512,
    guidance_scale: float = 7.5,
    num_inference_steps: int = 50,
    seed: Optional[int] = None,
    output_dir: Optional[str] = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    """
    Sanitize and normalize image generation parameters.
    Returns a clean kwargs dict ready to pass to StableDiffusionEngine.generate_images().
    """
    resolved_seed = generate_seed(seed)
    return {
        "prompt": sanitize_prompt(prompt),
        "negative_prompt": sanitize_prompt(negative_prompt) if negative_prompt else "",
        "width": width,
        "height": height,
        "guidance_scale": guidance_scale,
        "num_inference_steps": num_inference_steps,
        "seed": resolved_seed,
        "output_dir": output_dir or "",
        **kwargs,
    }


__all__ = [
    "generate_seed",
    "sanitize_prompt",
    "format_seed_filename",
    "build_generation_params",
]
