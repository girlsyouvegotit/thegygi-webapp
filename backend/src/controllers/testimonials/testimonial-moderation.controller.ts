import type { Response } from "express";
import { asyncHandler } from "../../middleware/error.middleware.js";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import {
  deleteComment,
  deleteTestimonial,
  getStudentTestimonial,
  listAdminComments,
  listAdminTestimonials,
  replyToComment,
  resolveStudentProgramRole,
  setCommentHidden,
  setTestimonialStatus,
  upsertStudentTestimonial,
} from "../../services/testimonial.service.js";

/**
 * Student: get own testimonial
 * @route GET /api/testimonials/mine
 */
export const getMine = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const studentId = String(req.user!._id);
    const [item, programRole] = await Promise.all([
      getStudentTestimonial(studentId),
      resolveStudentProgramRole(studentId),
    ]);
    res.json({
      success: true,
      data: { testimonial: item, programRole },
    });
  },
);

/**
 * Student: create or update own testimonial (goes live on home)
 * @route POST /api/testimonials/mine
 */
export const upsertMine = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { body, country, flag, rating } = req.body as {
      body: string;
      country: string;
      flag?: string;
      rating?: number;
    };

    const testimonial = await upsertStudentTestimonial({
      studentId: String(req.user!._id),
      name: req.user!.name,
      body,
      country,
      flag,
      rating,
    });

    res.status(201).json({
      success: true,
      message: "Your testimonial is live on the home page",
      data: { testimonial },
    });
  },
);

/**
 * Admin: list stories
 * @route GET /api/testimonials
 */
export const adminListStories = asyncHandler(
  async (_req: AuthRequest, res: Response): Promise<void> => {
    const testimonials = await listAdminTestimonials();
    res.json({ success: true, data: { testimonials } });
  },
);

/**
 * Admin: set story status
 * @route PATCH /api/testimonials/:id/status
 */
export const adminSetStoryStatus = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const status = req.body?.status as "pending" | "approved" | "rejected";
    const testimonial = await setTestimonialStatus(
      String(req.params.id),
      status,
    );
    res.json({
      success: true,
      message: `Testimonial marked ${status}`,
      data: { testimonial },
    });
  },
);

/**
 * Admin: delete story
 * @route DELETE /api/testimonials/:id
 */
export const adminDeleteStory = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const data = await deleteTestimonial(String(req.params.id));
    res.json({ success: true, message: "Testimonial deleted", data });
  },
);

/**
 * Admin: list comments
 * @route GET /api/testimonials/comments
 */
export const adminListComments = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const rawId = req.query.testimonialId;
    const testimonialId =
      typeof rawId === "string" && rawId ? rawId : undefined;
    const comments = await listAdminComments({ testimonialId });
    res.json({ success: true, data: { comments } });
  },
);

export const adminSetVisibility = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const isHidden = Boolean(req.body?.isHidden);
    const comment = await setCommentHidden(String(req.params.id), isHidden);
    res.json({
      success: true,
      message: isHidden ? "Comment hidden" : "Comment visible again",
      data: { comment },
    });
  },
);

export const adminDeleteComment = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const data = await deleteComment(String(req.params.id));
    res.json({ success: true, message: "Comment deleted", data });
  },
);

export const adminReplyComment = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { body } = req.body as { body: string };
    const authorName = req.user?.name || "GYGI Admin";
    const comment = await replyToComment(String(req.params.id), {
      body,
      authorName,
      repliedBy: String(req.user!._id),
    });
    res.json({
      success: true,
      message: "Reply posted",
      data: { comment },
    });
  },
);
