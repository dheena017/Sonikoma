"""
backend/app/providers/stable_diffusion/engine.py
─────────────────────────────────────────────────────────────────────────────
Local Stable Diffusion inference engine with CPU/CUDA pipeline execution.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import logging
import asyncio
from typing import List, Optional, Dict, Any
import tempfile

from ai_engine.providers.stable_diffusion.types import StableDiffusionModel, GeneratedImage

# Lazy-loaded imports for diffusers and torch to keep startup RAM lightweight (~120MB)
DIFFUSERS_AVAILABLE = True

def _load_diffusers_and_torch():
    try:
        from diffusers import (
            StableDiffusionPipeline,
            StableDiffusionInpaintPipeline,
            StableDiffusionUpscalePipeline,
        )
        import torch
        from PIL import Image
        import numpy as np
        return {
            "StableDiffusionPipeline": StableDiffusionPipeline,
            "StableDiffusionInpaintPipeline": StableDiffusionInpaintPipeline,
            "StableDiffusionUpscalePipeline": StableDiffusionUpscalePipeline,
            "torch": torch,
            "Image": Image,
            "np": np,
        }
    except ImportError:
        return None

logger = logging.getLogger("sonikoma.providers.stable_diffusion.engine")


class StableDiffusionEngine:
    def __init__(
        self,
        model_name: StableDiffusionModel = StableDiffusionModel.V1_5,
        device: str = "cpu",
        enable_safety_checker: bool = False,
        cache_dir: Optional[str] = None
    ):
        self.model_name = model_name
        self.device = device
        self.enable_safety_checker = enable_safety_checker
        self.cache_dir = cache_dir or os.path.expanduser("~/.cache/huggingface/hub")
        self.pipe: Any = None
        self.inpaint_pipe: Any = None

    def _ensure_pipe(self) -> None:
        """Ensure the base Stable Diffusion pipeline is loaded."""
        if self.pipe is not None:
            return

        mods = _load_diffusers_and_torch()
        if not mods:
            raise RuntimeError("diffusers and torch packages are required. Install with: pip install diffusers torch Pillow")

        StableDiffusionPipeline = mods["StableDiffusionPipeline"]
        torch = mods["torch"]

        logger.info(f"Loading model: {self.model_name.value} on {self.device}...")

        try:
            enable_attention_slicing = self.device == "cpu"

            pipe = StableDiffusionPipeline.from_pretrained(
                self.model_name.value,
                torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
                safety_checker=None if not self.enable_safety_checker else None,
                cache_dir=self.cache_dir
            )
            if pipe is None:
                raise RuntimeError("Failed to load StableDiffusionPipeline")

            self.pipe = pipe.to(self.device)

            if enable_attention_slicing:
                self.pipe.enable_attention_slicing()

            logger.info(f"✓ Model loaded on device: {self.device}")

        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            raise

    def _ensure_inpaint_pipe(self) -> dict:
        """Ensure the inpaint pipeline is loaded. Returns the mods dict for use in closures."""
        mods = _load_diffusers_and_torch()
        if not mods:
            raise RuntimeError("diffusers, torch, and Pillow are required for inpainting.")

        if self.inpaint_pipe is None:
            StableDiffusionInpaintPipeline = mods["StableDiffusionInpaintPipeline"]
            torch = mods["torch"]
            pipe = StableDiffusionInpaintPipeline.from_pretrained(
                self.model_name.value,
                torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
                cache_dir=self.cache_dir
            )
            if pipe is None:
                raise RuntimeError("Failed to load StableDiffusionInpaintPipeline")
            self.inpaint_pipe = pipe.to(self.device)
            logger.info(f"✓ Inpaint pipeline loaded on device: {self.device}")

        return mods

    async def generate_images(
        self,
        prompt: str,
        negative_prompt: str = "",
        num_images: int = 1,
        height: int = 512,
        width: int = 512,
        guidance_scale: float = 7.5,
        num_inference_steps: int = 50,
        seed: Optional[int] = None,
        output_dir: str = ""
    ) -> List[GeneratedImage]:
        """Generate images from text prompt."""
        if not output_dir:
            output_dir = tempfile.gettempdir()

        os.makedirs(output_dir, exist_ok=True)

        logger.info(
            f"Generating {num_images} images: '{prompt[:50]}...' "
            f"({height}x{width}, guidance={guidance_scale}, steps={num_inference_steps})"
        )

        self._ensure_pipe()
        mods = _load_diffusers_and_torch()

        try:
            def _generate():
                _torch = mods["torch"] if mods else None
                if seed is not None and _torch is not None:
                    _torch.manual_seed(seed)

                assert self.pipe is not None, "StableDiffusionPipeline must be initialized"
                output = self.pipe(
                    prompt=[prompt] * num_images,
                    negative_prompt=negative_prompt,
                    height=height,
                    width=width,
                    guidance_scale=guidance_scale,
                    num_inference_steps=num_inference_steps,
                )
                return output[0] if isinstance(output, tuple) else output.images

            images = await asyncio.to_thread(_generate)

            results = []
            for i, img in enumerate(images):
                filename = f"generated_{i:03d}_{seed or 'random'}.png"
                filepath = os.path.join(output_dir, filename)
                img.save(filepath)
                results.append(GeneratedImage(
                    image_path=filepath,
                    image=img,
                    width=width,
                    height=height,
                    seed=seed or 0,
                    prompt=prompt,
                    negative_prompt=negative_prompt,
                    guidance_scale=guidance_scale,
                    num_inference_steps=num_inference_steps,
                ))
                logger.info(f"✓ Generated and saved: {filepath}")

            return results

        except Exception as e:
            logger.error(f"Image generation failed: {e}")
            raise

    async def generate_image(
        self,
        prompt: str,
        negative_prompt: str = "",
        height: int = 512,
        width: int = 512,
        guidance_scale: float = 7.5,
        num_inference_steps: int = 50,
        seed: Optional[int] = None,
        output_dir: str = "",
    ) -> GeneratedImage:
        """Generate a single image from text prompt (singular alias for generate_images)."""
        results = await self.generate_images(
            prompt=prompt,
            negative_prompt=negative_prompt,
            num_images=1,
            height=height,
            width=width,
            guidance_scale=guidance_scale,
            num_inference_steps=num_inference_steps,
            seed=seed,
            output_dir=output_dir,
        )
        return results[0]

    async def inpaint(
        self,
        image_path: str,
        mask_path: str,
        prompt: str,
        negative_prompt: str = "",
        output_path: str = "",
        guidance_scale: float = 7.5,
        num_inference_steps: int = 50,
        strength: float = 0.8
    ) -> GeneratedImage:
        """Inpaint (edit) image using mask and prompt."""
        if not output_path:
            output_path = os.path.join(tempfile.gettempdir(), "inpainted.png")

        logger.info(f"Inpainting: {image_path} with prompt: '{prompt[:50]}...'")

        mods = self._ensure_inpaint_pipe()
        _Image = mods["Image"]

        try:
            def _inpaint():
                image = _Image.open(image_path).convert("RGB")
                mask = _Image.open(mask_path).convert("L")

                if mask.size != image.size:
                    mask = mask.resize(image.size, _Image.Resampling.LANCZOS)

                assert self.inpaint_pipe is not None, "StableDiffusionInpaintPipeline must be initialized"
                output = self.inpaint_pipe(
                    prompt=prompt,
                    negative_prompt=negative_prompt,
                    image=image,
                    mask_image=mask,
                    guidance_scale=guidance_scale,
                    num_inference_steps=num_inference_steps,
                    strength=strength,
                )
                images = output[0] if isinstance(output, tuple) else output.images
                result = images[0]
                result.save(output_path)
                return result, image.size

            result_img, size = await asyncio.to_thread(_inpaint)
            logger.info(f"✓ Inpainting complete: {output_path}")

            return GeneratedImage(
                image_path=output_path,
                image=result_img,
                width=size[0],
                height=size[1],
                prompt=prompt,
                negative_prompt=negative_prompt,
            )

        except Exception as e:
            logger.error(f"Inpainting failed: {e}")
            raise

    async def upscale(
        self,
        image_path: str,
        output_path: str = "",
        scale_factor: int = 2,
        prompt: str = ""
    ) -> str:
        """Upscale (super-resolution) image."""
        if not output_path:
            base, ext = os.path.splitext(image_path)
            output_path = f"{base}_upscaled{ext}"

        logger.info(f"Upscaling image {scale_factor}x: {image_path}")

        try:
            mods = _load_diffusers_and_torch()
            if not mods:
                raise RuntimeError("Pillow is required for upscaling.")
            _Image = mods["Image"]

            def _upscale():
                image = _Image.open(image_path).convert("RGB")
                new_size = (image.width * scale_factor, image.height * scale_factor)
                upscaled = image.resize(new_size, _Image.Resampling.LANCZOS)
                upscaled.save(output_path)
                return upscaled

            await asyncio.to_thread(_upscale)

            logger.info(f"✓ Image upscaled: {output_path}")
            return output_path

        except Exception as e:
            logger.error(f"Upscaling failed: {e}")
            raise

    async def style_transfer(
        self,
        image_path: str,
        style_prompt: str,
        output_path: str = "",
        guidance_scale: float = 7.5,
        num_inference_steps: int = 50
    ) -> GeneratedImage:
        """Apply style transfer to image."""
        if not output_path:
            output_path = os.path.join(tempfile.gettempdir(), "styled.png")

        prompt = f"a beautiful {style_prompt} of the subject in the image"

        logger.info(f"Applying style transfer: {style_prompt}")

        try:
            mods = _load_diffusers_and_torch()
            if not mods:
                raise RuntimeError("diffusers and Pillow are required for style transfer.")
            _Image = mods["Image"]

            image = _Image.open(image_path).convert("RGB")

            mask = _Image.new("L", image.size, 255)
            mask_path = os.path.join(tempfile.gettempdir(), "full_mask.png")
            mask.save(mask_path)

            return await self.inpaint(
                image_path=image_path,
                mask_path=mask_path,
                prompt=prompt,
                output_path=output_path,
                guidance_scale=guidance_scale,
                num_inference_steps=num_inference_steps,
                strength=0.6
            )

        except Exception as e:
            logger.error(f"Style transfer failed: {e}")
            raise

    def get_model_info(self) -> Dict[str, Any]:
        """Get information about loaded model."""
        return {
            "model_name": self.model_name.value,
            "device": self.device,
            "safety_checker_enabled": self.enable_safety_checker,
            "cache_dir": self.cache_dir,
        }


_stable_diffusion_instance: Optional[StableDiffusionEngine] = None


def get_stable_diffusion_engine(
    model_name: StableDiffusionModel = StableDiffusionModel.V1_5,
    device: str = "cpu",
    enable_safety_checker: bool = False
) -> StableDiffusionEngine:
    if not DIFFUSERS_AVAILABLE:
        raise ImportError("diffusers, torch, and Pillow required. Install with: pip install diffusers torch Pillow transformers")
    global _stable_diffusion_instance
    if _stable_diffusion_instance is None:
        _stable_diffusion_instance = StableDiffusionEngine(
            model_name=model_name,
            device=device,
            enable_safety_checker=enable_safety_checker
        )
    return _stable_diffusion_instance
