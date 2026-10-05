import type { Response } from "express";
import Expense from "../../models/expense.model.js";
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

export const createExpense = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { date, category, description, amount, academicYearId } = req.body;
    const safeAmount = assertNonNegativeAmount(amount);
    const expense = await Expense.create({
      date,
      category,
      description,
      amount: safeAmount,
      academicYear: academicYearId,
    });

    await logActivity({
      userId: req.user!._id.toString(),
      action: "Created expense record",
      details: `Created expense: ${description}`,
      resourceType: "expense",
      resourceId: expense._id.toString(),
    });

    res.status(201).json({
      success: true,
      message: "Expense created",
      data: { expense },
    });
  },
);

export const getExpenses = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { page, limit, skip } = getPaginationParams(req);
    const { search } = req.query;
    const filter: Record<string, unknown> = {};
    if (search) {
      filter.$or = [
        { description: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }

    const [expenses, total] = await Promise.all([
      Expense.find(filter)
        .populate("academicYear", "name")
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit),
      Expense.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: { expenses },
      pagination: getPaginationResponse(total, page, limit),
    });
  },
);

export const getExpenseById = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const expense = await Expense.findById(req.params.id).populate(
      "academicYear",
      "name",
    );
    if (!expense) throw notFound("Expense not found");
    res.json({ success: true, data: { expense } });
  },
);

export const updateExpense = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const payload = { ...req.body };
    if (payload.amount !== undefined) {
      payload.amount = assertNonNegativeAmount(payload.amount);
    }
    const expense = await Expense.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });
    if (!expense) throw notFound("Expense not found");

    await logActivity({
      userId: req.user!._id.toString(),
      action: "Updated expense record",
      details: `Updated expense: ${expense.description}`,
      resourceType: "expense",
      resourceId: expense._id.toString(),
    });

    res.json({ success: true, message: "Expense updated", data: { expense } });
  },
);

export const deleteExpense = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) throw notFound("Expense not found");

    await logActivity({
      userId: req.user!._id.toString(),
      action: "Deleted expense record",
      details: `Deleted expense: ${expense.description}`,
      resourceType: "expense",
      resourceId: expense._id.toString(),
    });

    res.json({ success: true, message: "Expense deleted" });
  },
);
