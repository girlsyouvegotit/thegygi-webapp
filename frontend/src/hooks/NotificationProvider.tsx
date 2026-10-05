import { useCallback, useEffect, useState, type ReactNode } from "react";
import { api } from "@/lib/api";
import {
  initializeSocket,
  disconnectSocket,
  getSocket,
} from "@/lib/socket";
import type { notification } from "@/types";
import { NotificationContext } from "./useNotification";
import type { ToastNotification } from "@/components/notifications/NotificationToast";
import {
  playNotificationSound,
  unlockNotificationAudio,
} from "@/lib/notification-sound";
import { useAuth } from "@/hooks/useAuthContext";

const POLL_MS = 25_000;

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const userId = user?._id ? String(user._id) : "";
  const [notifications, setNotifications] = useState<notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get("/notifications", {
        params: { limit: 50 },
      });
      setNotifications(data.data.notifications || []);
      setUnreadCount(data.data.unreadCount || 0);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((p) => Math.max(0, p - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await api.put("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  }, []);

  const dismissToast = useCallback((toastId: string) => {
    setToasts((prev) => prev.filter((t) => t.toastId !== toastId));
  }, []);

  const pushIncoming = useCallback((n: notification) => {
    setNotifications((prev) => {
      if (prev.some((item) => item._id === n._id)) return prev;
      return [n, ...prev];
    });
    setUnreadCount((p) => p + 1);
    const toastId = `${n._id}-${Date.now()}`;
    setToasts((prev) => [{ ...n, toastId }, ...prev].slice(0, 3));
    playNotificationSound();
  }, []);

  // Initial + auth-gated fetch
  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  // Poll + refetch when tab becomes visible (covers missed sockets)
  useEffect(() => {
    if (!userId) return;

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void fetchNotifications();
      }
    };
    const onFocus = () => {
      void fetchNotifications();
    };

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);
    const poll = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void fetchNotifications();
      }
    }, POLL_MS);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
      window.clearInterval(poll);
    };
  }, [userId, fetchNotifications]);

  // Realtime socket
  useEffect(() => {
    if (!userId) {
      disconnectSocket();
      setToasts([]);
      return;
    }

    const unlock = () => unlockNotificationAudio();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });

    const existing = getSocket();
    if (existing?.connected) {
      existing.disconnect();
    }
    disconnectSocket();

    const socket = initializeSocket();

    const onNew = (n: notification) => pushIncoming(n);
    const onConnect = () => {
      socket.emit("join-notifications");
      void fetchNotifications();
    };

    socket.on("new-notification", onNew);
    socket.on("connect", onConnect);
    if (socket.connected) {
      socket.emit("join-notifications");
    }

    return () => {
      socket.off("new-notification", onNew);
      socket.off("connect", onConnect);
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [userId, fetchNotifications, pushIncoming]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        toasts,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        dismissToast,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
