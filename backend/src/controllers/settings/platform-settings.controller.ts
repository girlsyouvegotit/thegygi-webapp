import type { Response } from "express";
import { logActivity } from "../../services/activity.service.js";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import { asyncHandler, badRequest } from "../../middleware/error.middleware.js";
import {
  DEFAULT_NOTIFICATIONS,
  DEFAULT_ROLE_PERMISSIONS,
  DEFAULT_SCHOOL,
  DEFAULT_SECURITY,
  getOrCreatePlatformSettings,
  type ISchoolSettings,
  type ISecuritySettings,
  type SettingsRole,
} from "../../models/platform-settings.model.js";

const VALID_ROLES: SettingsRole[] = ["student", "tutor", "mentor", "admin"];

const asPlain = <T extends object>(value: unknown, fallback: T): T => {
  if (!value || typeof value !== "object") return fallback;
  const anyVal = value as T & { toObject?: () => T };
  if (typeof anyVal.toObject === "function") return { ...fallback, ...anyVal.toObject() };
  return { ...fallback, ...(value as T) };
};

const serializeNotifications = (n: {
  emailEnabled?: boolean;
  inAppEnabled?: boolean;
  pushEnabled?: boolean;
  events?: Map<string, boolean> | Record<string, boolean>;
}) => {
  const events =
    n.events instanceof Map
      ? Object.fromEntries(n.events.entries())
      : { ...(n.events || DEFAULT_NOTIFICATIONS.events) };
  return {
    emailEnabled: n.emailEnabled ?? true,
    inAppEnabled: n.inAppEnabled ?? true,
    pushEnabled: n.pushEnabled ?? false,
    events: { ...DEFAULT_NOTIFICATIONS.events, ...events },
  };
};

/** GET /api/settings/school */
export const getSchoolSettings = asyncHandler(
  async (_req: AuthRequest, res: Response): Promise<void> => {
    const doc = await getOrCreatePlatformSettings();
    res.json({
      success: true,
      data: asPlain<ISchoolSettings>(doc.school, DEFAULT_SCHOOL),
    });
  },
);

/** PUT /api/settings/school */
export const updateSchoolSettings = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const doc = await getOrCreatePlatformSettings();
    doc.school = { ...DEFAULT_SCHOOL, ...doc.school, ...req.body };
    doc.updatedBy = req.user!._id as typeof doc.updatedBy;
    await doc.save();

    await logActivity({
      userId: req.user!._id.toString(),
      action: "Updated school settings",
      resourceType: "settings",
      isAudit: true,
    });

    res.json({
      success: true,
      message: "Settings updated",
      data: doc.school,
    });
  },
);

/** GET /api/settings/roles */
export const getRolePermissions = asyncHandler(
  async (_req: AuthRequest, res: Response): Promise<void> => {
    const doc = await getOrCreatePlatformSettings();
    const perms = doc.rolePermissions || DEFAULT_ROLE_PERMISSIONS;
    res.json({
      success: true,
      data: {
        student: perms.student?.length
          ? perms.student
          : DEFAULT_ROLE_PERMISSIONS.student,
        tutor: perms.tutor?.length ? perms.tutor : DEFAULT_ROLE_PERMISSIONS.tutor,
        mentor: perms.mentor?.length
          ? perms.mentor
          : DEFAULT_ROLE_PERMISSIONS.mentor,
        admin: perms.admin?.length ? perms.admin : DEFAULT_ROLE_PERMISSIONS.admin,
      },
    });
  },
);

/** PUT /api/settings/roles */
export const updateRolePermissions = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { role, permissions } = req.body as {
      role: unknown;
      permissions: unknown;
    };

    if (typeof role !== "string" || !VALID_ROLES.includes(role as SettingsRole)) {
      throw badRequest("Invalid role");
    }
    if (!Array.isArray(permissions)) {
      throw badRequest("Permissions must be an array");
    }

    const doc = await getOrCreatePlatformSettings();
    const next = {
      student: doc.rolePermissions?.student?.length
        ? doc.rolePermissions.student
        : DEFAULT_ROLE_PERMISSIONS.student,
      tutor: doc.rolePermissions?.tutor?.length
        ? doc.rolePermissions.tutor
        : DEFAULT_ROLE_PERMISSIONS.tutor,
      mentor: doc.rolePermissions?.mentor?.length
        ? doc.rolePermissions.mentor
        : DEFAULT_ROLE_PERMISSIONS.mentor,
      admin: doc.rolePermissions?.admin?.length
        ? doc.rolePermissions.admin
        : DEFAULT_ROLE_PERMISSIONS.admin,
    };
    next[role as SettingsRole] = permissions as typeof next.student;
    doc.rolePermissions = next;
    doc.updatedBy = req.user!._id as typeof doc.updatedBy;
    await doc.save();

    await logActivity({
      userId: req.user!._id.toString(),
      action: "Updated role permissions",
      details: `Updated permissions for role: ${role}`,
      resourceType: "settings",
      metadata: { role },
      isAudit: true,
    });

    res.json({
      success: true,
      message: "Permissions updated",
      data: next,
    });
  },
);

/** GET /api/settings/notifications */
export const getNotificationSettings = asyncHandler(
  async (_req: AuthRequest, res: Response): Promise<void> => {
    const doc = await getOrCreatePlatformSettings();
    res.json({
      success: true,
      data: serializeNotifications(doc.notifications || DEFAULT_NOTIFICATIONS),
    });
  },
);

/** PUT /api/settings/notifications */
export const updateNotificationSettings = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const doc = await getOrCreatePlatformSettings();
    const body = req.body as Partial<{
      emailEnabled: boolean;
      inAppEnabled: boolean;
      pushEnabled: boolean;
      events: Record<string, boolean>;
    }>;

    const current = serializeNotifications(
      doc.notifications || DEFAULT_NOTIFICATIONS,
    );
    const next = {
      emailEnabled: body.emailEnabled ?? current.emailEnabled,
      inAppEnabled: body.inAppEnabled ?? current.inAppEnabled,
      pushEnabled: body.pushEnabled ?? current.pushEnabled,
      events: { ...current.events, ...(body.events || {}) },
    };

    doc.notifications = next as typeof doc.notifications;
    doc.updatedBy = req.user!._id as typeof doc.updatedBy;
    await doc.save();

    await logActivity({
      userId: req.user!._id.toString(),
      action: "Updated notification settings",
      resourceType: "settings",
      isAudit: true,
    });

    res.json({
      success: true,
      message: "Notification settings updated",
      data: next,
    });
  },
);

/** GET /api/settings/security */
export const getSecuritySettings = asyncHandler(
  async (_req: AuthRequest, res: Response): Promise<void> => {
    const doc = await getOrCreatePlatformSettings();
    res.json({
      success: true,
      data: asPlain<ISecuritySettings>(doc.security, DEFAULT_SECURITY),
    });
  },
);

/** PUT /api/settings/security */
export const updateSecuritySettings = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const doc = await getOrCreatePlatformSettings();
    const body = req.body as Partial<typeof DEFAULT_SECURITY>;

    const current = asPlain<ISecuritySettings>(doc.security, DEFAULT_SECURITY);
    const next = {
      require2faForAdmins:
        body.require2faForAdmins ?? current.require2faForAdmins,
      sessionTimeoutMinutes:
        body.sessionTimeoutMinutes ?? current.sessionTimeoutMinutes,
      maxLoginAttempts: body.maxLoginAttempts ?? current.maxLoginAttempts,
      lockoutMinutes: body.lockoutMinutes ?? current.lockoutMinutes,
      passwordMinLength: body.passwordMinLength ?? current.passwordMinLength,
      requireStrongPassword:
        body.requireStrongPassword ?? current.requireStrongPassword,
      allowSelfRegistration:
        body.allowSelfRegistration ?? current.allowSelfRegistration,
      forcePasswordResetDays:
        body.forcePasswordResetDays ?? current.forcePasswordResetDays,
    };

    if (next.sessionTimeoutMinutes < 15 || next.sessionTimeoutMinutes > 10080) {
      throw badRequest("Session timeout must be between 15 and 10080 minutes");
    }
    if (next.maxLoginAttempts < 3 || next.maxLoginAttempts > 20) {
      throw badRequest("Max login attempts must be between 3 and 20");
    }
    if (next.passwordMinLength < 6 || next.passwordMinLength > 64) {
      throw badRequest("Password min length must be between 6 and 64");
    }

    doc.security = next;
    doc.updatedBy = req.user!._id as typeof doc.updatedBy;
    await doc.save();

    await logActivity({
      userId: req.user!._id.toString(),
      action: "Updated security settings",
      resourceType: "settings",
      isAudit: true,
    });

    res.json({
      success: true,
      message: "Security settings updated",
      data: next,
    });
  },
);
