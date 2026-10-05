import type { Response } from "express";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import { asyncHandler, badRequest } from "../../middleware/error.middleware.js";
import { logActivity } from "../../services/activity.service.js";
import {
  approveCategoryChangeRequest,
  cancelMyCategoryChangeRequest,
  listCategoryChangeRequests,
  listMyCategoryChangeRequests,
  rejectCategoryChangeRequest,
  requestCategoryChange,
  CATEGORY_CHANGE_LOCK_DAYS,
} from "../../services/category-change.service.js";

/**
 * Student requests a category change (needs admin approval)
 * @route POST /api/enrollments/category-change-requests
 */
export const createCategoryChangeRequest = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (req.user!.role !== "student") {
      throw badRequest("Only students can request a category change");
    }

    const toCategoryId = String(req.body.toCategoryId || req.body.categoryId || "");
    const reason = String(req.body.reason || "");

    const request = await requestCategoryChange(
      req.user!._id.toString(),
      toCategoryId,
      reason,
    );

    await logActivity({
      userId: req.user!._id.toString(),
      action: "Requested category change",
      details: `Requested switch to ${toCategoryId}`,
      resourceType: "enrollment",
      resourceId: String(request?._id || ""),
    });

    res.status(201).json({
      success: true,
      message:
        "Request submitted. An admin must approve it before the change takes effect.",
      data: {
        request,
        lockDaysAfterApproval: CATEGORY_CHANGE_LOCK_DAYS,
      },
    });
  },
);

/**
 * @route GET /api/enrollments/category-change-requests/me
 */
export const getMyCategoryChangeRequests = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const requests = await listMyCategoryChangeRequests(
      req.user!._id.toString(),
    );
    res.json({
      success: true,
      data: {
        requests,
        categoryChangeLockedUntil:
          (req.user as { categoryChangeLockedUntil?: Date | null })
            ?.categoryChangeLockedUntil || null,
        lockDaysAfterApproval: CATEGORY_CHANGE_LOCK_DAYS,
      },
    });
  },
);

/**
 * @route GET /api/enrollments/category-change-requests
 */
export const getCategoryChangeRequestsAdmin = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const status =
      typeof req.query.status === "string" ? req.query.status : "pending";
    const requests = await listCategoryChangeRequests(status);
    res.json({ success: true, data: { requests } });
  },
);

/**
 * @route POST /api/enrollments/category-change-requests/:id/approve
 */
export const approveCategoryChange = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const result = await approveCategoryChangeRequest(
      String(req.params.id),
      req.user!._id.toString(),
      typeof req.body.reviewNote === "string" ? req.body.reviewNote : undefined,
    );

    await logActivity({
      userId: req.user!._id.toString(),
      action: "Approved category change",
      details: `Approved request ${req.params.id}`,
      resourceType: "enrollment",
      resourceId: String(req.params.id),
    });

    res.json({
      success: true,
      message: "Category change approved and applied",
      data: result,
    });
  },
);

/**
 * @route POST /api/enrollments/category-change-requests/:id/reject
 */
export const rejectCategoryChange = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const request = await rejectCategoryChangeRequest(
      String(req.params.id),
      req.user!._id.toString(),
      typeof req.body.reviewNote === "string" ? req.body.reviewNote : undefined,
    );

    await logActivity({
      userId: req.user!._id.toString(),
      action: "Rejected category change",
      details: `Rejected request ${req.params.id}`,
      resourceType: "enrollment",
      resourceId: String(req.params.id),
    });

    res.json({
      success: true,
      message: "Category change request rejected",
      data: { request },
    });
  },
);

/**
 * @route DELETE /api/enrollments/category-change-requests/:id
 */
export const cancelCategoryChange = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (req.user!.role !== "student") {
      throw badRequest("Only the student can cancel their request");
    }
    const request = await cancelMyCategoryChangeRequest(
      req.user!._id.toString(),
      String(req.params.id),
    );
    res.json({
      success: true,
      message: "Request cancelled",
      data: { request },
    });
  },
);
