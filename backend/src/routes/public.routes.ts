import express from "express";
import { z } from "zod";
import { getPublicCommunityPulse } from "../controllers/public/community-pulse.controller.js";
import { createPublicInquiry } from "../controllers/public/inquiry.controller.js";
import { askPublicChatbot } from "../controllers/public/chatbot.controller.js";
import {
  createTestimonialComment,
  getTestimonialEngagement,
  listTestimonialComments,
  listTestimonials,
  toggleTestimonialLike,
} from "../controllers/public/testimonial-comment.controller.js";
import { rateLimit } from "../middleware/rate-limit.middleware.js";
import { validateBody } from "../utils/validation.util.js";
import { GET_INVOLVED_INTERESTS } from "../models/inquiry.model.js";

const router = express.Router();

const inquiryRateLimit = rateLimit(15 * 60 * 1000, 8, true);
const chatbotRateLimit = rateLimit(15 * 60 * 1000, 40, true);
const testimonialCommentRateLimit = rateLimit(15 * 60 * 1000, 20, true);
const testimonialLikeRateLimit = rateLimit(15 * 60 * 1000, 60, true);

const inquirySchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  email: z.string().trim().email("Invalid email").max(200),
  interest: z.enum(GET_INVOLVED_INTERESTS),
});

const testimonialCommentSchema = z.object({
  authorName: z.string().trim().min(2, "Name is required").max(80),
  body: z.string().trim().min(4, "Comment is too short").max(800),
});

const likeSchema = z.object({
  clientKey: z.string().trim().min(8).max(80),
});

const chatbotSchema = z.object({
  message: z.string().trim().min(1, "Message is required").max(1000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(1000),
      }),
    )
    .max(12)
    .optional(),
});

router.get("/community-pulse", getPublicCommunityPulse);
router.post(
  "/inquiries",
  inquiryRateLimit,
  validateBody(inquirySchema),
  createPublicInquiry,
);
router.post(
  "/chatbot",
  chatbotRateLimit,
  validateBody(chatbotSchema),
  askPublicChatbot,
);

router.get("/testimonials", listTestimonials);
router.get("/testimonials/engagement", getTestimonialEngagement);
router.post(
  "/testimonials/:id/like",
  testimonialLikeRateLimit,
  validateBody(likeSchema),
  toggleTestimonialLike,
);
router.get("/testimonials/:id/comments", listTestimonialComments);
router.post(
  "/testimonials/:id/comments",
  testimonialCommentRateLimit,
  validateBody(testimonialCommentSchema),
  createTestimonialComment,
);

export default router;
