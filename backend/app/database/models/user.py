"""User, session, billing, API key, and credit models."""

from __future__ import annotations

from sqlalchemy import ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    username: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    preferences: Mapped[str] = mapped_column(Text, nullable=False, default="{}")
    avatar_url: Mapped[str | None] = mapped_column(Text)
    full_name: Mapped[str | None] = mapped_column(String)
    google_id: Mapped[str | None] = mapped_column(String)
    creator_role: Mapped[str] = mapped_column(String, nullable=False, default="creator")
    bio: Mapped[str] = mapped_column(Text, nullable=False, default="")
    newsletter: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    language: Mapped[str] = mapped_column(String, nullable=False, default="en")
    portfolio_links: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    credits: Mapped[int] = mapped_column(Integer, nullable=False, default=840)
    credit_balance: Mapped[int] = mapped_column(Integer, nullable=False, default=840)
    last_claimed_date: Mapped[str | None] = mapped_column(String)
    unlocked_rewards: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    mfa_enabled: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    social_connections: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        default='{"google":true,"github":false,"discord":false}',
    )
    is_locked: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[str] = mapped_column(String, server_default=func.current_timestamp())
    updated_at: Mapped[str] = mapped_column(String, server_default=func.current_timestamp())

    sessions: Mapped[list["UserSession"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )


class UserSession(Base):
    __tablename__ = "user_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    session_id: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    browser: Mapped[str] = mapped_column(String, nullable=False)
    ip: Mapped[str] = mapped_column(String, nullable=False)
    location: Mapped[str] = mapped_column(String, nullable=False)
    active: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    created_at: Mapped[str] = mapped_column(String, server_default=func.current_timestamp())

    user: Mapped[User] = relationship(back_populates="sessions")


class UserAuditLog(Base):
    __tablename__ = "user_audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    event: Mapped[str] = mapped_column(String, nullable=False)
    ip: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[str] = mapped_column(String, server_default=func.current_timestamp())


class UserInvoice(Base):
    __tablename__ = "user_invoices"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    invoice_id: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[str] = mapped_column(String, server_default=func.current_timestamp())


class UserAPIKey(Base):
    __tablename__ = "user_api_keys"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    key_id: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String, nullable=False)
    api_key: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    created_at: Mapped[str] = mapped_column(String, server_default=func.current_timestamp())


class CreditTransaction(Base):
    __tablename__ = "credit_transactions"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    amount: Mapped[int] = mapped_column(Integer, nullable=False)
    feature_name: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[str] = mapped_column(String, server_default=func.current_timestamp())
