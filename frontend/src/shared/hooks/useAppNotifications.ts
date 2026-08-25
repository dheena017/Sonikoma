import { useState, useCallback, useEffect } from "react";
import { Notification, NotificationType } from "@/features/app_notification";
import { ErrorModalDetail } from "@/shared/ui/modal/ErrorModal";
import { useAudioFeedback } from "@/features/editor_audio/hooks/useAudioFeedback";

export function useAppNotifications(volume = 80, isMuted = false) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsMuted, setNotificationsMuted] = useState<boolean>(() => {
    try {
      return localStorage.getItem("ai_comic_notifications_muted") === "true";
    } catch {
      return false;
    }
  });
  const [errorModalDetail, setErrorModalDetail] = useState<ErrorModalDetail | null>(null);
  const audioFeedback = useAudioFeedback(volume, isMuted || notificationsMuted);

  useEffect(() => {
    try {
      localStorage.setItem("ai_comic_notifications_muted", String(notificationsMuted));
    } catch {}
  }, [notificationsMuted]);

  const addNotification = useCallback(
    (
      message: string,
      type: NotificationType = "info",
      options?: {
        errorCode?: number;
        retryDelay?: number;
        onRetry?: () => void;
        details?: string;
        link?: string;
      } | number
    ) => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      const opts = typeof options === "object" ? options : undefined;

      const newNotif: Notification = {
        id,
        message,
        type,
        timestamp: Date.now(),
        isRead: false,
        toastDismissed: false,
        errorCode: opts?.errorCode,
        retryDelay: opts?.retryDelay,
        onRetry: opts?.onRetry,
        details: opts?.details,
        link: opts?.link,
      };

      setNotifications((prev) => [...prev, newNotif]);

      if (!notificationsMuted) {
        if (type === "success") {
          audioFeedback?.playSuccess?.();
        } else if (type === "error") {
          audioFeedback?.playError?.();
        } else {
          audioFeedback?.playInfo?.();
        }
      }

      // Auto dismiss toast after 4s
      setTimeout(() => {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, toastDismissed: true } : n))
        );
      }, 4000);
    },
    [audioFeedback, notificationsMuted]
  );

  const dismissNotification = useCallback((id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const markNotificationAsRead = useCallback((id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  }, []);

  const deleteNotification = useCallback((id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, []);

  const showErrorModal = useCallback(
    (detail: ErrorModalDetail) => {
      setErrorModalDetail(detail);
      if (!notificationsMuted) {
        audioFeedback?.playError?.();
      }
    },
    [audioFeedback, notificationsMuted]
  );

  const closeErrorModal = useCallback(() => {
    setErrorModalDetail(null);
  }, []);

  return {
    notifications,
    setNotifications,
    notificationsMuted,
    setNotificationsMuted,
    addNotification,
    dismissNotification,
    markNotificationAsRead,
    deleteNotification,
    clearAllNotifications,
    markAllNotificationsAsRead,
    errorModalDetail,
    setErrorModalDetail,
    showErrorModal,
    closeErrorModal,
    audioFeedback,
  };
}
