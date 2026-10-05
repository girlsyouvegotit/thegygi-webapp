import { Outlet } from "react-router";
import { AdminBasePathProvider } from "@/hooks/useAdminPath";

/**
 * Responsive shell for Admin portal pages hosted under Super Admin → Admin ops.
 * Matches native SA page breathing room so dense admin UIs don't crumble.
 */
const AdminOpsShell = () => {
  return (
    <AdminBasePathProvider base="/super-admin/ops">
      <div className="mx-auto w-full min-w-0 max-w-[1600px] px-4 pb-12 pt-3 sm:px-6 sm:pt-4 lg:px-8">
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </AdminBasePathProvider>
  );
};

export default AdminOpsShell;
