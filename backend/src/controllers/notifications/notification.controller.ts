import type { Response } from "express";
import Notification from "../../models/notification.model.js";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import { asyncHandler } from "../../middleware/error.middleware.js";

export const getMyNotifications = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const limit = Math.min(
      parseInt((req.query.limit as string) || "30", 10),
      100,
    );

    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ user: req.user!._id })
        .sort({ createdAt: -1 })
        .limit(limit),
      Notification.countDocuments({ user: req.user!._id, isRead: false }),
    ]);

    res.json({
      success: true,
      data: { notifications, unreadCount },
    });
  },
);

export const markNotificationRead = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user!._id },
      { isRead: true, readAt: new Date() },
    );
    res.json({ success: true, message: "Notification marked as read" });
  },
);

export const markAllNotificationsRead = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    await Notification.updateMany(
      { user: req.user!._id, isRead: false },
      { isRead: true, readAt: new Date() },
    );
    res.json({ success: true, message: "All notifications marked as read" });
  },
);
