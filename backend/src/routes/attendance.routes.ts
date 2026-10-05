import express from "express";
import {
  getClassAttendance,
  getStudentAttendance,
  getAttendanceSummary,
  manuallyMarkAttendance,
} from "../controllers/classes/attendance.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import {
  tutorOrAdmin,
  adminOnly,
  anyAuthenticated,
} from "../middleware/role.middleware.js";
import { validateBody } from "../utils/validation.util.js";
import { z } from "zod";

const router = express.Router();

// Validation schemas
const manualAttendanceSchema = z.object({
  classId: z.string().min(1, "Class ID is required"),
  studentId: z.string().min(1, "Student ID is required"),
  status: z.enum(["present", "late", "absent", "excused"]),
});

// All attendance routes require authentication
router.use(protect);

// Get class attendance (tutor/admin)
router.get("/class/:classId", tutorOrAdmin, getClassAttendance);

// Get student attendance (student's own, tutor, mentor, admin)
router.get("/student/:studentId", anyAuthenticated, getStudentAttendance);

// Get attendance summary
router.get("/summary/:studentId", anyAuthenticated, getAttendanceSummary);

// Manual attendance marking (admin only)
router.post(
  "/manual",
  adminOnly,
  validateBody(manualAttendanceSchema),
  manuallyMarkAttendance,
);

export default router;
