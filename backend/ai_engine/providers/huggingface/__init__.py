"""
backend/app/providers/huggingface/__init__.py
─────────────────────────────────────────────────────────────────────────────
Hugging Face Inference API generative diffusion provider package.
─────────────────────────────────────────────────────────────────────────────
"""

from ai_engine.providers.huggingface.types import (
    HuggingFaceModel,
    ImageGenerationOptions,
)
from ai_engine.providers.huggingface.helpers import (
    trim_prompt,
    encode_image_bytes,
    resize_image_if_needed,
)
from ai_engine.providers.huggingface.client import (
    HuggingFaceClient,
    HuggingFaceProvider,
    HUGGINGFACE_AVAILABLE,
)
from ai_engine.providers.huggingface.engine import (
    HuggingFaceEngine,
    get_huggingface_engine,
)

__all__ = [
    # Types
    "HuggingFaceModel",
    "ImageGenerationOptions",
    # Client & Engine
    "HuggingFaceClient",
    "HuggingFaceProvider",
    "HuggingFaceEngine",
    "get_huggingface_engine",
    "HUGGINGFACE_AVAILABLE",
    # Helpers
    "trim_prompt",
    "encode_image_bytes",
    "resize_image_if_needed",
]
