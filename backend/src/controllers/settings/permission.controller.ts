import type { Response } from "express";
import { logActivity } from "../../services/activity.service.js";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import { asyncHandler, badRequest } from "../../middleware/error.middleware.js";

const VALID_ROLES = ["student", "tutor", "mentor", "admin"] as const;
type Role = (typeof VALID_ROLES)[number];

const defaultPermissions: Record<
  Role,
  { module: string; actions: string[] }[]
> = {
  student: [
    { module: "dashboard", actions: ["read"] },
    { module: "categories", actions: ["read"] },
    { module: "classes", actions: ["read", "join"] },
    { module: "recordings", actions: ["read", "watch"] },
    { module: "quizzes", actions: ["read", "submit"] },
    { module: "assignments", actions: ["read", "submit"] },
    { module: "mentorship", actions: ["read"] },
    { module: "community", actions: ["read", "write"] },
  ],
  tutor: [
    { module: "dashboard", actions: ["read"] },
    { module: "categories", actions: ["read"] },
    {
      module: "classes",
      actions: ["create", "read", "update", "delete", "start", "end"],
    },
    { module: "recordings", actions: ["read", "watch"] },
    {
      module: "quizzes",
      actions: ["create", "read", "update", "delete", "launch"],
    },
    {
      module: "assignments",
      actions: ["create", "read", "update", "delete", "grade"],
    },
    { module: "community", actions: ["read", "write", "announce"] },
    { module: "analytics", actions: ["read"] },
  ],
  mentor: [
    { module: "dashboard", actions: ["read"] },
    { module: "mentorship", actions: ["create", "read", "update"] },
    { module: "community", actions: ["read", "write"] },
    { module: "analytics", actions: ["read"] },
  ],
  admin: [
    { module: "dashboard", actions: ["read"] },
    {
      module: "categories",
      actions: ["create", "read", "update", "delete", "assign"],
    },
    {
      module: "users",
      actions: ["create", "read", "update", "delete", "suspend"],
    },
    {
      module: "classes",
      actions: ["create", "read", "update", "delete", "start", "end"],
    },
    { module: "recordings", actions: ["read", "watch", "download", "delete"] },
    {
      module: "quizzes",
      actions: ["create", "read", "update", "delete", "launch"],
    },
    {
      module: "assignments",
      actions: ["create", "read", "update", "delete", "grade"],
    },
    {
      module: "mentorship",
      actions: ["create", "read", "update", "delete", "assign"],
    },
    { module: "community", actions: ["read", "write", "announce", "moderate"] },
    { module: "analytics", actions: ["read"] },
    { module: "finance", actions: ["create", "read", "update", "delete"] },
    { module: "settings", actions: ["read", "update"] },
  ],
};

// NOTE: in-memory store. Restarts lose changes. Migrate to a `Setting`
// document when persistence is needed — the controller signature won't change.
let rolePermissions: Record<Role, { module: string; actions: string[] }[]> = {
  ...defaultPermissions,
};

export const getRolePermissions = asyncHandler(
  async (_req: AuthRequest, res: Response): Promise<void> => {
    res.json({ success: true, data: rolePermissions });
  },
);

export const updateRolePermissions = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { role, permissions } = req.body as {
      role: unknown;
      permissions: unknown;
    };

    if (typeof role !== "string" || !VALID_ROLES.includes(role as Role)) {
      throw badRequest("Invalid role");
    }
    if (!Array.isArray(permissions)) {
      throw badRequest("Permissions must be an array");
    }

    const next = { ...rolePermissions };
    next[role as Role] = permissions as any;
    rolePermissions = next;

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
      data: rolePermissions,
    });
  },
);
