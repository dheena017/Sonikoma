export type NotificationType = "error" | "success" | "info" | "warning";

export interface Notification {
  id: number;
  message: string;
  type: NotificationType;
  errorCode?: number;
  retryDelay?: number;
  onRetry?: () => void;
  timestamp: number;
  details?: string;
  link?: string;
  isRead: boolean;
  toastDismissed?: boolean;
}
