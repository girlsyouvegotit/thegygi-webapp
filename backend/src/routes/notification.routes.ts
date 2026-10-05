import express from "express";
import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../controllers/notifications/notification.controller.js";
import {
  getPushVapidKey,
  subscribePush,
  unsubscribePush,
  getMyNotificationPrefs,
  updateMyNotificationPrefs,
} from "../controllers/notifications/push.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { validateBody } from "../utils/validation.util.js";
import { z } from "zod";

const router = express.Router();

router.use(protect);

router.get("/push/vapid-key", getPushVapidKey);
router.post(
  "/push/subscribe",
  validateBody(
    z.object({
      endpoint: z.string().url(),
      keys: z.object({
        p256dh: z.string().min(1),
        auth: z.string().min(1),
      }),
    }),
  ),
  subscribePush,
);
router.delete(
  "/push/subscribe",
  validateBody(z.object({ endpoint: z.string().min(1) })),
  unsubscribePush,
);

router.get("/prefs", getMyNotificationPrefs);
router.put(
  "/prefs",
  validateBody(
    z.object({
      email: z.boolean().optional(),
      inApp: z.boolean().optional(),
      push: z.boolean().optional(),
    }),
  ),
  updateMyNotificationPrefs,
);

router.get("/", getMyNotifications);
router.put("/read-all", markAllNotificationsRead);
router.put("/:id/read", markNotificationRead);

export default router;
