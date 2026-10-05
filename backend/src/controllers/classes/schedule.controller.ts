import type { Request, Response } from "express";
import LiveClass from "../../models/live-class.model.js";
import { logActivity } from "../../services/activity.service.js";
import { notifyClassScheduled } from "../../services/notification.service.js";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import {
  asyncHandler,
  notFound,
  forbidden,
  badRequest,
} from "../../middleware/error.middleware.js";
import Category from "../../models/category.model.js";

/**
 * Schedule a class (confirm scheduled status)
 * @route POST /api/classes/:id/schedule
 */
export const scheduleClass = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const liveClass = await LiveClass.findById(req.params.id);

    if (!liveClass) {
      throw notFound("Class not found");
    }

    if (
      req.user!.role !== "admin" &&
      liveClass.tutor.toString() !== req.user!._id.toString()
    ) {
      throw forbidden("Not authorized");
    }

    liveClass.status = "scheduled";
    await liveClass.save();

    await logActivity({
      userId: req.user!._id.toString(),
      action: "Scheduled class",
      details: `Scheduled class: ${liveClass.title}`,
      resourceType: "class",
      resourceId: liveClass._id.toString(),
    });

    res.json({
      success: true,
      message: "Class scheduled",
      data: { class: liveClass },
    });
  },
);

/**
 * Reschedule a class
 * @route PUT /api/classes/:id/reschedule
 */
export const rescheduleClass = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { scheduledDate, duration } = req.body;
    const liveClass = await LiveClass.findById(req.params.id);

    if (!liveClass) {
      throw notFound("Class not found");
    }

    if (
      req.user!.role !== "admin" &&
      liveClass.tutor.toString() !== req.user!._id.toString()
    ) {
      throw forbidden("Not authorized");
    }

    if (liveClass.status === "live" || liveClass.status === "ended") {
      throw badRequest("Cannot reschedule a class that has started or ended");
    }

    liveClass.scheduledDate = scheduledDate || liveClass.scheduledDate;
    liveClass.duration = duration || liveClass.duration;
    await liveClass.save();

    await logActivity({
      userId: req.user!._id.toString(),
      action: "Rescheduled class",
      details: `Rescheduled class: ${liveClass.title}`,
      resourceType: "class",
      resourceId: liveClass._id.toString(),
    });

    res.json({
      success: true,
      message: "Class rescheduled",
      data: { class: liveClass },
    });
  },
);

/**
 * Cancel a class
 * @route PUT /api/classes/:id/cancel
 */
export const cancelClass = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const liveClass = await LiveClass.findById(req.params.id);

    if (!liveClass) {
      throw notFound("Class not found");
    }

    if (
      req.user!.role !== "admin" &&
      liveClass.tutor.toString() !== req.user!._id.toString()
    ) {
      throw forbidden("Not authorized");
    }

    if (liveClass.status === "live" || liveClass.status === "ended") {
      throw badRequest("Cannot cancel a class that has started or ended");
    }

    liveClass.status = "cancelled";
    await liveClass.save();

    await logActivity({
      userId: req.user!._id.toString(),
      action: "Cancelled class",
      details: `Cancelled class: ${liveClass.title}`,
      resourceType: "class",
      resourceId: liveClass._id.toString(),
    });

    res.json({
      success: true,
      message: "Class cancelled",
      data: { class: liveClass },
    });
  },
);
