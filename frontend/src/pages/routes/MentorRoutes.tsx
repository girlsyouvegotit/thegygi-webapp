import RoleRoute from "./RoleRoute";
import MentorLayout from "@/components/layout/MentorLayout";

const MentorRoutes = () => (
  <RoleRoute allowedRoles={["mentor"]}>
    <MentorLayout />
  </RoleRoute>
);

export default MentorRoutes;
