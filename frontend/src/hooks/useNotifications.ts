import { useState } from "react";
import type { Notification, NotificationType } from "../components/NotificationStack";

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (
    message: string,
    type: NotificationType,
    options?: { errorCode?: number; retryDelay?: number; onRetry?: () => void }
  ) => {
    const id = Date.now() + Math.random();
    setNotifications((prev) => [...prev, { id, message, type, ...options }]);

    // Only auto-dismiss if a countdown/retry action is NOT active
    if (!options?.onRetry) {
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, 5000);
    }
  };

  const removeNotification = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return {
    notifications,
    setNotifications,
    addNotification,
    removeNotification,
  };
}
