"""
backend/app/providers/stable_diffusion/client.py
─────────────────────────────────────────────────────────────────────────────
Stable Diffusion generation client and provider wrapper.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import Any, List, Optional, Union

from app.providers.stable_diffusion.types import StableDiffusionModel, GeneratedImage
from app.providers.stable_diffusion.helpers import build_generation_params

logger = logging.getLogger("sonikoma.providers.stable_diffusion.client")


class StableDiffusionClient:
    """Provider client interface for Stable Diffusion image synthesis."""

    @classmethod
    async def generate_image(
        cls,
        prompt: str,
        negative_prompt: str = "",
        model: Union[StableDiffusionModel, str] = StableDiffusionModel.V1_5,
        width: int = 512,
        height: int = 512,
        guidance_scale: float = 7.5,
        num_inference_steps: int = 50,
        seed: Optional[int] = None,
        output_dir: Optional[str] = None,
        **kwargs: Any,
    ) -> GeneratedImage:
        """Execute text-to-image synthesis using the underlying local engine."""
        from app.providers.stable_diffusion.engine import get_stable_diffusion_engine

        model_enum = model if isinstance(model, StableDiffusionModel) else StableDiffusionModel(str(model))
        engine = get_stable_diffusion_engine(model_name=model_enum)

        params = build_generation_params(
            prompt=prompt,
            negative_prompt=negative_prompt,
            width=width,
            height=height,
            guidance_scale=guidance_scale,
            num_inference_steps=num_inference_steps,
            seed=seed,
            output_dir=output_dir,
            **kwargs,
        )

        results = await engine.generate_images(**params)
        return results[0]

    @classmethod
    async def generate_images(
        cls,
        prompt: str,
        num_images: int = 1,
        negative_prompt: str = "",
        model: Union[StableDiffusionModel, str] = StableDiffusionModel.V1_5,
        width: int = 512,
        height: int = 512,
        guidance_scale: float = 7.5,
        num_inference_steps: int = 50,
        seed: Optional[int] = None,
        output_dir: Optional[str] = None,
        **kwargs: Any,
    ) -> List[GeneratedImage]:
        """Execute batch text-to-image synthesis using the underlying local engine."""
        from app.providers.stable_diffusion.engine import get_stable_diffusion_engine

        model_enum = model if isinstance(model, StableDiffusionModel) else StableDiffusionModel(str(model))
        engine = get_stable_diffusion_engine(model_name=model_enum)

        params = build_generation_params(
            prompt=prompt,
            negative_prompt=negative_prompt,
            width=width,
            height=height,
            guidance_scale=guidance_scale,
            num_inference_steps=num_inference_steps,
            seed=seed,
            output_dir=output_dir,
            **kwargs,
        )

        return await engine.generate_images(num_images=num_images, **params)


# Backward compatibility alias
StableDiffusionProvider = StableDiffusionClient
