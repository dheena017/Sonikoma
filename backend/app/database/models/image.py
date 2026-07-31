"""Image cache and edit-history models."""

from __future__ import annotations

from sqlalchemy import Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from database.base import Base


class ScrapeSession(Base):
    __tablename__ = "scrape_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    url: Mapped[str] = mapped_column(Text, nullable=False)
    image_urls: Mapped[str] = mapped_column(Text, nullable=False)
    panel_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    scraped_at: Mapped[str] = mapped_column(String, server_default=func.current_timestamp())


class EditHistory(Base):
    __tablename__ = "edit_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    edited_url: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    original_url: Mapped[str] = mapped_column(Text, nullable=False)
    edit_type: Mapped[str] = mapped_column(String, nullable=False, default="crop")
    created_at: Mapped[str] = mapped_column(String, server_default=func.current_timestamp())
