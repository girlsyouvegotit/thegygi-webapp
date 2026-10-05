import type { Response } from "express";
import ActivityLog from "../../models/activity-log.model.js";
import User from "../../models/user.model.js";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import { asyncHandler, notFound } from "../../middleware/error.middleware.js";
import {
  getPaginationParams,
  getPaginationResponse,
} from "../../utils/pagination.util.js";

/**
 * Get activities (role-based)
 * @route GET /api/activities
 */
export const getActivities = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { page, limit, skip } = getPaginationParams(req);
    const { search, date } = req.query;

    const filter: Record<string, unknown> = {
      // Never surface silent View as / act-as noise on any activity dashboard
      "metadata.mode": { $ne: "act_as" },
      "metadata.impersonatorId": { $exists: false },
    };
    const role = req.user!.role;

    if (role === "admin") {
      // Hide all Super activity from regular admins
      const superIds = await User.find({ role: "super_admin" }).distinct("_id");
      filter.user = { $nin: superIds };
    } else if (role === "tutor" || role === "mentor" || role === "student") {
      filter.user = req.user!._id;
    }
    // super_admin sees everything else (still excluding silent View as)

    if (search) {
      filter.action = { $regex: search, $options: "i" };
    }

    if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const dayStart = new Date(`${date}T00:00:00.000`);
      const dayEnd = new Date(`${date}T23:59:59.999`);
      if (!Number.isNaN(dayStart.getTime())) {
        filter.createdAt = { $gte: dayStart, $lte: dayEnd };
      }
    }

    const [logs, total] = await Promise.all([
      ActivityLog.find(filter)
        .populate("user", "name email role avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ActivityLog.countDocuments(filter),
    ]);

    // Extra safety: drop any populated super_admin rows if any slip through
    const safeLogs =
      role === "admin"
        ? logs.filter((l) => {
            const u = l.user as { role?: string } | null;
            return u?.role !== "super_admin";
          })
        : logs;

    res.json({
      success: true,
      data: { logs: safeLogs },
      pagination: getPaginationResponse(total, page, limit),
    });
  },
);

/**
 * Get activity by ID (admin only)
 * @route GET /api/activities/:id
 */
export const getActivityById = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const log = await ActivityLog.findById(req.params.id).populate(
      "user",
      "name email role",
    );

    if (!log) {
      throw notFound("Activity not found");
    }

    const actor = log.user as { role?: string } | null;
    if (req.user!.role === "admin" && actor?.role === "super_admin") {
      throw notFound("Activity not found");
    }

    res.json({
      success: true,
      data: { log },
    });
  },
);

/**
 * Get user activities (admin only)
 * @route GET /api/activities/user/:userId
 */
export const getUserActivities = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { page, limit, skip } = getPaginationParams(req);

    if (req.user!.role === "admin") {
      const target = await User.findById(req.params.userId).select("role");
      if (!target || target.role === "super_admin") {
        throw notFound("User not found");
      }
    }

    const [logs, total] = await Promise.all([
      ActivityLog.find({ user: req.params.userId })
        .populate("user", "name email role avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ActivityLog.countDocuments({ user: req.params.userId }),
    ]);

    res.json({
      success: true,
      data: { logs },
      pagination: getPaginationResponse(total, page, limit),
    });
  },
);

/**
 * Get activities by resource (admin only)
 * @route GET /api/activities/resource/:resourceType/:resourceId
 */
export const getActivitiesByResource = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { resourceType, resourceId } = req.params;

    let logs = await ActivityLog.find({
      resourceType,
      resourceId,
    })
      .populate("user", "name email role avatar")
      .sort({ createdAt: -1 });

    if (req.user!.role === "admin") {
      logs = logs.filter((l) => {
        const u = l.user as { role?: string } | null;
        return u?.role !== "super_admin";
      });
    }

    res.json({
      success: true,
      data: { logs },
    });
  },
);
