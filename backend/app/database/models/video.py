"""Video publishing models."""

from __future__ import annotations

from sqlalchemy import ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from database.base import Base


class YouTubeProfile(Base):
    __tablename__ = "youtube_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String, nullable=False)
    title_template: Mapped[str] = mapped_column(Text, nullable=False)
    description_template: Mapped[str] = mapped_column(Text, nullable=False)
    tags: Mapped[str] = mapped_column(Text, nullable=False)
    category_id: Mapped[str] = mapped_column(String, nullable=False, default="1")
    privacy_status: Mapped[str] = mapped_column(String, nullable=False, default="unlisted")
    is_short: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    made_for_kids: Mapped[str] = mapped_column(String, nullable=False, default="no")
    paid_promotion: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    license: Mapped[str] = mapped_column(String, nullable=False, default="youtube")
    video_language: Mapped[str] = mapped_column(String, nullable=False, default="en")
    channel_link: Mapped[str | None] = mapped_column(Text)
    discord_link: Mapped[str | None] = mapped_column(Text)
    patreon_link: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[str] = mapped_column(String, server_default=func.current_timestamp())

    __table_args__ = (UniqueConstraint("user_id", "name", name="uq_youtube_profiles_user_name"),)


class YouTubePublication(Base):
    __tablename__ = "youtube_publications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    chapter_id: Mapped[str | None] = mapped_column(
        ForeignKey("chapters.id", ondelete="SET NULL")
    )
    youtube_url: Mapped[str] = mapped_column(Text, nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    privacy_status: Mapped[str] = mapped_column(String, nullable=False, default="unlisted")
    published_at: Mapped[str] = mapped_column(String, server_default=func.current_timestamp())


class YouTubeCredential(Base):
    __tablename__ = "youtube_credentials"

    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    client_id: Mapped[str] = mapped_column(Text, nullable=False)
    client_secret: Mapped[str] = mapped_column(Text, nullable=False)
    project_id: Mapped[str] = mapped_column(Text, nullable=False)
    updated_at: Mapped[str] = mapped_column(String, server_default=func.current_timestamp())
