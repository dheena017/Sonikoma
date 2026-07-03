"""
backend/python/services/imagemagick_engine.py
─────────────────────────────────────────────────────────────────────────────
ImageMagick (Wand) based image transformation engine:
- Advanced resizing with quality control
- Rotations, shearing, distortion
- Batch processing with parallel execution
- Image composition and blending
- Auto-enhancement (brightness, contrast, saturation)
- Background removal and transparency
- Text overlays with effects
─────────────────────────────────────────────────────────────────────────────
"""

import os
import logging
import asyncio
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
from pathlib import Path
from enum import Enum
import concurrent.futures

try:
    from wand.image import Image as WandImage
    from wand.color import Color
except ImportError:
    raise ImportError("wand required. Install with: pip install wand")

logger = logging.getLogger("sonikoma.services.imagemagick_engine")


class ResizeMode(str, Enum):
    """Image resize modes."""
    EXACT = "exact"        # Exact size, may distort
    FIT = "fit"           # Fit within bounds, preserve aspect
    FILL = "fill"         # Fill bounds, may crop
    PAD = "pad"           # Pad with color to reach size


class FilterType(str, Enum):
    """ImageMagick filter types."""
    POINT = "point"
    BOX = "box"
    TRIANGLE = "triangle"
    HERMITE = "hermite"
    HANNING = "hanning"
    HAMMING = "hamming"
    BLACKMAN = "blackman"
    GAUSSIAN = "gaussian"
    QUADRATIC = "quadratic"
    CUBIC = "cubic"
    CATROM = "catrom"
    MITCHELL = "mitchell"
    LANCZOS = "lanczos"


class CompressionQuality(str, Enum):
    """JPEG compression quality presets."""
    LOW = "50"        # High compression
    MEDIUM = "75"
    HIGH = "90"
    ULTRA = "95"      # Minimal compression


@dataclass
class ImageMetadata:
    """Image file metadata."""
    width: int
    height: int
    format: str
    colorspace: str
    file_size: int
    has_alpha: bool


class ImageMagickEngine:
    """High-level ImageMagick wrapper for image processing."""

    def __init__(self, max_workers: int = 4):
        """
        Initialize ImageMagick engine.

        Args:
            max_workers: Maximum parallel workers for batch operations
        """
        self.max_workers = max_workers
        self._verify_imagemagick()

    def _verify_imagemagick(self) -> None:
        """Verify ImageMagick/Wand is installed."""
        try:
            with WandImage(width=1, height=1, background=Color("white")) as img:
                logger.info(f"✓ ImageMagick verified (Wand version compatible)")
        except Exception as e:
            logger.error(f"✗ ImageMagick/Wand not available: {e}")
            raise RuntimeError("ImageMagick not installed or Wand misconfigured")

    async def get_metadata(self, image_path: str) -> ImageMetadata:
        """
        Extract image metadata.

        Args:
            image_path: Path to image file

        Returns:
            ImageMetadata object
        """
        def _extract():
            with WandImage(filename=image_path) as img:
                return ImageMetadata(
                    width=img.width,
                    height=img.height,
                    format=img.format,
                    colorspace=str(img.colorspace),
                    file_size=os.path.getsize(image_path),
                    has_alpha=img.alpha_channel
                )

        try:
            metadata = await asyncio.to_thread(_extract)
            logger.info(f"✓ Metadata: {metadata.width}x{metadata.height}, {metadata.format}")
            return metadata
        except Exception as e:
            logger.error(f"Failed to extract metadata: {e}")
            raise

    async def resize(
        self,
        image_path: str,
        output_path: str,
        width: Optional[int] = None,
        height: Optional[int] = None,
        mode: ResizeMode = ResizeMode.FIT,
        filter_type: FilterType = FilterType.LANCZOS,
        quality: Optional[int] = None
    ) -> str:
        """
        Resize image with multiple options.

        Args:
            image_path: Input image path
            output_path: Output image path
            width: Target width
            height: Target height
            mode: Resize mode
            filter_type: Resize filter
            quality: JPEG quality (1-100)

        Returns:
            Path to resized image
        """
        if not width and not height:
            raise ValueError("At least width or height must be specified")

        def _resize():
            with WandImage(filename=image_path) as img:
                if mode == ResizeMode.EXACT:
                    img.resize(width or img.width, height or img.height, filter=filter_type.value)
                elif mode == ResizeMode.FIT:
                    img.sample(width or img.width, height or img.height)
                elif mode == ResizeMode.FILL:
                    # Calculate scale to fill
                    if width and height:
                        scale_w = width / img.width
                        scale_h = height / img.height
                        scale = max(scale_w, scale_h)
                        new_w = int(img.width * scale)
                        new_h = int(img.height * scale)
                        img.resize(new_w, new_h, filter=filter_type.value)
                        img.crop((width, height), gravity="center")
                elif mode == ResizeMode.PAD:
                    # Fit and pad
                    if width and height:
                        scale = min(width / img.width, height / img.height)
                        new_w = int(img.width * scale)
                        new_h = int(img.height * scale)
                        img.resize(new_w, new_h, filter=filter_type.value)
                        img.extent(width, height, gravity="center")

                if quality:
                    img.compression_quality = quality

                img.save(filename=output_path)

        try:
            await asyncio.to_thread(_resize)
            logger.info(f"✓ Image resized: {output_path}")
            return output_path
        except Exception as e:
            logger.error(f"Resize failed: {e}")
            raise

    async def rotate(
        self,
        image_path: str,
        output_path: str,
        angle: float,
        background_color: str = "white"
    ) -> str:
        """
        Rotate image.

        Args:
            image_path: Input image path
            output_path: Output image path
            angle: Rotation angle in degrees
            background_color: Background color for transparent areas

        Returns:
            Path to rotated image
        """
        def _rotate():
            with WandImage(filename=image_path) as img:
                img.background_color = Color(background_color)
                img.rotate(angle)
                img.save(filename=output_path)

        try:
            await asyncio.to_thread(_rotate)
            logger.info(f"✓ Image rotated {angle}°: {output_path}")
            return output_path
        except Exception as e:
            logger.error(f"Rotation failed: {e}")
            raise

    async def auto_enhance(
        self,
        image_path: str,
        output_path: str,
        brightness: float = 1.0,
        contrast: float = 1.0,
        saturation: float = 1.0
    ) -> str:
        """
        Auto-enhance image colors.

        Args:
            image_path: Input image path
            output_path: Output image path
            brightness: Brightness factor (0.5-2.0)
            contrast: Contrast factor (0.5-2.0)
            saturation: Saturation factor (0.5-2.0)

        Returns:
            Path to enhanced image
        """
        def _enhance():
            with WandImage(filename=image_path) as img:
                # Normalize first
                img.normalize()
                
                # Apply brightness
                if brightness != 1.0:
                    img.brightness_contrast(brightness * 10, 0)
                
                # Apply contrast
                if contrast != 1.0:
                    img.brightness_contrast(0, contrast * 10)
                
                # Apply saturation (modulate)
                if saturation != 1.0:
                    img.modulate(saturation=saturation * 100)
                
                img.save(filename=output_path)

        try:
            await asyncio.to_thread(_enhance)
            logger.info(f"✓ Image enhanced: {output_path}")
            return output_path
        except Exception as e:
            logger.error(f"Enhancement failed: {e}")
            raise

    async def remove_background(
        self,
        image_path: str,
        output_path: str,
        fuzz_threshold: int = 30
    ) -> str:
        """
        Remove background and create transparency.

        Args:
            image_path: Input image path
            output_path: Output image path (PNG recommended)
            fuzz_threshold: Color similarity threshold (0-100)

        Returns:
            Path to image with transparent background
        """
        def _remove_bg():
            with WandImage(filename=image_path) as img:
                # Convert to RGBA if needed
                if not img.alpha_channel:
                    img.alpha_channel = True
                
                # Get the corner color (assume it's the background)
                with img.clone() as corner_img:
                    corner_img.crop(0, 0, 1, 1)
                    bg_color = corner_img.sample(1, 1)[0]
                
                # Floodfill from corners
                img.virtual_pixel = "transparent"
                img.floodfill(bg_color, int(fuzz_threshold), 0, 0)
                
                img.save(filename=output_path)

        try:
            await asyncio.to_thread(_remove_bg)
            logger.info(f"✓ Background removed: {output_path}")
            return output_path
        except Exception as e:
            logger.error(f"Background removal failed: {e}")
            raise

    async def add_text_overlay(
        self,
        image_path: str,
        output_path: str,
        text: str,
        font_size: int = 40,
        text_color: str = "white",
        position: str = "center",
        opacity: float = 1.0
    ) -> str:
        """
        Add text overlay to image.

        Args:
            image_path: Input image path
            output_path: Output image path
            text: Text to add
            font_size: Font size in points
            text_color: Text color
            position: Text position (top-left, center, bottom-right, etc.)
            opacity: Text opacity (0.0-1.0)

        Returns:
            Path to image with text
        """
        def _add_text():
            with WandImage(filename=image_path) as img:
                with img.clone() as edited:
                    from wand.drawing import Drawing
                    
                    with Drawing() as draw:
                        draw.font_size = font_size
                        draw.fill_color = Color(text_color)
                        draw.opacity = opacity
                        
                        # Get text metrics
                        metrics = draw.get_font_metrics(edited, text)
                        text_width = metrics.text_width
                        text_height = metrics.text_height
                        
                        # Calculate position
                        if position == "center":
                            x = (edited.width - text_width) / 2
                            y = (edited.height - text_height) / 2
                        elif position == "top-left":
                            x, y = 10, 10
                        elif position == "top-right":
                            x = edited.width - text_width - 10
                            y = 10
                        elif position == "bottom-left":
                            x = 10
                            y = edited.height - text_height - 10
                        elif position == "bottom-right":
                            x = edited.width - text_width - 10
                            y = edited.height - text_height - 10
                        else:
                            x, y = 10, 10
                        
                        draw.text(int(x), int(y), text)
                        draw(edited)
                    
                    edited.save(filename=output_path)

        try:
            await asyncio.to_thread(_add_text)
            logger.info(f"✓ Text overlay added: {output_path}")
            return output_path
        except Exception as e:
            logger.error(f"Text overlay failed: {e}")
            raise

    async def batch_resize(
        self,
        image_paths: List[str],
        output_dir: str,
        width: Optional[int] = None,
        height: Optional[int] = None,
        mode: ResizeMode = ResizeMode.FIT,
        quality: int = 85
    ) -> List[str]:
        """
        Batch resize multiple images in parallel.

        Args:
            image_paths: List of input image paths
            output_dir: Output directory
            width: Target width
            height: Target height
            mode: Resize mode
            quality: JPEG quality

        Returns:
            List of output image paths
        """
        os.makedirs(output_dir, exist_ok=True)

        async def resize_one(img_path: str) -> str:
            output_path = os.path.join(output_dir, os.path.basename(img_path))
            return await self.resize(
                img_path, output_path,
                width=width, height=height,
                mode=mode, quality=quality
            )

        logger.info(f"Batch resizing {len(image_paths)} images...")

        try:
            results = await asyncio.gather(
                *[resize_one(ip) for ip in image_paths],
                return_exceptions=True
            )

            successful = sum(1 for r in results if isinstance(r, str))
            logger.info(f"✓ Batch resize complete: {successful}/{len(image_paths)}")

            return [r for r in results if isinstance(r, str)]
        except Exception as e:
            logger.error(f"Batch resize failed: {e}")
            raise

    async def composite_images(
        self,
        base_image_path: str,
        overlay_image_path: str,
        output_path: str,
        x: int = 0,
        y: int = 0,
        opacity: float = 1.0
    ) -> str:
        """
        Composite (overlay) one image on another.

        Args:
            base_image_path: Base image path
            overlay_image_path: Overlay image path
            output_path: Output image path
            x: X position for overlay
            y: Y position for overlay
            opacity: Overlay opacity

        Returns:
            Path to composited image
        """
        def _composite():
            with WandImage(filename=base_image_path) as base:
                with WandImage(filename=overlay_image_path) as overlay:
                    overlay.opacity = opacity
                    base.composite(overlay, x, y)
                    base.save(filename=output_path)

        try:
            await asyncio.to_thread(_composite)
            logger.info(f"✓ Images composited: {output_path}")
            return output_path
        except Exception as e:
            logger.error(f"Compositing failed: {e}")
            raise


# Singleton instance
_imagemagick_instance: Optional[ImageMagickEngine] = None


def get_imagemagick_engine(max_workers: int = 4) -> ImageMagickEngine:
    """Get or create ImageMagick engine singleton."""
    global _imagemagick_instance
    if _imagemagick_instance is None:
        _imagemagick_instance = ImageMagickEngine(max_workers=max_workers)
    return _imagemagick_instance
