import RoleRoute from "./RoleRoute";
import AdminLayout from "@/components/layout/AdminLayout";

const AdminRoutes = () => (
  <RoleRoute allowedRoles={["admin", "super_admin"]}>
    <AdminLayout />
  </RoleRoute>
);

export default AdminRoutes;
