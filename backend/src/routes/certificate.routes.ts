import express from "express";
import { z } from "zod";
import {
  listMyCertificates,
  getCertificate,
  revokeCertificateHandler,
  listMyEnrollments,
} from "../controllers/certificate.controller.js";
import {
  approveCategoryChange,
  cancelCategoryChange,
  createCategoryChangeRequest,
  getCategoryChangeRequestsAdmin,
  getMyCategoryChangeRequests,
  rejectCategoryChange,
} from "../controllers/category/category-change.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { adminOnly, anyAuthenticated } from "../middleware/role.middleware.js";
import { validateBody } from "../utils/validation.util.js";

const router = express.Router();

router.get("/me", protect, anyAuthenticated, listMyCertificates);
router.get("/:id", protect, anyAuthenticated, getCertificate);
router.post("/:id/revoke", protect, adminOnly, revokeCertificateHandler);

export default router;

const categoryChangeRequestSchema = z.object({
  toCategoryId: z.string().min(1).optional(),
  categoryId: z.string().min(1).optional(),
  reason: z.string().min(30).max(1000),
}).refine((body) => Boolean(body.toCategoryId || body.categoryId), {
  message: "Category is required",
  path: ["toCategoryId"],
});

const reviewNoteSchema = z.object({
  reviewNote: z.string().max(500).optional(),
});

export const enrollmentRouter = express.Router();
enrollmentRouter.get("/me", protect, anyAuthenticated, listMyEnrollments);

enrollmentRouter.post(
  "/category-change-requests",
  protect,
  anyAuthenticated,
  validateBody(categoryChangeRequestSchema),
  createCategoryChangeRequest,
);
enrollmentRouter.get(
  "/category-change-requests/me",
  protect,
  anyAuthenticated,
  getMyCategoryChangeRequests,
);
enrollmentRouter.get(
  "/category-change-requests",
  protect,
  adminOnly,
  getCategoryChangeRequestsAdmin,
);
enrollmentRouter.post(
  "/category-change-requests/:id/approve",
  protect,
  adminOnly,
  validateBody(reviewNoteSchema),
  approveCategoryChange,
);
enrollmentRouter.post(
  "/category-change-requests/:id/reject",
  protect,
  adminOnly,
  validateBody(reviewNoteSchema),
  rejectCategoryChange,
);
enrollmentRouter.delete(
  "/category-change-requests/:id",
  protect,
  anyAuthenticated,
  cancelCategoryChange,
);
