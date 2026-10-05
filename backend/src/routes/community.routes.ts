import express from "express";
import {
  getCommunity,
  getCommunityMembers,
} from "../controllers/community/community.controller.js";
import {
  getMessages,
  sendMessage,
  deleteMessage,
  pinMessage,
  starMessage,
  reactMessage,
  reportMessageHandler,
  replyPrivateHandler,
  forwardMessageHandler,
  openDmHandler,
  getQuickReplies,
  markRead,
} from "../controllers/community/message.controller.js";
import {
  createAnnouncement,
  getAnnouncements,
} from "../controllers/community/announcement.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { validateBody } from "../utils/validation.util.js";
import { z } from "zod";

const router = express.Router();

const messageSchema = z
  .object({
    content: z.string().max(5000).optional().default(""),
    attachments: z.array(z.string()).optional(),
    replyTo: z.string().optional(),
  })
  .refine(
    (v) => Boolean((v.content || "").trim()) || (v.attachments?.length ?? 0) > 0,
    { message: "Message content or attachment is required" },
  );
const announcementSchema = z.object({
  content: z.string().min(1, "Announcement content is required").max(5000),
});

router.use(protect);

router.get("/quick-replies", getQuickReplies);
router.get("/category/:categoryId", getCommunity);
router.get("/:communityId/members", getCommunityMembers);

router.get("/:communityId/channels/:channelId/messages", getMessages);
router.put("/:communityId/channels/:channelId/read", markRead);
router.post(
  "/:communityId/channels/:channelId/messages",
  validateBody(messageSchema),
  sendMessage,
);

router.post(
  "/:communityId/dms",
  validateBody(z.object({ userId: z.string().min(1) })),
  openDmHandler,
);

router.delete("/messages/:messageId", deleteMessage);
router.put("/messages/:messageId/pin", pinMessage);
router.put("/messages/:messageId/star", starMessage);
router.post(
  "/messages/:messageId/react",
  validateBody(z.object({ emoji: z.string().min(1).max(16) })),
  reactMessage,
);
router.post(
  "/messages/:messageId/report",
  validateBody(
    z.object({ reason: z.string().min(3).max(500) }),
  ),
  reportMessageHandler,
);
router.post(
  "/messages/:messageId/reply-private",
  validateBody(
    z.object({ content: z.string().max(5000).optional() }),
  ),
  replyPrivateHandler,
);
router.post(
  "/messages/:messageId/forward",
  validateBody(z.object({ toUserId: z.string().min(1) })),
  forwardMessageHandler,
);

router.post(
  "/:communityId/announcements",
  validateBody(announcementSchema),
  createAnnouncement,
);
router.get("/:communityId/announcements", getAnnouncements);

export default router;
