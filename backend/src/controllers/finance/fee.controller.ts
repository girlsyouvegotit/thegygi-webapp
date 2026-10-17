import type { Response } from "express";
import Fee from "../../models/fee.model.js";
import Expense from "../../models/expense.model.js";
import Salary from "../../models/salary.model.js";
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

const FINANCE_SECTIONS = ["fees", "expenses", "salaries", "all"] as const;
type FinanceSection = (typeof FINANCE_SECTIONS)[number];

export const clearFinanceRecords = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const section = req.body?.section as FinanceSection;
    if (!FINANCE_SECTIONS.includes(section)) {
      throw badRequest("Choose fees, expenses, salaries, or all");
    }

    const targets: FinanceSection[] =
      section === "all" ? ["fees", "expenses", "salaries"] : [section];
    const removed: Record<string, number> = {};

    for (const target of targets) {
      const result =
        target === "fees"
          ? await Fee.deleteMany({})
          : target === "expenses"
            ? await Expense.deleteMany({})
            : await Salary.deleteMany({});
      removed[target] = result.deletedCount ?? 0;
    }

    const total = Object.values(removed).reduce((sum, n) => sum + n, 0);
    await logActivity({
      userId: req.user!._id.toString(),
      action: "Cleared finance records",
      details: `Cleared ${section}. Removed ${total} record${total === 1 ? "" : "s"}.`,
      resourceType: "finance",
      metadata: { section, removed },
      isAudit: true,
      req,
    });

    res.json({
      success: true,
      message:
        total === 0
          ? "Nothing to clear"
          : `Cleared ${total} finance record${total === 1 ? "" : "s"}`,
      data: { section, removed },
    });
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
