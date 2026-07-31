"""Series, chapter, and storyboard panel models."""

from __future__ import annotations

from sqlalchemy import Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database.base import Base


class Series(Base):
    __tablename__ = "series"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    title: Mapped[str] = mapped_column(String, nullable=False)
    slug: Mapped[str | None] = mapped_column(String, unique=True)
    author: Mapped[str] = mapped_column(String, nullable=False)
    cover_image: Mapped[str | None] = mapped_column(Text)
    genre: Mapped[str] = mapped_column(String, nullable=False, default="general")
    synopsis: Mapped[str | None] = mapped_column(Text)
    is_flagged: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[str] = mapped_column(String, server_default=func.current_timestamp())

    chapters: Mapped[list["Chapter"]] = relationship(
        back_populates="series",
        cascade="all, delete-orphan",
    )


class Chapter(Base):
    __tablename__ = "chapters"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    series_id: Mapped[str] = mapped_column(ForeignKey("series.id", ondelete="CASCADE"))
    episode_number: Mapped[str] = mapped_column(String, nullable=False)
    slug: Mapped[str | None] = mapped_column(String, unique=True)
    original_url: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String, nullable=False, default="pending")
    panels_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    video_url: Mapped[str | None] = mapped_column(Text)
    total_tokens_used: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    audio_settings: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[str] = mapped_column(String, server_default=func.current_timestamp())
    updated_at: Mapped[str] = mapped_column(String, server_default=func.current_timestamp())

    series: Mapped[Series] = relationship(back_populates="chapters")
    panels: Mapped[list["Panel"]] = relationship(
        back_populates="chapter",
        cascade="all, delete-orphan",
    )


class Panel(Base):
    __tablename__ = "panels"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    chapter_id: Mapped[str] = mapped_column(ForeignKey("chapters.id", ondelete="CASCADE"))
    panel_index: Mapped[int] = mapped_column(Integer, nullable=False)
    image_url: Mapped[str] = mapped_column(Text, nullable=False)
    original_url: Mapped[str | None] = mapped_column(Text)
    speech_text: Mapped[str] = mapped_column(Text, nullable=False, default="")
    sfx: Mapped[str] = mapped_column(Text, nullable=False, default="")
    duration: Mapped[float] = mapped_column(Float, nullable=False, default=4.5)
    motion_type: Mapped[str] = mapped_column(String, nullable=False, default="zoom_in")
    visual_description: Mapped[str | None] = mapped_column(Text)
    brightness: Mapped[float | None] = mapped_column(Float)
    contrast: Mapped[float | None] = mapped_column(Float)
    saturation: Mapped[float | None] = mapped_column(Float)
    grayscale: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    filter_preset: Mapped[str | None] = mapped_column(String)
    bubble_method: Mapped[str | None] = mapped_column(String)
    bubble_sensitivity: Mapped[float | None] = mapped_column(Float)
    bubble_dilation: Mapped[float | None] = mapped_column(Float)
    inpaint_radius: Mapped[int | None] = mapped_column(Integer)
    detection_style: Mapped[str | None] = mapped_column(String)
    audio_url: Mapped[str | None] = mapped_column(Text)
    smart_crop: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    crop_padding: Mapped[int | None] = mapped_column(Integer)
    is_sanitized: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[str] = mapped_column(String, server_default=func.current_timestamp())

    chapter: Mapped[Chapter] = relationship(back_populates="panels")
