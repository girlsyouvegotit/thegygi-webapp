import express from "express";
import { z } from "zod";
import { protect } from "../middleware/auth.middleware.js";
import { writerOnly } from "../middleware/role.middleware.js";
import { validateBody } from "../utils/validation.util.js";
import {
  listPublicPosts,
  getPublicPost,
  getPublicAbout,
  listPublicWriters,
  writerDashboard,
  writerListPosts,
  writerGetPost,
  writerCreatePost,
  writerUpdatePost,
  writerDeletePost,
  writerGetAbout,
  writerUpdateAbout,
  writerPublishAbout,
} from "../controllers/content/content.controller.js";

const router = express.Router();

const postBodySchema = z.object({
  title: z.string().min(3).max(200),
  slug: z.string().min(2).max(120).optional(),
  excerpt: z.string().min(10).max(500),
  content: z.string().min(20),
  coverImage: z.string().max(500).optional().nullable().or(z.literal("")),
  category: z.string().min(1).max(80).optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  seoTitle: z.string().max(120).optional().nullable(),
  seoDescription: z.string().max(200).optional().nullable(),
});

const postUpdateSchema = postBodySchema.partial().extend({
  title: z.string().min(3).max(200).optional(),
  excerpt: z.string().min(10).max(500).optional(),
  content: z.string().min(20).optional(),
});

const aboutUpdateSchema = z.object({
  sections: z.unknown().optional(),
  seoTitle: z.string().max(120).optional().nullable(),
  seoDescription: z.string().max(220).optional().nullable(),
  publish: z.boolean().optional(),
});

// Public
router.get("/blog", listPublicPosts);
router.get("/writers", listPublicWriters);
router.get("/blog/:slug", getPublicPost);
router.get("/about", getPublicAbout);

// Writer CMS
router.use("/writer", protect, writerOnly);
router.get("/writer/dashboard", writerDashboard);
router.get("/writer/posts", writerListPosts);
router.get("/writer/posts/:id", writerGetPost);
router.post("/writer/posts", validateBody(postBodySchema), writerCreatePost);
router.patch(
  "/writer/posts/:id",
  validateBody(postUpdateSchema),
  writerUpdatePost,
);
router.delete("/writer/posts/:id", writerDeletePost);
router.get("/writer/about", writerGetAbout);
router.put("/writer/about", validateBody(aboutUpdateSchema), writerUpdateAbout);
router.post("/writer/about/publish", writerPublishAbout);

export default router;
