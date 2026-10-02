# Platform Notifications Module (`features/platform/notifications/`)

## 1. Executive Overview & Scope
The **Notifications Module** manages live toast notifications, audio/visual alerts, dropdown message center, and unread badge counters.

## 2. Directory Inventory
- **`components/`**: `NotificationDropdown.tsx`, `NotificationStack.tsx`, toast containers.
- **`context/`**: `NotificationContext.tsx` providing platform-wide notification dispatch.
- **`hooks/`**: `useNotifications.ts`, `useNotificationCountdown.ts`, `useNotificationFiltering.ts`.
- **`pages/`**: `NotificationsPage.tsx` full history archive.
