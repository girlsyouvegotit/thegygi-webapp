import type { Request, Response } from "express";
import { asyncHandler } from "../../middleware/error.middleware.js";
import {
  createPublicComment,
  getEngagement,
  listPublicComments,
  listPublicTestimonials,
  toggleLike,
} from "../../services/testimonial.service.js";

/**
 * @route GET /api/public/testimonials
 */
export const listTestimonials = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    const testimonials = await listPublicTestimonials();
    res.setHeader("Cache-Control", "no-store");
    res.json({ success: true, data: { testimonials } });
  },
);

/**
 * @route GET /api/public/testimonials/engagement
 */
export const getTestimonialEngagement = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const clientKey =
      typeof req.query.clientKey === "string" ? req.query.clientKey : undefined;
    const data = await getEngagement(clientKey);
    res.setHeader("Cache-Control", "no-store");
    res.json({ success: true, data });
  },
);

/**
 * @route POST /api/public/testimonials/:id/like
 */
export const toggleTestimonialLike = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const data = await toggleLike(
      String(req.params.id),
      String(req.body?.clientKey || ""),
    );
    res.json({ success: true, data });
  },
);

/**
 * @route GET /api/public/testimonials/:id/comments
 */
export const listTestimonialComments = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const testimonialId = String(req.params.id);
    const comments = await listPublicComments(testimonialId);
    res.setHeader("Cache-Control", "no-store");
    res.json({
      success: true,
      data: { testimonialId, comments },
    });
  },
);

/**
 * @route POST /api/public/testimonials/:id/comments
 */
export const createTestimonialComment = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { authorName, body } = req.body as {
      authorName: string;
      body: string;
    };
    const comment = await createPublicComment(
      String(req.params.id),
      authorName,
      body,
    );
    res.status(201).json({
      success: true,
      message: "Comment posted",
      data: { comment },
    });
  },
);
