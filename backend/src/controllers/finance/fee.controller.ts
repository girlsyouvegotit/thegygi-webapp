import type { Response } from "express";
import Fee from "../../models/fee.model.js";
import User from "../../models/user.model.js";
import { logActivity } from "../../services/activity.service.js";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import {
  asyncHandler,
  badRequest,
  notFound,
} from "../../middleware/error.middleware.js";
import {
  getPaginationParams,
  getPaginationResponse,
} from "../../utils/pagination.util.js";

function assertNonNegativeAmount(amount: unknown): number {
  const n = Number(amount);
  if (!Number.isFinite(n) || n < 0) {
    throw badRequest("Amount cannot be negative");
  }
  if (n === 0) {
    throw badRequest("Amount must be greater than zero");
  }
  return n;
}

export const createFee = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { studentId, amount, dueDate, status, description, academicYearId } =
      req.body;
    const safeAmount = assertNonNegativeAmount(amount);

    const fee = await Fee.create({
      student: studentId,
      amount: safeAmount,
      dueDate,
      status: status || "pending",
      description,
      academicYear: academicYearId,
    });

    await logActivity({
      userId: req.user!._id.toString(),
      action: "Created fee record",
      details: `Created fee for student ${studentId}`,
      resourceType: "fee",
      resourceId: fee._id.toString(),
    });

    res.status(201).json({
      success: true,
      message: "Fee record created",
      data: { fee },
    });
  },
);

export const getFees = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { page, limit, skip } = getPaginationParams(req);
    const { search } = req.query;

    const filter: Record<string, unknown> = {};
    if (search) {
      const students = await User.find({
        name: { $regex: search, $options: "i" },
      }).select("_id");
      filter.student = { $in: students.map((s) => s._id) };
    }

    const [fees, total] = await Promise.all([
      Fee.find(filter)
        .populate("student", "name email")
        .populate("academicYear", "name")
        .sort({ dueDate: -1 })
        .skip(skip)
        .limit(limit),
      Fee.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: { fees },
      pagination: getPaginationResponse(total, page, limit),
    });
  },
);

export const updateFee = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const payload = { ...req.body };
    if (payload.amount !== undefined) {
      payload.amount = assertNonNegativeAmount(payload.amount);
    }
    const fee = await Fee.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });
    if (!fee) throw notFound("Fee record not found");

    await logActivity({
      userId: req.user!._id.toString(),
      action: "Updated fee record",
      resourceType: "fee",
      resourceId: req.params.id,
    });

    res.json({ success: true, message: "Fee updated", data: { fee } });
  },
);

export const deleteFee = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const fee = await Fee.findByIdAndDelete(req.params.id);
    if (!fee) throw notFound("Fee record not found");

    await logActivity({
      userId: req.user!._id.toString(),
      action: "Deleted fee record",
      resourceType: "fee",
      resourceId: req.params.id,
    });

    res.json({ success: true, message: "Fee deleted" });
  },
);
