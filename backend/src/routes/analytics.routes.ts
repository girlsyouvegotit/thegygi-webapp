import express from "express";
import { getStudentProgressAnalytics } from "../controllers/analytics/student-analytics.controller.js";
import { getTutorPerformanceAnalytics, getTutorStudentRoster } from "../controllers/analytics/tutor-analytics.controller.js";
import { getMentorImpactAnalytics } from "../controllers/analytics/mentor-analytics.controller.js";
import {
  getPlatformOverview,
  getStudentsPerformance,
} from "../controllers/analytics/admin-analytics.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import {
  adminOnly,
  tutorOrAdmin,
  anyAuthenticated,
} from "../middleware/role.middleware.js";

const router = express.Router();

// All analytics routes require authentication
router.use(protect);

// Student analytics (self, tutor, mentor, admin)
router.get(
  "/student/:studentId/progress",
  anyAuthenticated,
  getStudentProgressAnalytics,
);

// Tutor analytics (self, admin)
router.get("/tutor/:tutorId", tutorOrAdmin, getTutorPerformanceAnalytics);
router.get(
  "/tutor/:tutorId/students",
  tutorOrAdmin,
  getTutorStudentRoster,
);

// Mentor analytics (self, admin)
router.get("/mentor/:mentorId", anyAuthenticated, getMentorImpactAnalytics);

// Admin overview + cross-category student performance
router.get("/admin/overview", adminOnly, getPlatformOverview);
router.get(
  "/admin/students-performance",
  adminOnly,
  getStudentsPerformance,
);

export default router;
