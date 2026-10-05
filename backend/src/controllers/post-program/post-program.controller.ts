import type { Response } from "express";
import { asyncHandler } from "../../middleware/error.middleware.js";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import {
  ensureAllAlumniChannels,
  getAdminAlumniMonitor,
  getAlumniStatus,
  listAllPortfolioReviews,
  listJobsForAdmin,
  listJobsForStudent,
  listMyPortfolioReviews,
  listPendingPortfolioReviews,
  reviewPortfolio,
  submitPortfolioReview,
} from "../../services/post-program.service.js";

/**
 * @route GET /api/post-program/status
 */
export const getStatus = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const data = await getAlumniStatus(String(req.user!._id));
    res.json({ success: true, data });
  },
);

/**
 * @route GET /api/post-program/jobs
 */
export const getJobs = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const search =
      typeof req.query.search === "string" ? req.query.search : undefined;
    const categoryId =
      typeof req.query.categoryId === "string"
        ? req.query.categoryId
        : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const data = await listJobsForStudent(String(req.user!._id), {
      search,
      categoryId,
      limit: Number.isFinite(limit) ? limit : undefined,
    });
    res.setHeader("Cache-Control", "private, max-age=300");
    res.json({ success: true, data });
  },
);

/**
 * @route GET /api/post-program/portfolio
 */
export const getMyPortfolio = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const reviews = await listMyPortfolioReviews(String(req.user!._id));
    res.json({ success: true, data: { reviews } });
  },
);

/**
 * @route POST /api/post-program/portfolio
 */
export const postPortfolio = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { title, url, notes, categoryId } = req.body as {
      title: string;
      url: string;
      notes?: string;
      categoryId?: string;
    };
    const review = await submitPortfolioReview(String(req.user!._id), {
      title,
      url,
      notes,
      categoryId,
    });
    res.status(201).json({
      success: true,
      message: "Portfolio submitted for review",
      data: { review },
    });
  },
);

/**
 * Mentor/Admin: list pending portfolios
 * @route GET /api/post-program/portfolio/queue
 */
export const getPortfolioQueue = asyncHandler(
  async (_req: AuthRequest, res: Response): Promise<void> => {
    const reviews = await listPendingPortfolioReviews();
    res.json({ success: true, data: { reviews } });
  },
);

/**
 * Admin/SA: alumni + portfolio + channel monitor
 * @route GET /api/post-program/admin/monitor
 */
export const getAdminMonitor = asyncHandler(
  async (_req: AuthRequest, res: Response): Promise<void> => {
    const data = await getAdminAlumniMonitor();
    res.json({ success: true, data });
  },
);

/**
 * Admin/SA: browse job feed students receive
 * @route GET /api/post-program/admin/jobs
 */
export const getAdminJobs = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const search =
      typeof req.query.search === "string" ? req.query.search : undefined;
    const categoryId =
      typeof req.query.categoryId === "string"
        ? req.query.categoryId
        : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const data = await listJobsForAdmin({
      search,
      categoryId,
      limit: Number.isFinite(limit) ? limit : undefined,
    });
    res.setHeader("Cache-Control", "private, max-age=300");
    res.json({ success: true, data });
  },
);

/**
 * Admin/SA: all portfolio submissions
 * @route GET /api/post-program/admin/portfolio
 */
export const getAdminPortfolio = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const status =
      typeof req.query.status === "string" ? req.query.status : undefined;
    const reviews = await listAllPortfolioReviews({ status });
    res.json({ success: true, data: { reviews } });
  },
);

/**
 * Admin/SA: ensure alumni channels exist across communities
 * @route POST /api/post-program/admin/ensure-channels
 */
export const postEnsureAlumniChannels = asyncHandler(
  async (_req: AuthRequest, res: Response): Promise<void> => {
    const data = await ensureAllAlumniChannels();
    res.json({
      success: true,
      message: "Alumni channels synced",
      data,
    });
  },
);

/**
 * Mentor/Admin: submit feedback
 * @route POST /api/post-program/portfolio/:id/review
 */
export const postPortfolioReview = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { status, feedback } = req.body as {
      status: "reviewed" | "needs_changes";
      feedback: string;
    };
    const review = await reviewPortfolio(
      String(req.params.id),
      String(req.user!._id),
      { status, feedback },
    );
    res.json({
      success: true,
      message: "Feedback sent to student",
      data: { review },
    });
  },
);
