import RoleRoute from "./RoleRoute";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";

const SuperAdminRoutes = () => (
  <RoleRoute allowedRoles={["super_admin"]}>
    <SuperAdminLayout />
  </RoleRoute>
);

export default SuperAdminRoutes;
