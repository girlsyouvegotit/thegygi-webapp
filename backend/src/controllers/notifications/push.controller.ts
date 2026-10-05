import type { Response } from "express";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import { asyncHandler, badRequest } from "../../middleware/error.middleware.js";
import {
  getVapidPublicKey,
  removePushSubscription,
  savePushSubscription,
  updateNotificationPrefs,
} from "../../services/notification.service.js";
import User from "../../models/user.model.js";

/** GET /api/notifications/push/vapid-key */
export const getPushVapidKey = asyncHandler(
  async (_req: AuthRequest, res: Response): Promise<void> => {
    const key = getVapidPublicKey();
    res.json({
      success: true,
      data: { publicKey: key, configured: Boolean(key) },
    });
  },
);

/** POST /api/notifications/push/subscribe */
export const subscribePush = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { endpoint, keys } = req.body as {
      endpoint?: string;
      keys?: { p256dh?: string; auth?: string };
    };
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      throw badRequest("Invalid push subscription");
    }
    await savePushSubscription(
      String(req.user!._id),
      { endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } },
      req.headers["user-agent"],
    );
    res.json({ success: true, message: "Push subscription saved" });
  },
);

/** DELETE /api/notifications/push/subscribe */
export const unsubscribePush = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { endpoint } = req.body as { endpoint?: string };
    if (!endpoint) throw badRequest("endpoint required");
    await removePushSubscription(String(req.user!._id), endpoint);
    res.json({ success: true, message: "Push subscription removed" });
  },
);

/** GET /api/notifications/prefs */
export const getMyNotificationPrefs = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const user = await User.findById(req.user!._id).select("notificationPrefs");
    res.json({
      success: true,
      data: {
        prefs: user?.notificationPrefs || {
          email: true,
          inApp: true,
          push: true,
        },
      },
    });
  },
);

/** PUT /api/notifications/prefs */
export const updateMyNotificationPrefs = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const prefs = await updateNotificationPrefs(String(req.user!._id), req.body);
    res.json({ success: true, data: { prefs } });
  },
);
