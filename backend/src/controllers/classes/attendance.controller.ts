import type { Request, Response } from "express";
import {
  getClassAttendance as getClassAttendanceService,
  getStudentAttendance as getStudentAttendanceService,
  getStudentAttendanceSummary,
  manuallyMarkAttendance as manuallyMarkAttendanceService,
} from "../../services/attendance.service.js";
import { logActivity } from "../../services/activity.service.js";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import { asyncHandler, notFound } from "../../middleware/error.middleware.js";

/**
 * Get class attendance
 * @route GET /api/attendance/class/:classId
 */
export const getClassAttendance = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const classId = Array.isArray(req.params.classId) ? req.params.classId[0] : req.params.classId;
    const attendance = await getClassAttendanceService(classId);

    res.json({
      success: true,
      data: { attendance },
    });
  },
);

/**
 * Get student attendance
 * @route GET /api/attendance/student/:studentId
 */
export const getStudentAttendance = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const studentId = Array.isArray(req.params.studentId) ? req.params.studentId[0] : req.params.studentId;
    const attendance = await getStudentAttendanceService(studentId);

    res.json({
      success: true,
      data: { attendance },
    });
  },
);

/**
 * Get attendance summary
 * @route GET /api/attendance/summary/:studentId
 */
export const getAttendanceSummary = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const studentId = Array.isArray(req.params.studentId) ? req.params.studentId[0] : req.params.studentId;
    const summary = await getStudentAttendanceSummary(studentId);

    res.json({
      success: true,
      data: { summary },
    });
  },
);

/**
 * Manually mark attendance
 * @route POST /api/attendance/manual
 */
export const manuallyMarkAttendance = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { classId, studentId, status } = req.body;

    const attendance = await manuallyMarkAttendanceService(
      classId,
      studentId,
      status,
      req.user!._id.toString(),
    );

    await logActivity({
      userId: req.user!._id.toString(),
      action: "Manually marked attendance",
      details: `Marked student ${studentId} as ${status} for class ${classId}`,
      resourceType: "attendance",
      resourceId: attendance._id.toString(),
    });

    res.status(201).json({
      success: true,
      message: "Attendance marked",
      data: { attendance },
    });
  },
);
