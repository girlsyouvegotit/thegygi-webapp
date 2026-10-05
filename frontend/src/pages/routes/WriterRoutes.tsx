import RoleRoute from "./RoleRoute";
import WriterLayout from "@/components/layout/WriterLayout";

const WriterRoutes = () => (
  <RoleRoute allowedRoles={["writer", "admin", "super_admin"]}>
    <WriterLayout />
  </RoleRoute>
);

export default WriterRoutes;
