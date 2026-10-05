/** Canonical home dashboard for each platform role. */
export function dashboardPathForRole(role?: string): string {
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
    case "student":
      return "/dashboard";
    default:
      return "/dashboard";
  }
}

const STUDENT_SHELL_PREFIXES = [
  "/dashboard",
  "/my-learning",
  "/community",
  "/live-classes",
  "/live-class/",
  "/recordings",
  "/quizzes",
  "/assignments",
  "/mentorship",
  "/progress",
  "/certificates",
  "/after-graduation",
  "/my-testimonial",
  "/calendar",
  "/profile",
  "/categories",
] as const;

/** True when a path belongs to the student app shell (not /admin, /tutor, etc.). */
export function isStudentShellPath(pathname: string): boolean {
  const path = pathname.split("?")[0] || "";
  if (
    path.startsWith("/admin") ||
    path.startsWith("/tutor") ||
    path.startsWith("/mentor") ||
    path.startsWith("/writer") ||
    path.startsWith("/super-admin")
  ) {
    return false;
  }
  return STUDENT_SHELL_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`) || path.startsWith(prefix),
  );
}

/**
 * Keep staff on their own portal when a notification/search link points at
 * the student shell (e.g. /community, /dashboard).
 */
export function navPathForRole(role: string | undefined, href: string): string {
  if (!href) return dashboardPathForRole(role);
  if (role === "student" || !role) return href;
  if (isStudentShellPath(href)) return dashboardPathForRole(role);
  return href;
}
