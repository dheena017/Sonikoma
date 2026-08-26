import React, { createContext, useContext, useEffect, useMemo, useRef } from "react";
import { NotificationType } from "../components/types";

export interface NotifyOptions {
  errorCode?: number;
  retryDelay?: number;
  onRetry?: () => void;
  details?: string;
  link?: string;
}

export type NotifyFn = (
  message: string,
  type?: NotificationType,
  options?: NotifyOptions | number
) => void;

type NotificationListener = (
  message: string,
  type: NotificationType,
  options?: NotifyOptions | number
) => void;

// Global singleton listener registry for non-React contexts (e.g., API clients, utilities)
const globalListeners = new Set<NotificationListener>();

export const notify = {
  show: (
    message: string,
    type: NotificationType = "info",
    options?: NotifyOptions | number
  ) => {
    globalListeners.forEach((listener) => {
      try {
        listener(message, type, options);
      } catch (err) {
        console.error("[NotificationContext] Listener error:", err);
      }
    });
  },
  info: (message: string, options?: NotifyOptions | number) => {
    notify.show(message, "info", options);
  },
  success: (message: string, options?: NotifyOptions | number) => {
    notify.show(message, "success", options);
  },
  warning: (message: string, options?: NotifyOptions | number) => {
    notify.show(message, "warning", options);
  },
  error: (message: string, options?: NotifyOptions | number) => {
    notify.show(message, "error", options);
  },
  promise: async <T,>(
    promise: Promise<T>,
    msgs: {
      loading?: string;
      success?: string | ((data: T) => string);
      error?: string | ((err: any) => string);
    }
  ): Promise<T> => {
    if (msgs.loading) {
      notify.info(msgs.loading);
    }
    try {
      const data = await promise;
      if (msgs.success) {
        const successMsg =
          typeof msgs.success === "function"
            ? msgs.success(data)
            : msgs.success;
        notify.success(successMsg);
      }
      return data;
    } catch (err: any) {
      if (msgs.error) {
        const errorMsg =
          typeof msgs.error === "function" ? msgs.error(err) : msgs.error;
        notify.error(errorMsg || err?.message || "Operation failed.");
      }
      throw err;
    }
  },
};

export interface NotificationContextValue {
  addNotification: NotifyFn;
  notify: typeof notify;
}

const NotificationContext = createContext<NotificationContextValue>({
  addNotification: notify.show,
  notify,
});

export interface NotificationProviderProps {
  children: React.ReactNode;
  addNotification?: NotifyFn;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  addNotification,
}) => {
  const addNotifRef = useRef(addNotification);
  addNotifRef.current = addNotification;

  useEffect(() => {
    const listener: NotificationListener = (msg, type, opts) => {
      if (addNotifRef.current) {
        addNotifRef.current(msg, type, opts);
      }
    };

    globalListeners.add(listener);
    return () => {
      globalListeners.delete(listener);
    };
  }, []);

  const value = useMemo<NotificationContextValue>(() => {
    const localNotify = {
      show: (
        msg: string,
        type: NotificationType = "info",
        opts?: NotifyOptions | number
      ) => {
        if (addNotifRef.current) {
          addNotifRef.current(msg, type, opts);
        } else {
          notify.show(msg, type, opts);
        }
      },
      info: (msg: string, opts?: NotifyOptions | number) => {
        localNotify.show(msg, "info", opts);
      },
      success: (msg: string, opts?: NotifyOptions | number) => {
        localNotify.show(msg, "success", opts);
      },
      warning: (msg: string, opts?: NotifyOptions | number) => {
        localNotify.show(msg, "warning", opts);
      },
      error: (msg: string, opts?: NotifyOptions | number) => {
        localNotify.show(msg, "error", opts);
      },
      promise: notify.promise,
    };

    return {
      addNotification: (msg, type = "info", opts) => {
        localNotify.show(msg, type, opts);
      },
      notify: localNotify,
    };
  }, []);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export function useNotify() {
  const context = useContext(NotificationContext);
  return context.notify;
}

export function useNotificationContext() {
  return useContext(NotificationContext);
}
