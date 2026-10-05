import express from "express";
import {
  getActivities,
  getActivityById,
  getUserActivities,
  getActivitiesByResource,
} from "../controllers/activity/activity.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { adminOnly, anyAuthenticated } from "../middleware/role.middleware.js";

const router = express.Router();

// All activity routes require authentication
router.use(protect);

// Get activities (admin sees all, others see filtered)
router.get("/", anyAuthenticated, getActivities);

// Get specific activity
router.get("/:id", adminOnly, getActivityById);

// Get user activities
router.get("/user/:userId", adminOnly, getUserActivities);

// Get activities by resource
router.get(
  "/resource/:resourceType/:resourceId",
  adminOnly,
  getActivitiesByResource,
);

export default router;
