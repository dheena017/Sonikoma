"""
backend/app/schemas/image.py
─────────────────────────────────────────────────────────────────────────────
Pydantic request/response schemas for image.
─────────────────────────────────────────────────────────────────────────────
"""

from pydantic import BaseModel, Field, EmailStr
from typing import List, Dict, Any, Optional, Literal, Union
from datetime import datetime
from services.image.imagemagick_engine import ResizeMode

class EditImageRequest(BaseModel):
    url: str
    cropTop: Optional[float] = 0.0
    cropBottom: Optional[float] = 0.0
    cropLeft: Optional[float] = 0.0
    cropRight: Optional[float] = 0.0
    autoTrim: Optional[bool] = True
    sensitivity: Optional[float] = None
    padding: Optional[int] = None
    backgroundColorMode: Optional[str] = "auto"
    rotate: Optional[float] = 0.0
    flipHorizontal: Optional[bool] = False
    aspectRatio: Optional[str] = "free"
    outputFormat: Optional[str] = "jpeg"
    cropQuality: Optional[int] = 90


class UndoEditRequest(BaseModel):
    url: str


class TransformImageRequest(BaseModel):
    url: str
    type: Literal["rotate", "flip"]
    value: str


class StitchImagesRequest(BaseModel):
    url1: Optional[str] = None
    url2: Optional[str] = None
    imageUrl1: Optional[str] = None
    imageUrl2: Optional[str] = None
    urls: Optional[List[str]] = None
    layout: Optional[Literal["vertical", "horizontal"]] = "vertical"
    spacing: Optional[int] = 0
    spacingColor: Optional[str] = "white"
    scaleToFit: Optional[bool] = True
    alignMode: Optional[Literal["center", "start", "end"]] = "center"
    padding: Optional[int] = 0


class SplitImagesRequest(BaseModel):
    url: str
    splitLines: List[float]


class DownloadZipRequest(BaseModel):
    urls: List[str]
    url: Optional[str] = None


class RemoveBubblesRequest(BaseModel):
    url: str
    method: Optional[str] = "auto"
    sensitivity: Optional[float] = 50.0
    dilation: Optional[int] = -1
    inpaint_radius: Optional[int] = 3
    detection_style: Optional[str] = "all"


class ProcessLayersRequest(BaseModel):
    url: str


class RemoveBubblesBatchRequest(BaseModel):
    urls: List[str]
    method: Optional[str] = "auto"
    sensitivity: Optional[float] = 50.0
    dilation: Optional[int] = -1
    inpaint_radius: Optional[int] = 3
    detection_style: Optional[str] = "all"



class CleanerBase64Request(BaseModel):
    image_base64: str = Field(..., description="Base64-encoded source image (PNG/JPG)")
    method: Literal["inpaint", "blur"] = Field("inpaint", description="Removal method")
    sensitivity: float = Field(50.0, ge=0.0, le=100.0)
    dilation: int = Field(-1, ge=-1, le=100)
    inpaint_radius: int = Field(3, ge=1, le=20)
    detection_style: str = Field("all")



class ImagePathRequest(BaseModel):
    image_path: str
    output_path: Optional[str] = None


class BatchResizeRequest(BaseModel):
    image_paths: List[str]
    output_dir: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    mode: Optional[ResizeMode] = ResizeMode.FIT
    quality: Optional[int] = Field(85, ge=1, le=100)


class CompositeRequest(BaseModel):
    base_image_path: str
    overlay_image_path: str
    output_path: Optional[str] = None
    x: Optional[int] = 0
    y: Optional[int] = 0
    opacity: Optional[float] = Field(1.0, ge=0.0, le=1.0)


class MetadataRequest(BaseModel):
    image_path: str



class OCRBase64Request(BaseModel):
    image_base64: str = Field(..., description="Base64-encoded panel image")
    langs: List[str] = Field(default=["en"], description="Language codes for EasyOCR")

