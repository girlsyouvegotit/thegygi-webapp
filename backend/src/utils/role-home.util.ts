import type { userRoles } from "../models/user.model.js";

/** Frontend home path for a role after login / act-as. */
export function roleHomePath(role: userRoles | string): string {
  switch (role) {
    case "super_admin":
      return "/super-admin/dashboard";
    case "admin":
      return "/admin/dashboard";
    case "tutor":
      return "/tutor/dashboard";
    case "mentor":
      return "/mentor/dashboard";
    case "writer":
      return "/writer/dashboard";
    default:
      return "/dashboard";
  }
}
