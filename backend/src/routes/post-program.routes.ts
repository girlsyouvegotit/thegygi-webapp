import express from "express";
import { z } from "zod";
import { protect } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";
import { validateBody } from "../utils/validation.util.js";
import {
  getAdminJobs,
  getAdminMonitor,
  getAdminPortfolio,
  getJobs,
  getMyPortfolio,
  getPortfolioQueue,
  getStatus,
  postEnsureAlumniChannels,
  postPortfolio,
  postPortfolioReview,
} from "../controllers/post-program/post-program.controller.js";

const router = express.Router();

router.get("/status", protect, authorize("student"), getStatus);
router.get("/jobs", protect, authorize("student"), getJobs);
router.get("/portfolio", protect, authorize("student"), getMyPortfolio);
router.post(
  "/portfolio",
  protect,
  authorize("student"),
  validateBody(
    z.object({
      title: z.string().trim().min(2).max(160),
      url: z.string().trim().url().max(500),
      notes: z.string().trim().max(2000).optional(),
      categoryId: z.string().optional(),
    }),
  ),
  postPortfolio,
);

router.get(
  "/portfolio/queue",
  protect,
  authorize("mentor", "admin"),
  getPortfolioQueue,
);
router.post(
  "/portfolio/:id/review",
  protect,
  authorize("mentor", "admin"),
  validateBody(
    z.object({
      status: z.enum(["reviewed", "needs_changes"]),
      feedback: z.string().trim().min(2).max(4000),
    }),
  ),
  postPortfolioReview,
);

// Admin / Super Admin monitoring
router.get("/admin/monitor", protect, authorize("admin"), getAdminMonitor);
router.get("/admin/jobs", protect, authorize("admin"), getAdminJobs);
router.get("/admin/portfolio", protect, authorize("admin"), getAdminPortfolio);
router.post(
  "/admin/ensure-channels",
  protect,
  authorize("admin"),
  postEnsureAlumniChannels,
);

export default router;
