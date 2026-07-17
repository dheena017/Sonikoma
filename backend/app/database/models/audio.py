"""Audio asset models."""

from __future__ import annotations

from sqlalchemy import Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from database.base import Base


class AudioAsset(Base):
    __tablename__ = "audio_assets"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    chapter_id: Mapped[str | None] = mapped_column(
        ForeignKey("chapters.id", ondelete="CASCADE")
    )
    panel_id: Mapped[int | None] = mapped_column(ForeignKey("panels.id", ondelete="SET NULL"))
    asset_type: Mapped[str] = mapped_column(String, nullable=False, default="voiceover")
    url: Mapped[str] = mapped_column(Text, nullable=False)
    duration: Mapped[float | None] = mapped_column(Float)
    provider: Mapped[str | None] = mapped_column(String)
    metadata_json: Mapped[str] = mapped_column(Text, nullable=False, default="{}")
    created_at: Mapped[str] = mapped_column(String, server_default=func.current_timestamp())
