"""
backend/app/domain/project.py
─────────────────────────────────────────────────────────────────────────────
Domain models for the project aggregate.

These are plain Python dataclasses with no database imports, no Pydantic
validators, and no framework dependencies. They express business concepts
and may enforce invariants via methods.

Conversion helpers (from_dict / to_dict) provide lossless round-tripping
against raw database row dicts returned by the repository layer.
─────────────────────────────────────────────────────────────────────────────
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field, asdict
from typing import Any, Dict, List, Optional


# ─────────────────────────────────────────────────────────────────────────────
# Value objects — content constructs extracted from a panel by AI analysis
# ─────────────────────────────────────────────────────────────────────────────

@dataclass(frozen=True)
class Scene:
    """
    A visual scene description extracted from a panel image.

    Represents the setting, action, and mood captured in one storyboard panel.
    Frozen so it can be used as a dict key or in sets.
    """
    description: str
    mood: Optional[str] = None

    def is_empty(self) -> bool:
        return not self.description.strip()


@dataclass(frozen=True)
class Dialogue:
    """
    A line of spoken dialogue belonging to a named character within a panel.

    Frozen because dialogue is immutable once extracted from the source image.
    """
    text: str
    character: Optional[str] = None

    def is_empty(self) -> bool:
        return not self.text.strip()

    def has_speaker(self) -> bool:
        return bool(self.character and self.character.strip())


@dataclass(frozen=True)
class Narration:
    """
    Caption or narration text overlaid on a panel (not spoken by a character).

    Distinct from Dialogue in that it carries no speaker attribution.
    Frozen because narration is immutable once extracted.
    """
    text: str

    def is_empty(self) -> bool:
        return not self.text.strip()


# ─────────────────────────────────────────────────────────────────────────────
# Panel — a single storyboard frame
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class Panel:
    """
    A single storyboard panel within a chapter/project.

    Maps directly to the `panels` database table but owns its own validation
    and domain behaviour without importing any DB code.
    """

    # Position within the chapter
    index: int

    # Image assets
    image_url: str
    original_url: Optional[str] = None

    # Content
    speech_text: str = ""
    sfx: str = ""
    visual_description: Optional[str] = None

    # Timing
    duration: float = 4.5
    motion_type: str = "zoom_in"

    # Image adjustments
    brightness: Optional[float] = None
    contrast: Optional[float] = None
    saturation: Optional[float] = None
    grayscale: bool = False
    filter_preset: Optional[str] = None

    # Bubble / speech-bubble detection settings
    bubble_method: Optional[str] = None
    bubble_sensitivity: Optional[float] = None
    bubble_dilation: Optional[float] = None
    inpaint_radius: Optional[int] = None
    detection_style: Optional[str] = None

    # Audio
    audio_url: Optional[str] = None

    # Crop settings
    smart_crop: bool = False
    crop_padding: Optional[float] = None

    # Content moderation
    is_sanitized: bool = False

    # ── Business rules ────────────────────────────────────────────────────────

    def has_speech(self) -> bool:
        """True when this panel contains spoken dialogue."""
        return bool(self.speech_text and self.speech_text.strip())

    def has_sfx(self) -> bool:
        """True when this panel has a sound-effects tag."""
        return bool(self.sfx and self.sfx.strip())

    def has_audio(self) -> bool:
        """True when a compiled audio track has been assigned."""
        return bool(self.audio_url)

    def is_image_ready(self) -> bool:
        """True when the panel has a usable processed image."""
        return bool(self.image_url and self.image_url.strip())

    def needs_sanitization(self) -> bool:
        """True when the panel has not yet been checked for content."""
        return not self.is_sanitized

    # ── Conversion helpers ────────────────────────────────────────────────────

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "Panel":
        """
        Construct a Panel from a raw database row dict.

        Unknown keys are silently ignored so the domain model stays stable
        even when the DB schema gains new columns.
        """
        return cls(
            index=d.get("panel_index", 0),
            image_url=d.get("image_url") or "",
            original_url=d.get("original_url") or d.get("original_image_url"),
            speech_text=d.get("speech_text") or "",
            sfx=d.get("sfx") or "",
            visual_description=d.get("visual_description"),
            duration=float(d.get("duration") or 4.5),
            motion_type=d.get("motion_type") or "zoom_in",
            brightness=d.get("brightness"),
            contrast=d.get("contrast"),
            saturation=d.get("saturation"),
            grayscale=bool(d.get("grayscale", False)),
            filter_preset=d.get("filter_preset"),
            bubble_method=d.get("bubble_method"),
            bubble_sensitivity=d.get("bubble_sensitivity"),
            bubble_dilation=d.get("bubble_dilation"),
            inpaint_radius=d.get("inpaint_radius"),
            detection_style=d.get("detection_style"),
            audio_url=d.get("audio_url"),
            smart_crop=bool(d.get("smart_crop", False)),
            crop_padding=d.get("crop_padding"),
            is_sanitized=bool(d.get("is_sanitized", False)),
        )

    def to_dict(self) -> Dict[str, Any]:
        """
        Serialise to a raw dict compatible with the panels DB table schema.

        The key `panel_index` is used (not `index`) to match the column name.
        """
        return {
            "panel_index": self.index,
            "image_url": self.image_url,
            "original_url": self.original_url,
            "speech_text": self.speech_text,
            "sfx": self.sfx,
            "visual_description": self.visual_description,
            "duration": self.duration,
            "motion_type": self.motion_type,
            "brightness": self.brightness,
            "contrast": self.contrast,
            "saturation": self.saturation,
            "grayscale": self.grayscale,
            "filter_preset": self.filter_preset,
            "bubble_method": self.bubble_method,
            "bubble_sensitivity": self.bubble_sensitivity,
            "bubble_dilation": self.bubble_dilation,
            "inpaint_radius": self.inpaint_radius,
            "detection_style": self.detection_style,
            "audio_url": self.audio_url,
            "smart_crop": self.smart_crop,
            "crop_padding": self.crop_padding,
            "is_sanitized": self.is_sanitized,
        }


# ─────────────────────────────────────────────────────────────────────────────
# Project — a chapter/episode (the central aggregate)
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class Project:
    """
    A webtoon chapter/episode — the primary aggregate root.

    Logically represents a flat *Project* (as exposed in the API) which maps
    to a `chapters` row joined with its parent `series` row in the database.
    """

    id: str
    title: str
    genre: str
    author: str
    episode: str
    status: str
    panels_count: int
    series_id: str
    user_id: str

    # Optional metadata
    url: Optional[str] = None
    video_url: Optional[str] = None
    cover_image: Optional[str] = None
    synopsis: Optional[str] = None

    # Slug identifiers
    series_slug: str = ""
    chapter_slug: str = ""

    # Audio
    audio_settings: Optional[Dict[str, Any]] = None

    # Timestamps (ISO strings from DB)
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    # ── Business rules ────────────────────────────────────────────────────────

    def is_complete(self) -> bool:
        """True when the project has been fully compiled (video ready)."""
        return self.status == "complete" and bool(self.video_url)

    def is_pending(self) -> bool:
        return self.status == "pending"

    def is_processing(self) -> bool:
        return self.status == "processing"

    def has_panels(self) -> bool:
        return self.panels_count > 0

    def has_audio_settings(self) -> bool:
        return bool(self.audio_settings)

    def has_video(self) -> bool:
        return bool(self.video_url)

    # ── Conversion helpers ────────────────────────────────────────────────────

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "Project":
        """
        Construct a Project from a raw DB row dict (chapters JOIN series).

        Handles the `audio_settings` field which may be stored as a JSON
        string in the database.
        """
        audio_settings = d.get("audio_settings")
        if isinstance(audio_settings, str) and audio_settings.strip():
            try:
                audio_settings = json.loads(audio_settings)
            except (json.JSONDecodeError, ValueError):
                audio_settings = None
        elif not audio_settings:
            audio_settings = None

        return cls(
            id=d.get("project_id") or d.get("id") or "",
            title=d.get("title") or "Untitled Webtoon",
            genre=d.get("genre") or "general",
            author=d.get("author") or "Unknown Author",
            episode=d.get("episode") or d.get("episode_number") or "Chapter 1",
            status=d.get("status") or "pending",
            panels_count=int(d.get("panels_count") or 0),
            series_id=d.get("series_id") or "",
            user_id=d.get("user_id") or "",
            url=d.get("url") or d.get("original_url"),
            video_url=d.get("video_url"),
            cover_image=d.get("cover_image"),
            synopsis=d.get("synopsis"),
            series_slug=d.get("series_slug") or "",
            chapter_slug=d.get("chapter_slug") or "",
            audio_settings=audio_settings,
            created_at=d.get("created_at"),
            updated_at=d.get("updated_at"),
        )

    def to_dict(self) -> Dict[str, Any]:
        """
        Serialise back to a raw dict compatible with the API response format.

        Uses `project_id` (not `id`) to match the existing API contract.
        """
        return {
            "project_id": self.id,
            "title": self.title,
            "genre": self.genre,
            "author": self.author,
            "episode": self.episode,
            "status": self.status,
            "panels_count": self.panels_count,
            "series_id": self.series_id,
            "user_id": self.user_id,
            "url": self.url,
            "video_url": self.video_url,
            "cover_image": self.cover_image,
            "synopsis": self.synopsis,
            "series_slug": self.series_slug,
            "chapter_slug": self.chapter_slug,
            "audio_settings": self.audio_settings,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }


# ─────────────────────────────────────────────────────────────────────────────
# Series — a webtoon series (parent of chapters)
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class Series:
    """
    A webtoon series — the parent container for one or more chapters.

    Maps to the `series` database table.
    """

    id: str
    user_id: str
    title: str
    slug: str
    author: str
    genre: str

    # Optional metadata
    cover_image: Optional[str] = None
    synopsis: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    # ── Business rules ────────────────────────────────────────────────────────

    def is_authored(self) -> bool:
        """True when the series has a named human author."""
        return bool(self.author and self.author.strip() and self.author != "Unknown Author")

    def has_cover(self) -> bool:
        return bool(self.cover_image)

    def has_synopsis(self) -> bool:
        return bool(self.synopsis and self.synopsis.strip())

    # ── Conversion helpers ────────────────────────────────────────────────────

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "Series":
        """Construct a Series from a raw DB row dict."""
        return cls(
            id=d.get("id") or "",
            user_id=d.get("user_id") or "",
            title=d.get("title") or "Untitled Series",
            slug=d.get("slug") or "",
            author=d.get("author") or "Unknown Author",
            genre=d.get("genre") or "general",
            cover_image=d.get("cover_image"),
            synopsis=d.get("synopsis"),
            created_at=d.get("created_at"),
            updated_at=d.get("updated_at"),
        )

    def to_dict(self) -> Dict[str, Any]:
        """Serialise to a raw dict matching the series table schema."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "slug": self.slug,
            "author": self.author,
            "genre": self.genre,
            "cover_image": self.cover_image,
            "synopsis": self.synopsis,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }


# ─────────────────────────────────────────────────────────────────────────────
# TokenLog — LLM token usage record
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class TokenLog:
    """
    A single LLM token-usage record for one AI operation on a project.

    Maps to the `token_usage_logs` database table.
    """

    id: str
    project_id: str
    input_tokens: int
    output_tokens: int
    total_tokens: int
    estimated_cost_usd: float
    created_at: Optional[str] = None

    # ── Business rules ────────────────────────────────────────────────────────

    def is_costly(self, threshold_usd: float = 0.10) -> bool:
        """True when this single operation exceeded a cost threshold."""
        return self.estimated_cost_usd >= threshold_usd

    def token_ratio(self) -> float:
        """Output-to-input token ratio (useful for detecting runaway responses)."""
        if self.input_tokens == 0:
            return 0.0
        return self.output_tokens / self.input_tokens

    # ── Conversion helpers ────────────────────────────────────────────────────

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "TokenLog":
        """Construct a TokenLog from a raw DB row dict."""
        return cls(
            id=d.get("id") or "",
            project_id=d.get("project_id") or "",
            input_tokens=int(d.get("input_tokens") or 0),
            output_tokens=int(d.get("output_tokens") or 0),
            total_tokens=int(d.get("total_tokens") or 0),
            estimated_cost_usd=float(d.get("estimated_cost_usd") or 0.0),
            created_at=d.get("created_at"),
        )

    def to_dict(self) -> Dict[str, Any]:
        """Serialise to a raw dict matching the token_usage_logs table schema."""
        return {
            "id": self.id,
            "project_id": self.project_id,
            "input_tokens": self.input_tokens,
            "output_tokens": self.output_tokens,
            "total_tokens": self.total_tokens,
            "estimated_cost_usd": self.estimated_cost_usd,
            "created_at": self.created_at,
        }
