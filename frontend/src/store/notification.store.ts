import { create } from "zustand";
import { api } from "@/lib/api";
import type { notification } from "@/types";

interface NotificationState {
  notifications: notification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (notification: notification) => void;
  removeNotification: (notificationId: string) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  fetchNotifications: async (): Promise<void> => {
    set({ loading: true });
    try {
      const { data } = await api.get("/notifications");
      set({
        notifications: data.data.notifications as notification[],
        unreadCount: data.data.unreadCount as number,
      });
    } catch (error: unknown) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      set({ loading: false });
    }
  },

  markAsRead: async (notificationId: string): Promise<void> => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      set(
        (state: NotificationState): Partial<NotificationState> => ({
          notifications: state.notifications.map((n: notification) =>
            n._id === notificationId ? { ...n, isRead: true } : n,
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        }),
      );
    } catch (error: unknown) {
      console.error("Failed to mark notification as read:", error);
    }
  },

  markAllAsRead: async (): Promise<void> => {
    try {
      await api.put("/notifications/read-all");
      set(
        (state: NotificationState): Partial<NotificationState> => ({
          notifications: state.notifications.map((n: notification) => ({
            ...n,
            isRead: true,
          })),
          unreadCount: 0,
        }),
      );
    } catch (error: unknown) {
      console.error("Failed to mark all notifications as read:", error);
    }
  },

  addNotification: (notification: notification): void => {
    set(
      (state: NotificationState): Partial<NotificationState> => ({
        notifications: [notification, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      }),
    );
  },

  removeNotification: (notificationId: string): void => {
    set(
      (state: NotificationState): Partial<NotificationState> => ({
        notifications: state.notifications.filter(
          (n: notification) => n._id !== notificationId,
        ),
      }),
    );
  },
}));
