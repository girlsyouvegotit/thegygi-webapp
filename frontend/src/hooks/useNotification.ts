import { createContext, useContext } from "react";
import type { notification } from "@/types";
import type { ToastNotification } from "@/components/notifications/NotificationToast";

export interface NotificationContextValue {
  notifications: notification[];
  unreadCount: number;
  loading: boolean;
  toasts: ToastNotification[];
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismissToast: (toastId: string) => void;
}

export const NotificationContext = createContext<
  NotificationContextValue | undefined
>(undefined);

export const useNotification = (): NotificationContextValue => {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotification must be used within NotificationProvider");
  }
  return ctx;
};

export default useNotification;
