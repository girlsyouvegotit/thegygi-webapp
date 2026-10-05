import express from "express";
import {
  getSchoolSettings,
  updateSchoolSettings,
  getRolePermissions,
  updateRolePermissions,
  getNotificationSettings,
  updateNotificationSettings,
  getSecuritySettings,
  updateSecuritySettings,
} from "../controllers/settings/platform-settings.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { adminOnly } from "../middleware/role.middleware.js";
import { validateBody } from "../utils/validation.util.js";
import { z } from "zod";

const router = express.Router();

const schoolSettingsSchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  logo: z.string().optional(),
  primaryColor: z.string().optional(),
});

const rolePermissionsSchema = z.object({
  role: z.enum(["student", "tutor", "mentor", "admin"]),
  permissions: z.array(
    z.object({
      module: z.string(),
      actions: z.array(z.string()),
    }),
  ),
});

const notificationSettingsSchema = z.object({
  emailEnabled: z.boolean().optional(),
  inAppEnabled: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
  events: z.record(z.string(), z.boolean()).optional(),
});

const securitySettingsSchema = z.object({
  require2faForAdmins: z.boolean().optional(),
  sessionTimeoutMinutes: z.number().int().optional(),
  maxLoginAttempts: z.number().int().optional(),
  lockoutMinutes: z.number().int().optional(),
  passwordMinLength: z.number().int().optional(),
  requireStrongPassword: z.boolean().optional(),
  allowSelfRegistration: z.boolean().optional(),
  forcePasswordResetDays: z.number().int().optional(),
});

router.use(protect, adminOnly);

router.get("/school", getSchoolSettings);
router.put("/school", validateBody(schoolSettingsSchema), updateSchoolSettings);

router.get("/roles", getRolePermissions);
router.put("/roles", validateBody(rolePermissionsSchema), updateRolePermissions);

router.get("/notifications", getNotificationSettings);
router.put(
  "/notifications",
  validateBody(notificationSettingsSchema),
  updateNotificationSettings,
);

router.get("/security", getSecuritySettings);
router.put(
  "/security",
  validateBody(securitySettingsSchema),
  updateSecuritySettings,
);

export default router;
