"""
backend/app/features/platform/notifications/service.py
─────────────────────────────────────────────────────────────────────────────
Service layer for platform notifications dispatch, storage, and read tracking.
─────────────────────────────────────────────────────────────────────────────
"""

import time
import uuid
import datetime
import logging
from typing import Dict, List, Optional, Any

from .schemas import NotificationItem, NotificationListResponse

logger = logging.getLogger("sonikoma.features.platform.notifications")


class NotificationService:
    def __init__(self):
        # In-memory storage keyed by user_id
        self._user_notifications: Dict[str, List[NotificationItem]] = {}

    def add_notification(
        self,
        user_id: str,
        title: str,
        message: str,
        notif_type: str = "info",
        link: Optional[str] = None,
        data: Optional[Dict[str, Any]] = None
    ) -> NotificationItem:
        notif = NotificationItem(
            id=f"notif_{uuid.uuid4().hex[:12]}",
            user_id=user_id,
            title=title,
            message=message,
            type=notif_type,
            read=False,
            created_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),
            link=link,
            data=data
        )
        user_list = self._user_notifications.setdefault(user_id, [])
        user_list.insert(0, notif)
        if len(user_list) > 200:
            user_list.pop()
        return notif

    def list_notifications(self, user_id: str) -> NotificationListResponse:
        items = self._user_notifications.get(user_id, [])
        # Provide sample welcoming notification if completely empty
        if not items:
            sample = NotificationItem(
                id="notif_welcome",
                user_id=user_id,
                title="Welcome to Sonikoma",
                message="Your workspace is ready. Check out the dashboard or create a new project.",
                type="info",
                read=False,
                created_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),
                link="/platform/projects"
            )
            items = [sample]
            self._user_notifications[user_id] = items

        unread = sum(1 for n in items if not n.read)
        return NotificationListResponse(
            success=True,
            unread_count=unread,
            total=len(items),
            notifications=items
        )

    def mark_read(self, user_id: str, notif_id: str) -> bool:
        items = self._user_notifications.get(user_id, [])
        for n in items:
            if n.id == notif_id:
                n.read = True
                return True
        return False

    def mark_all_read(self, user_id: str) -> int:
        items = self._user_notifications.get(user_id, [])
        count = 0
        for n in items:
            if not n.read:
                n.read = True
                count += 1
        return count

    def clear_all(self, user_id: str) -> None:
        if user_id in self._user_notifications:
            self._user_notifications[user_id] = []


notification_service = NotificationService()
