import type { Response } from "express";
import AcademicYear from "../models/academic-year.model.js";
import type { AuthRequest } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../middleware/error.middleware.js";

function defaultYearName(): string {
  const y = new Date().getFullYear();
  return `${y}/${y + 1}`;
}

export const getAcademicYears = asyncHandler(
  async (_req: AuthRequest, res: Response): Promise<void> => {
    let years = await AcademicYear.find({ isActive: true })
      .sort({ startDate: -1, name: -1 })
      .lean();

    if (years.length === 0) {
      const created = await AcademicYear.create({
        name: defaultYearName(),
        isActive: true,
      });
      years = [created.toObject()];
    }

    res.json({
      success: true,
      data: {
        years: years.map((y) => ({
          ...y,
          _id: String(y._id),
        })),
      },
    });
  },
);
