"""
backend/app/providers/huggingface/__init__.py
─────────────────────────────────────────────────────────────────────────────
Hugging Face Inference API generative diffusion provider package.
─────────────────────────────────────────────────────────────────────────────
"""

from app.providers.huggingface.types import (
    HuggingFaceModel,
    ImageGenerationOptions,
)
from app.providers.huggingface.helpers import (
    trim_prompt,
    encode_image_bytes,
    resize_image_if_needed,
)
from app.providers.huggingface.client import (
    HuggingFaceClient,
    HuggingFaceProvider,
    HUGGINGFACE_AVAILABLE,
)
from app.providers.huggingface.engine import (
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
