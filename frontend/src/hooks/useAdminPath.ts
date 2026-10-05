import {
  createContext,
  createElement,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useLocation } from "react-router";

const AdminBasePathContext = createContext<string | null>(null);

export function AdminBasePathProvider({
  base,
  children,
}: {
  base: string;
  children: ReactNode;
}) {
  return createElement(
    AdminBasePathContext.Provider,
    { value: base },
    children,
  );
}

/** Active admin portal base: `/admin` or `/super-admin/ops`. */
export function useAdminBasePath(): string {
  const ctx = useContext(AdminBasePathContext);
  const { pathname } = useLocation();
  if (ctx) return ctx;
  if (pathname.startsWith("/super-admin/ops")) return "/super-admin/ops";
  return "/admin";
}

/**
 * Build admin-portal paths that stay inside the current shell
 * (standalone admin vs Super Admin → Admin ops).
 *
 * @example adminPath("users") → "/admin/users" or "/super-admin/ops/users"
 * @example adminPath("users?role=student")
 */
export function useAdminPath() {
  const base = useAdminBasePath();

  return useMemo(() => {
    return (suffix = "") => {
      const raw = suffix.trim();
      if (!raw || raw === "/") return base;

      const withoutAdmin = raw.replace(/^\/?admin\/?/, "");
      const cleaned = withoutAdmin.replace(/^\//, "");
      if (!cleaned) return base;
      return `${base}/${cleaned}`;
    };
  }, [base]);
}
