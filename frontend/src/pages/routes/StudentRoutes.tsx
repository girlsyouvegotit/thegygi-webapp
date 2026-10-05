import RoleRoute from "./RoleRoute";
import StudentLayout from "@/components/layout/StudentLayout";

const StudentRoutes = () => (
  <RoleRoute allowedRoles={["student"]}>
    <StudentLayout />
  </RoleRoute>
);

export default StudentRoutes;
