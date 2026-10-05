import type { Response } from "express";
import { asyncHandler } from "../../middleware/error.middleware.js";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import * as contentService from "../../services/content.service.js";

export const listPublicPosts = asyncHandler(async (req, res: Response) => {
  const data = await contentService.listPublicPosts({
    q: typeof req.query.q === "string" ? req.query.q : undefined,
    category:
      typeof req.query.category === "string" ? req.query.category : undefined,
    tag: typeof req.query.tag === "string" ? req.query.tag : undefined,
    page: req.query.page ? Number(req.query.page) : 1,
    limit: req.query.limit ? Number(req.query.limit) : 9,
    sort: req.query.sort === "popular" ? "popular" : "newest",
  });
  res.json({ success: true, data });
});

export const getPublicPost = asyncHandler(async (req, res: Response) => {
  const data = await contentService.getPublicPostBySlug(req.params.slug);
  res.json({ success: true, data });
});

export const getPublicAbout = asyncHandler(async (_req, res: Response) => {
  const about = await contentService.getPublishedAbout();
  res.json({ success: true, data: { about } });
});

export const listPublicWriters = asyncHandler(async (req, res: Response) => {
  const writers = await contentService.listPublicWriters(
    req.query.limit ? Number(req.query.limit) : 8,
  );
  res.json({ success: true, data: { writers } });
});

export const writerDashboard = asyncHandler(
  async (_req: AuthRequest, res: Response) => {
    const stats = await contentService.getWriterDashboardStats();
    res.json({ success: true, data: stats });
  },
);

export const writerListPosts = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const data = await contentService.listWriterPosts({
      q: typeof req.query.q === "string" ? req.query.q : undefined,
      status:
        typeof req.query.status === "string" ? req.query.status : undefined,
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 20,
    });
    res.json({ success: true, data });
  },
);

export const writerGetPost = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const post = await contentService.getPostForWriter(req.params.id);
    res.json({ success: true, data: { post } });
  },
);

export const writerCreatePost = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const post = await contentService.createPost(req.userId!, {
      title: req.body.title,
      slug: req.body.slug,
      excerpt: req.body.excerpt,
      content: req.body.content,
      coverImage: req.body.coverImage,
      category: req.body.category,
      tags: req.body.tags,
      status: req.body.status,
      seoTitle: req.body.seoTitle,
      seoDescription: req.body.seoDescription,
    });
    res.status(201).json({ success: true, data: { post } });
  },
);

export const writerUpdatePost = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const post = await contentService.updatePost(req.params.id, req.body);
    res.json({ success: true, data: { post } });
  },
);

export const writerDeletePost = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    await contentService.deletePost(req.params.id);
    res.json({ success: true, data: { deleted: true } });
  },
);

export const writerGetAbout = asyncHandler(
  async (_req: AuthRequest, res: Response) => {
    const about = await contentService.getAboutForWriter();
    res.json({ success: true, data: { about } });
  },
);

export const writerUpdateAbout = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const about = await contentService.updateAboutDraft(req.userId!, {
      sections: req.body.sections,
      seoTitle: req.body.seoTitle,
      seoDescription: req.body.seoDescription,
      publish: Boolean(req.body.publish),
    });
    res.json({ success: true, data: { about } });
  },
);

export const writerPublishAbout = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const about = await contentService.publishAbout(req.userId!);
    res.json({ success: true, data: { about } });
  },
);
