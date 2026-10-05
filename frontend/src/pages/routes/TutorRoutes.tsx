import RoleRoute from "./RoleRoute";
import TutorLayout from "@/components/layout/TutorLayout";

const TutorRoutes = () => (
  <RoleRoute allowedRoles={["tutor"]}>
    <TutorLayout />
  </RoleRoute>
);

export default TutorRoutes;
