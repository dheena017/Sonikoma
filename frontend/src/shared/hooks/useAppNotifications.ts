import { useState, useCallback, useEffect, useRef } from "react";
import { Notification, NotificationType } from "@/features/app_notification";
import { ErrorModalDetail } from "@/shared/ui/modal/ErrorModal";
import { useAudioFeedback } from "@/features/editor_audio/hooks/useAudioFeedback";

function formatHumanReadableMessage(rawMessage: string): string {
  if (!rawMessage || typeof rawMessage !== "string") {
    return "Action completed.";
  }

  let msg = rawMessage.trim();

  // Parse JSON error response payload if wrapped
  if (msg.startsWith("{") && msg.endsWith("}")) {
    try {
      const parsed = JSON.parse(msg);
      if (parsed.detail) {
        msg = typeof parsed.detail === "string" ? parsed.detail : JSON.stringify(parsed.detail);
      } else if (parsed.message) {
        msg = parsed.message;
      } else if (parsed.error) {
        msg = typeof parsed.error === "string" ? parsed.error : parsed.error.message || JSON.stringify(parsed.error);
      }
    } catch {
      // ignore
    }
  }

  // Strip technical exception prefixes and backend tags
  msg = msg.replace(/^Error:\s*/i, "");
  msg = msg.replace(/^TypeError:\s*/i, "");
  msg = msg.replace(/^AxiosError:\s*/i, "");
  msg = msg.replace(/^Uncaught\s+/i, "");
  msg = msg.replace(/^\[HTTP\s*\d+\]\s*/i, "");
  msg = msg.replace(/^\[.*?Service\]\s*/i, "");
  msg = msg.replace(/^\[.*?Detector\]\s*/i, "");
  msg = msg.replace(/^\[.*?Engine\]\s*/i, "");
  msg = msg.replace(/^\[.*?API\]\s*/i, "");
  msg = msg.replace(/^(Failed to fetch|NetworkError when attempting to fetch resource\.)/i, "Unable to connect to the server. Please check your network connection.");
  msg = msg.replace(/^Request failed with status code (\d+)/i, "Server returned status $1.");

  msg = msg.trim();
  if (!msg) return "An unexpected event occurred.";

  // Capitalize first letter cleanly
  msg = msg.charAt(0).toUpperCase() + msg.slice(1);
  return msg;
}

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
  const recentNotifsRef = useRef<Map<string, number>>(new Map());

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
      const cleanMsg = formatHumanReadableMessage(message);
      const dedupKey = `${type}:${cleanMsg}`;
      const now = Date.now();
      const lastTriggered = recentNotifsRef.current.get(dedupKey) || 0;

      // Prevent duplicate notification toasts & sounds within 2.5s window
      if (now - lastTriggered < 2500) {
        return;
      }
      recentNotifsRef.current.set(dedupKey, now);

      // Prune old deduplication keys
      if (recentNotifsRef.current.size > 40) {
        for (const [k, ts] of recentNotifsRef.current.entries()) {
          if (now - ts > 10000) {
            recentNotifsRef.current.delete(k);
          }
        }
      }

      // Structured human-readable developer console output
      const prefix = "[Sonikoma]";
      if (type === "error") {
        console.error(`${prefix} [ERROR] ${cleanMsg}`);
      } else if (type === "warning") {
        console.warn(`${prefix} [WARN] ${cleanMsg}`);
      } else if (type === "success") {
        console.info(`${prefix} [SUCCESS] ${cleanMsg}`);
      } else {
        console.info(`${prefix} [INFO] ${cleanMsg}`);
      }

      const id = Date.now() + Math.floor(Math.random() * 1000);
      const opts = typeof options === "object" ? options : undefined;

      const newNotif: Notification = {
        id,
        message: cleanMsg,
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
