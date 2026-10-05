import express from "express";
import { z } from "zod";
import { protect } from "../middleware/auth.middleware.js";
import { adminOnly, authorize } from "../middleware/role.middleware.js";
import { validateBody } from "../utils/validation.util.js";
import {
  adminDeleteComment,
  adminDeleteStory,
  adminListComments,
  adminListStories,
  adminReplyComment,
  adminSetStoryStatus,
  adminSetVisibility,
  getMine,
  upsertMine,
} from "../controllers/testimonials/testimonial-moderation.controller.js";

const router = express.Router();

const studentTestimonialSchema = z.object({
  body: z.string().trim().min(20, "Please write a bit more").max(1000),
  country: z.string().trim().min(2).max(80),
  flag: z.string().trim().max(8).optional(),
  rating: z.number().int().min(1).max(5).optional(),
});

// Student routes
router.get("/mine", protect, authorize("student"), getMine);
router.post(
  "/mine",
  protect,
  authorize("student"),
  validateBody(studentTestimonialSchema),
  upsertMine,
);

// Admin comment moderation (before /:id)
router.get("/comments", protect, adminOnly, adminListComments);
router.patch(
  "/comments/:id/visibility",
  protect,
  adminOnly,
  validateBody(z.object({ isHidden: z.boolean() })),
  adminSetVisibility,
);
router.delete("/comments/:id", protect, adminOnly, adminDeleteComment);
router.post(
  "/comments/:id/reply",
  protect,
  adminOnly,
  validateBody(
    z.object({
      body: z.string().trim().min(2).max(1000),
    }),
  ),
  adminReplyComment,
);

// Admin story moderation
router.get("/", protect, adminOnly, adminListStories);
router.patch(
  "/:id/status",
  protect,
  adminOnly,
  validateBody(
    z.object({
      status: z.enum(["pending", "approved", "rejected"]),
    }),
  ),
  adminSetStoryStatus,
);
router.delete("/:id", protect, adminOnly, adminDeleteStory);

export default router;
