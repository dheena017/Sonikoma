"""
backend/app/engines/stable_diffusion/engine.py
Stable Diffusion engine moved into package structure.
"""

import os
import logging
import asyncio
from typing import List, Optional, Dict, Any
from dataclasses import dataclass
from enum import Enum
import tempfile

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

logger = logging.getLogger("sonikoma.services.stable_diffusion_engine")


class StableDiffusionModel(str, Enum):
    V1_5 = "runwayml/stable-diffusion-v1-5"
    V2_1 = "stabilityai/stable-diffusion-2-1"
    XL = "stabilityai/stable-diffusion-xl-base-1.0"
    TURBO = "stabilityai/sdxl-turbo"


@dataclass
class GeneratedImage:
    image_path: str
    image: Optional['Any'] = None
    nsfw_content_detected: bool = False
    width: int = 512
    height: int = 512
    seed: int = 0
    prompt: str = ""
    negative_prompt: str = ""
    guidance_scale: float = 7.5
    num_inference_steps: int = 50


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

        try:
            def _generate():
                if seed is not None and torch is not None:
                    torch.manual_seed(seed)

                assert self.pipe is not None, "StableDiffusionPipeline must be initialized"
                output = self.pipe(
                    prompt=[prompt] * num_images,
                    negative_prompt=negative_prompt,
                    height=height,
                    width=width,
                    guidance_scale=guidance_scale,
                    num_inference_steps=num_inference_steps,
                )
                images = output[0] if isinstance(output, tuple) else output.images

                return images

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
                    num_inference_steps=num_inference_steps
                ))

                logger.info(f"✓ Generated and saved: {filepath}")

            return results

        except Exception as e:
            logger.error(f"Image generation failed: {e}")
            raise

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

        try:
            def _inpaint():
                if not DIFFUSERS_AVAILABLE or StableDiffusionInpaintPipeline is None or torch is None or Image is None:
                    raise RuntimeError("diffusers, torch, and Pillow are required for inpainting.")

                image = Image.open(image_path).convert("RGB")
                mask = Image.open(mask_path).convert("L")

                if mask.size != image.size:
                    mask = mask.resize(image.size, Image.Resampling.LANCZOS)

                if self.inpaint_pipe is None:
                    pipe = StableDiffusionInpaintPipeline.from_pretrained(
                        self.model_name.value,
                        torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
                        cache_dir=self.cache_dir
                    )
                    if pipe is None:
                        raise RuntimeError("Failed to load StableDiffusionInpaintPipeline")
                    self.inpaint_pipe = pipe.to(self.device)

                assert self.inpaint_pipe is not None, "StableDiffusionInpaintPipeline must be initialized"
                output = self.inpaint_pipe(
                    prompt=prompt,
                    negative_prompt=negative_prompt,
                    image=image,
                    mask_image=mask,
                    guidance_scale=guidance_scale,
                    num_inference_steps=num_inference_steps,
                    strength=strength
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
                negative_prompt=negative_prompt
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
            def _upscale():
                if not DIFFUSERS_AVAILABLE or Image is None:
                    raise RuntimeError("Pillow is required for upscaling.")

                image = Image.open(image_path).convert("RGB")
                new_size = (image.width * scale_factor, image.height * scale_factor)

                upscaled = image.resize(new_size, Image.Resampling.LANCZOS)
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
            if not DIFFUSERS_AVAILABLE or Image is None:
                raise RuntimeError("diffusers and Pillow are required for style transfer.")

            image = Image.open(image_path).convert("RGB")

            mask = Image.new("L", image.size, 255)
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
