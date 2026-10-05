import type { Response } from "express";
import Salary from "../../models/salary.model.js";
import User from "../../models/user.model.js";
import Notification from "../../models/notification.model.js";
import { logActivity } from "../../services/activity.service.js";
import { notifySalaryPaid } from "../../services/notification.service.js";
import { sendToUser } from "../../sockets/socket.server.js";
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

function dashboardLinkForRole(role?: string): string {
  if (role === "mentor") return "/mentor/dashboard";
  if (role === "tutor") return "/tutor/dashboard";
  return "/";
}

async function emitSalaryPaidNotification(params: {
  employeeId: string;
  amount: number;
  month: number;
  year: number;
  salaryId: string;
}): Promise<void> {
  const employeeId = String(params.employeeId || "");
  if (!employeeId) {
    console.error("salary_paid notify skipped: missing employeeId");
    return;
  }

  try {
    const already = await Notification.findOne({
      type: "salary_paid",
      "metadata.salaryId": params.salaryId,
    })
      .select("_id")
      .lean();
    if (already) {
      console.log(
        `salary_paid notify skipped: already sent for salary ${params.salaryId}`,
      );
      return;
    }

    const employee = await User.findById(employeeId).select("role name").lean();
    if (!employee) {
      console.error(
        `salary_paid notify skipped: employee ${employeeId} not found`,
      );
      return;
    }

    const notification = await notifySalaryPaid({
      employeeId,
      amount: params.amount,
      month: params.month,
      year: params.year,
      salaryId: params.salaryId,
      link: dashboardLinkForRole(employee.role),
    });

    const payload = {
      _id: String(notification._id),
      user: employeeId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      link: notification.link,
      isRead: notification.isRead,
      metadata: notification.metadata,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    };

    sendToUser(employeeId, "new-notification", payload);
    console.log(
      `salary_paid notified ${employee.name} (${employee.role}) salary=${params.salaryId}`,
    );
  } catch (error) {
    console.error("Failed to notify salary paid:", error);
  }
}

export const createSalary = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const {
      employeeId,
      amount,
      month,
      year,
      status,
      academicYearId,
      paymentDate,
    } = req.body;

    const resolvedStatus = status || "pending";
    const safeAmount = assertNonNegativeAmount(amount);
    const salary = await Salary.create({
      employee: employeeId,
      amount: safeAmount,
      month,
      year,
      status: resolvedStatus,
      academicYear: academicYearId || null,
      paymentDate:
        resolvedStatus === "paid"
          ? paymentDate
            ? new Date(paymentDate)
            : new Date()
          : paymentDate
            ? new Date(paymentDate)
            : null,
    });

    await logActivity({
      userId: req.user!._id.toString(),
      action: "Created salary record",
      details: `Created salary for employee ${employeeId}`,
      resourceType: "salary",
      resourceId: salary._id.toString(),
    });

    if (resolvedStatus === "paid" && employeeId) {
      await emitSalaryPaidNotification({
        employeeId: String(employeeId),
        amount: salary.amount,
        month: salary.month,
        year: salary.year,
        salaryId: salary._id.toString(),
      });
    }

    res.status(201).json({
      success: true,
      message: "Salary created",
      data: { salary },
    });
  },
);

export const getSalaries = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { page, limit, skip } = getPaginationParams(req);
    const { search, month, year, status } = req.query;

    const filter: Record<string, unknown> = {};
    if (search) {
      const employees = await User.find({
        name: { $regex: search, $options: "i" },
      }).select("_id");
      filter.employee = { $in: employees.map((e) => e._id) };
    }
    if (month) filter.month = parseInt(month as string, 10);
    if (year) filter.year = parseInt(year as string, 10);
    if (status) filter.status = status;

    const [salaries, total] = await Promise.all([
      Salary.find(filter)
        .populate("employee", "name email role")
        .populate("academicYear", "name")
        .sort({ year: -1, month: -1 })
        .skip(skip)
        .limit(limit),
      Salary.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: { salaries },
      pagination: getPaginationResponse(total, page, limit),
    });
  },
);

export const getSalaryById = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const salary = await Salary.findById(req.params.id)
      .populate("employee", "name email role")
      .populate("academicYear", "name");
    if (!salary) throw notFound("Salary not found");
    res.json({ success: true, data: { salary } });
  },
);

export const getMySalary = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { month, year } = req.query;
    const filter: Record<string, unknown> = { employee: req.user!._id };
    if (month) filter.month = parseInt(month as string, 10);
    if (year) filter.year = parseInt(year as string, 10);

    const salaries = await Salary.find(filter)
      .populate("academicYear", "name")
      .sort({ year: -1, month: -1 });

    res.json({ success: true, data: { salaries } });
  },
);

export const updateSalary = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const existing = await Salary.findById(req.params.id);
    if (!existing) throw notFound("Salary not found");

    const previousStatus = existing.status;
    const {
      employeeId,
      amount,
      month,
      year,
      status,
      academicYearId,
      paymentDate,
    } = req.body;

    if (employeeId !== undefined) existing.employee = employeeId;
    if (amount !== undefined) existing.amount = assertNonNegativeAmount(amount);
    if (month !== undefined) existing.month = month;
    if (year !== undefined) existing.year = year;
    if (academicYearId !== undefined) existing.academicYear = academicYearId;
    if (status !== undefined) existing.status = status;

    if (status === "paid") {
      existing.paymentDate = paymentDate
        ? new Date(paymentDate)
        : existing.paymentDate || new Date();
    } else if (paymentDate !== undefined) {
      existing.paymentDate = paymentDate ? new Date(paymentDate) : null;
    }

    await existing.save();

    await logActivity({
      userId: req.user!._id.toString(),
      action: "Updated salary record",
      details: `Updated salary for employee ${existing.employee}`,
      resourceType: "salary",
      resourceId: req.params.id,
    });

    const becamePaid = previousStatus !== "paid" && existing.status === "paid";
    if (becamePaid) {
      await emitSalaryPaidNotification({
        employeeId: String(existing.employee),
        amount: existing.amount,
        month: existing.month,
        year: existing.year,
        salaryId: existing._id.toString(),
      });
    }

    const salary = await Salary.findById(existing._id)
      .populate("employee", "name email role")
      .populate("academicYear", "name");

    res.json({ success: true, message: "Salary updated", data: { salary } });
  },
);

export const deleteSalary = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const salary = await Salary.findByIdAndDelete(req.params.id);
    if (!salary) throw notFound("Salary not found");

    await logActivity({
      userId: req.user!._id.toString(),
      action: "Deleted salary record",
      details: `Deleted salary for employee ${salary.employee}`,
      resourceType: "salary",
      resourceId: req.params.id,
    });

    res.json({ success: true, message: "Salary deleted" });
  },
);
