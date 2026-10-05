import type { Response, NextFunction } from "express";
import type { AuthRequest } from "./auth.middleware.js";
import type { SuperAdminCapability } from "../models/user.model.js";

export type UserRole =
  | "student"
  | "tutor"
  | "mentor"
  | "writer"
  | "admin"
  | "super_admin";

/**
 * Authorize specific roles.
 * `super_admin` is treated as a superset of `admin` whenever `admin` is allowed,
 * unless the route is explicitly role-locked.
 */
export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Not authorized, user not found",
      });
      return;
    }

    if (roles.length === 0) {
      console.warn("Authorize middleware called with no roles");
      res.status(500).json({
        success: false,
        message: "Server configuration error",
      });
      return;
    }

    const role = req.user.role as UserRole;
    const allowed =
      roles.includes(role) ||
      (role === "super_admin" && roles.includes("admin"));

    if (!allowed) {
      res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`,
      });
      return;
    }

    next();
  };
};

/** Super-admin only (platform command center). */
export const superAdminOnly = authorize("super_admin");

/** Admin portal — admins and super-admins. */
export const adminOnly = authorize("admin");

export const tutorOrAdmin = authorize("tutor", "admin");
export const mentorOrAdmin = authorize("mentor", "admin");
export const studentOnly = authorize("student");

export const anyAuthenticated = authorize(
  "student",
  "tutor",
  "mentor",
  "writer",
  "admin",
  "super_admin",
);

export const writerOnly = authorize("writer", "admin");
export const staffOnly = authorize(
  "admin",
  "tutor",
  "mentor",
  "writer",
  "super_admin",
);
export const adminOrStudent = authorize("admin", "student");

export const hasRole = (user: { role?: string } | null, roles: UserRole[]) => {
  if (!user?.role) return false;
  const role = user.role as UserRole;
  return (
    roles.includes(role) ||
    (role === "super_admin" && roles.includes("admin"))
  );
};

export const requireCapability = (...caps: SuperAdminCapability[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || req.user.role !== "super_admin") {
      res.status(403).json({
        success: false,
        message: "Super-admin access required",
      });
      return;
    }

    const owned = new Set(req.user.capabilities || []);
    // Empty capabilities = full access for seeded super-admins
    if (owned.size === 0 || caps.every((c) => owned.has(c))) {
      next();
      return;
    }

    res.status(403).json({
      success: false,
      message: "Missing required super-admin capability",
    });
  };
};
