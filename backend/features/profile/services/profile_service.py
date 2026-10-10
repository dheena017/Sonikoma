"""
backend/features/profile/services/profile_service.py
─────────────────────────────────────────────────────────────────────────────
User Profile, Sessions, Invoices, Audit Logs, Analytics & Achievements services.
─────────────────────────────────────────────────────────────────────────────
"""

import datetime
import json
import logging
from typing import Any, Dict

from fastapi import HTTPException

from database.engine import get_db_connection
from features.profile.schemas import ProfileUpdate
from features.auth.repositories import (
    update_user,
    delete_user,
    get_user_sessions,
    terminate_user_session,
    get_user_invoices,
    write_audit_log,
    get_audit_logs,
)

logger = logging.getLogger("sonikoma.features.profile.services.profile")


# ─────────────────────────────────────────────────────────────────────────────
# 1. Profile Details & Settings
# ─────────────────────────────────────────────────────────────────────────────

def get_user_profile(user_id: str, current_user: dict) -> Dict[str, Any]:
    """Fetch and assemble the complete authenticated user profile payload."""
    try:
        portfolio_links = json.loads(current_user.get("portfolio_links") or "[]")
    except Exception:
        portfolio_links = []

    try:
        social_connections = json.loads(
            current_user.get("social_connections") or '{"google":true,"discord":false}'
        )
    except Exception:
        social_connections = {"google": True, "discord": False}

    try:
        unlocked_rewards = json.loads(current_user.get("unlocked_rewards") or "[]")
    except Exception:
        unlocked_rewards = []

    pref_str = current_user.get("preferences") or "{}"
    try:
        prefs = json.loads(pref_str)
    except Exception:
        prefs = {}

    streak = prefs.get("claim_streak", 1)
    if not isinstance(streak, int) or streak < 1 or streak > 7:
        streak = 1

    today = datetime.datetime.now()
    today_str = today.strftime("%Y-%m-%d")
    yesterday_str = (today - datetime.timedelta(days=1)).strftime("%Y-%m-%d")

    has_claimed_today = current_user.get("last_claimed_date") == today_str

    last_claimed = current_user.get("last_claimed_date")
    if last_claimed and last_claimed != today_str and last_claimed != yesterday_str:
        streak = 1
        prefs["claim_streak"] = 1
        update_user(user_id, {"preferences": json.dumps(prefs)})

    ach_data = get_user_achievements_and_points(user_id)

    return {
        "user_id": user_id,
        "email": current_user.get("email"),
        "full_name": current_user.get("full_name"),
        "avatar_url": current_user.get("avatar_url"),
        "creator_role": current_user.get("creator_role") or "creator",
        "bio": current_user.get("bio") or "",
        "location": current_user.get("location") or "",
        "website": current_user.get("website") or "",
        "timezone": current_user.get("timezone") or "UTC",
        "newsletter": bool(current_user.get("newsletter")),
        "language": current_user.get("language") or "en",
        "portfolio_links": portfolio_links,
        "credits": current_user.get("credits") if current_user.get("credits") is not None else 840,
        "unlocked_rewards": unlocked_rewards,
        "mfa_enabled": bool(current_user.get("mfa_enabled")),
        "social_connections": social_connections,
        "has_claimed_today": has_claimed_today,
        "streak_days": streak,
        "subscription_tier": prefs.get("subscription_tier", "free"),
        "preferences": prefs,
        "unlocked_achievements": ach_data.get("unlocked_achievements", []),
        "achievement_points": ach_data.get("achievement_points", 0),
    }


def update_user_profile(
    user_id: str,
    current_user: dict,
    body: ProfileUpdate,
    ip_addr: str = "127.0.0.1",
) -> Dict[str, Any]:
    """Update profile fields, portfolio links, social connections and preferences."""
    updates: Dict[str, Any] = {}
    if body.full_name is not None:
        updates["full_name"] = body.full_name
    if body.avatar_url is not None:
        updates["avatar_url"] = body.avatar_url
    if body.creator_role is not None:
        updates["creator_role"] = body.creator_role
    if body.bio is not None:
        updates["bio"] = body.bio
    if body.location is not None:
        updates["location"] = body.location
    if body.website is not None:
        updates["website"] = body.website
    if body.timezone is not None:
        updates["timezone"] = body.timezone
    if body.newsletter is not None:
        updates["newsletter"] = 1 if body.newsletter else 0
    if body.language is not None:
        updates["language"] = body.language
    if body.portfolio_links is not None:
        updates["portfolio_links"] = json.dumps(
            [link.model_dump() for link in body.portfolio_links]
        )
    if body.social_connections is not None:
        updates["social_connections"] = json.dumps(body.social_connections)
    if body.preferences is not None:
        try:
            existing_pref_str = current_user.get("preferences") or "{}"
            existing_prefs = json.loads(existing_pref_str)
        except Exception:
            existing_prefs = {}
        existing_prefs.update(body.preferences)
        updates["preferences"] = json.dumps(existing_prefs)

    if updates:
        update_user(user_id, updates)
        write_audit_log(user_id, "Updated Profile Settings", ip_addr, "Success")

    return {"success": True, "message": "Profile updated successfully."}


def delete_account(user_id: str, ip_addr: str = "127.0.0.1") -> Dict[str, Any]:
    """Permanently delete user account and associated credentials."""
    try:
        write_audit_log(user_id, "Self-deleted account", ip_addr, "Success")
        delete_user(user_id)
        return {"success": True, "message": "Account deleted successfully"}
    except Exception as e:
        logger.error(f"Failed to delete account: {e}")
        write_audit_log(user_id, "Self-delete account failed", ip_addr, "Failure")
        raise HTTPException(status_code=500, detail=str(e))


def get_user_sessions_service(user_id: str, limit: int = 20, offset: int = 0) -> Dict[str, Any]:
    """Fetch active device sessions."""
    sessions = get_user_sessions(user_id)
    total = len(sessions)
    return {"success": True, "total": total, "sessions": sessions[offset:offset + limit]}


def terminate_session(user_id: str, session_id: str, ip_addr: str = "127.0.0.1") -> Dict[str, Any]:
    """Revoke a specific device session."""
    terminate_user_session(user_id, session_id)
    write_audit_log(user_id, f"Terminated Device Session: {session_id}", ip_addr, "Success")
    return {"success": True, "message": "Session terminated successfully."}


def get_user_audit_logs(
    user_id: str,
    query: str = "",
    page: int = 1,
    limit: int = 10,
) -> Dict[str, Any]:
    """Fetch paginated audit logs for the user."""
    offset = (page - 1) * limit
    logs, total = get_audit_logs(user_id, query=query or "", limit=limit, offset=offset)
    return {
        "success": True,
        "logs": logs,
        "total": total,
        "page": page,
        "limit": limit,
    }


def get_user_invoices_service(user_id: str, limit: int = 20, offset: int = 0) -> Dict[str, Any]:
    """Fetch billing invoices history."""
    invoices = get_user_invoices(user_id)
    total = len(invoices)
    return {"success": True, "total": total, "invoices": invoices[offset:offset + limit]}


# ─────────────────────────────────────────────────────────────────────────────
# 2. Creator Analytics & Heatmap
# ─────────────────────────────────────────────────────────────────────────────

def get_creator_analytics(user_id: str) -> Dict[str, Any]:
    """Aggregate analytics, recent activity, and 12-week heatmap cells."""
    conn = get_db_connection()
    try:
        completed_row = conn.execute("""
            SELECT COUNT(*) as c FROM chapters c
            JOIN series s ON c.series_id = s.id
            WHERE s.user_id = ? AND c.status = 'completed'
        """, (user_id,)).fetchone()
        videos_completed = completed_row["c"] if completed_row else 0

        duration_row = conn.execute("""
            SELECT SUM(p.duration) as d FROM panels p
            JOIN chapters c ON p.chapter_id = c.id
            JOIN series s ON c.series_id = s.id
            WHERE s.user_id = ? AND c.status = 'completed'
        """, (user_id,)).fetchone()
        total_duration_sec = duration_row["d"] if duration_row and duration_row["d"] is not None else 0

        clean_row = conn.execute("""
            SELECT COUNT(*) as c FROM panels p
            JOIN chapters c ON p.chapter_id = c.id
            JOIN series s ON c.series_id = s.id
            WHERE s.user_id = ? AND (p.bubble_method IS NOT NULL OR p.grayscale = 1)
        """, (user_id,)).fetchone()
        bubble_cleans = clean_row["c"] if clean_row else 0

        edit_row = conn.execute("SELECT COUNT(*) as c FROM edit_history").fetchone()
        total_edits = edit_row["c"] if edit_row else 0

        credits_optimized_pct = min(95, max(15, 10 + bubble_cleans * 3 + total_edits * 2))
        avg_latency = round(max(0.8, min(3.5, 1.8 + (bubble_cleans * 0.05) - (videos_completed * 0.02))), 1)

        chapter_rows = conn.execute("""
            SELECT COUNT(*) as c FROM chapters c
            JOIN series s ON c.series_id = s.id
            WHERE s.user_id = ?
        """, (user_id,)).fetchone()
        total_chaps = chapter_rows["c"] if chapter_rows else 0

        user_row = conn.execute("SELECT preferences FROM users WHERE id = ?", (user_id,)).fetchone()
        pref_str = user_row["preferences"] if user_row else "{}"
        try:
            prefs = json.loads(pref_str)
        except Exception:
            prefs = {}

        curr_ratio = prefs.get("aspectRatio", "9:16")
        if curr_ratio == "16:9":
            aspect_widescreen_count = max(1, total_chaps)
            aspect_vertical_count = 0
        else:
            aspect_vertical_count = max(1, total_chaps)
            aspect_widescreen_count = 0

        total_ratio = aspect_vertical_count + aspect_widescreen_count
        if total_ratio > 0:
            vertical_pct = round((aspect_vertical_count / total_ratio) * 100)
            widescreen_pct = 100 - vertical_pct
        else:
            vertical_pct = 0
            widescreen_pct = 0

        voice_pref = prefs.get("voiceActor", "Matthew")
        voices = {"Matthew": 0, "Rachel": 0, "Marcus": 0}
        if total_chaps > 0 and voice_pref in voices:
            voices[voice_pref] = 100

        narrations = {"Storyteller Badges": 0, "Snappy Subtitles": 0}
        if total_chaps > 0:
            narrations["Storyteller Badges"] = 100

        activities = []
        chap_list = conn.execute("""
            SELECT c.id, c.episode_number, s.title, c.status, c.created_at
            FROM chapters c
            JOIN series s ON c.series_id = s.id
            WHERE s.user_id = ?
            ORDER BY c.created_at DESC LIMIT 5
        """, (user_id,)).fetchall()
        for chap in chap_list:
            time_str = chap["created_at"]
            if chap["status"] == "completed":
                activities.append({
                    "title": f"Compiled {chap['title']} {chap['episode_number']}",
                    "desc": "Synthesized full MP4 video and dialogue subtitles",
                    "time": time_str,
                })
            else:
                activities.append({
                    "title": f"Scraped {chap['title']} {chap['episode_number']}",
                    "desc": "Extracted panel strips and storyboard metadata",
                    "time": time_str,
                })

        edit_list = conn.execute("SELECT edit_type, created_at FROM edit_history ORDER BY created_at DESC LIMIT 5").fetchall()
        for edit in edit_list:
            activities.append({
                "title": f"Cleaned panels via {edit['edit_type']}",
                "desc": f"Applied {edit['edit_type']} filter / image enhancement modification",
                "time": edit["created_at"],
            })

        audit_list = conn.execute("""
            SELECT event, created_at
            FROM user_audit_logs
            WHERE user_id = ?
            ORDER BY created_at DESC LIMIT 5
        """, (user_id,)).fetchall()
        for audit in audit_list:
            activities.append({
                "title": audit["event"],
                "desc": "Triggered by user account activity",
                "time": audit["created_at"],
            })

        def parse_to_timestamp(val):
            if not val:
                return 0.0
            if isinstance(val, (int, float)):
                return float(val)
            clean_val = str(val).strip().replace("Z", "+00:00")
            try:
                if "T" in clean_val:
                    dt = datetime.datetime.fromisoformat(clean_val)
                else:
                    dt = datetime.datetime.strptime(clean_val.split(".")[0], "%Y-%m-%d %H:%M:%S")
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=datetime.timezone.utc)
                return dt.timestamp()
            except Exception:
                return 0.0

        activities.sort(key=lambda x: parse_to_timestamp(x.get("time")), reverse=True)
        activities = activities[:6]

        def format_relative_time(raw_time):
            if not raw_time:
                return "Just now"
            try:
                clean_time = str(raw_time).replace("Z", "+00:00")
                if "T" in clean_time:
                    dt = datetime.datetime.fromisoformat(clean_time)
                else:
                    dt = datetime.datetime.strptime(clean_time.split(".")[0], "%Y-%m-%d %H:%M:%S")

                now = datetime.datetime.utcnow() if dt.tzinfo is None else datetime.datetime.now(datetime.timezone.utc)
                diff = now - dt
                total_seconds = int(diff.total_seconds())

                if total_seconds < 0 or total_seconds < 60:
                    return "Just now"
                elif total_seconds < 3600:
                    mins = total_seconds // 60
                    return f"{mins} minute{'s' if mins != 1 else ''} ago"
                elif total_seconds < 86400:
                    hours = total_seconds // 3600
                    return f"{hours} hour{'s' if hours != 1 else ''} ago"
                elif total_seconds < 172800:
                    return "1 day ago"
                elif total_seconds < 604800:
                    days = total_seconds // 86400
                    return f"{days} days ago"
                else:
                    return dt.strftime("%b %d, %Y")
            except Exception:
                return str(raw_time).split("T")[0] if "T" in str(raw_time) else str(raw_time).split(" ")[0]

        for act in activities:
            raw_t = act.get("time")
            act["timestamp"] = raw_t
            act["time"] = format_relative_time(raw_t)

        if not activities:
            activities = [{"title": "System Initialized", "desc": "Creator account profile created successfully", "time": "Just now", "timestamp": None}]

        counts_by_date = {}

        def aggregate_counts(query, params=()):
            rows = conn.execute(query, params).fetchall()
            for row in rows:
                counts_by_date[row["date"]] = counts_by_date.get(row["date"], 0) + row["count"]

        aggregate_counts("""
            SELECT strftime('%Y-%m-%d', c.created_at) as date, COUNT(*) as count
            FROM chapters c
            JOIN series s ON c.series_id = s.id
            WHERE s.user_id = ?
            GROUP BY date
        """, (user_id,))
        aggregate_counts("SELECT strftime('%Y-%m-%d', created_at) as date, COUNT(*) as count FROM user_audit_logs WHERE user_id = ? GROUP BY date", (user_id,))
        aggregate_counts("SELECT strftime('%Y-%m-%d', created_at) as date, COUNT(*) as count FROM edit_history GROUP BY date")

        today = datetime.datetime.now().date()
        cells = []
        for i in range(84):
            date_val = today - datetime.timedelta(days=(83 - i))
            date_str = date_val.strftime("%Y-%m-%d")
            count = counts_by_date.get(date_str, 0)

            level = 0
            if count > 0 and count <= 2:
                level = 1
            elif count > 2 and count <= 4:
                level = 2
            elif count > 4:
                level = 3

            cells.append({"day": date_val.strftime("%a"), "date": date_str, "count": count, "level": level})

        weeks = []
        for w in range(12):
            week_cells = cells[w * 7:(w + 1) * 7]
            weeks.append(week_cells)

        return {
            "videos_completed": videos_completed,
            "total_duration_sec": total_duration_sec,
            "avg_latency": avg_latency,
            "credits_optimized_pct": credits_optimized_pct,
            "formats": {
                "vertical_pct": vertical_pct,
                "widescreen_pct": widescreen_pct,
            },
            "voices": voices,
            "narrations": narrations,
            "heatmap": weeks,
            "activities": activities,
        }
    finally:
        conn.close()


# ─────────────────────────────────────────────────────────────────────────────
# 3. Gamification Achievements & Points
# ─────────────────────────────────────────────────────────────────────────────

def get_user_achievements_and_points(user_id: str) -> dict:
    """Calculate unlocked badges and points balance from user actions."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM series WHERE user_id = ?", (user_id,))
        row1 = cursor.fetchone()
        series_count = row1[0] if row1 else 0
        first_scrape = series_count > 0

        cursor.execute("""
            SELECT COUNT(*) FROM user_audit_logs
            WHERE user_id = ? AND (event LIKE '%translation%' OR event LIKE '%translate%')
        """, (user_id,))
        row2 = cursor.fetchone()
        translation_count = row2[0] if row2 else 0
        gemini_translator = translation_count > 0

        cursor.execute("""
            SELECT COUNT(*) FROM user_audit_logs
            WHERE user_id = ? AND event LIKE '%Saved Storyboard Panels%'
        """, (user_id,))
        row3 = cursor.fetchone()
        saved_panels_count = row3[0] if row3 else 0

        cursor.execute("""
            SELECT COUNT(*) FROM panels p
            JOIN chapters c ON p.chapter_id = c.id
            JOIN series s ON c.series_id = s.id
            WHERE s.user_id = ?
        """, (user_id,))
        row4 = cursor.fetchone()
        panels_count = row4[0] if row4 else 0
        keyframe_director = (saved_panels_count > 0) or (panels_count > 0)

        cursor.execute("""
            SELECT COUNT(*) FROM chapters c
            JOIN series s ON c.series_id = s.id
            WHERE s.user_id = ? AND c.status = 'completed'
        """, (user_id,))
        row5 = cursor.fetchone()
        completed_count = row5[0] if row5 else 0
        pro_producer = completed_count > 0

        unlocked = []
        if first_scrape:
            unlocked.append("First Scrape")
        if gemini_translator:
            unlocked.append("Gemini Translator")
        if keyframe_director:
            unlocked.append("Keyframe Director")
        if pro_producer:
            unlocked.append("Pro Producer")

        points = 80 + len(unlocked) * 100

        cursor.execute("SELECT unlocked_rewards FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        unlocked_rewards_str = row[0] if row else "[]"
        try:
            unlocked_rewards = json.loads(unlocked_rewards_str)
        except Exception:
            unlocked_rewards = []

        for reward in unlocked_rewards:
            if "+100 AI Credits" in reward:
                points -= 150
            elif "Pro Editor Badge" in reward:
                points -= 200

        points = max(0, points)

        return {
            "unlocked_achievements": unlocked,
            "achievement_points": points,
        }
    finally:
        conn.close()


__all__ = [
    "get_user_profile",
    "update_user_profile",
    "delete_account",
    "get_user_sessions_service",
    "terminate_session",
    "get_user_audit_logs",
    "get_user_invoices_service",
    "get_creator_analytics",
    "get_user_achievements_and_points",
]
