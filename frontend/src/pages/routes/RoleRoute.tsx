import { Navigate, useLocation } from "react-router";
import useAuth from "@/hooks/useAuthContext";
import { dashboardPathForRole } from "@/lib/roleHome";

interface RoleRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

const RoleRoute = ({ children, allowedRoles }: RoleRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!allowedRoles.includes(user.role)) {
    const home = dashboardPathForRole(user.role);
    // Avoid redirect loops: if we'd redirect to the page we're already on,
    // send the user to the public landing page instead.
    if (home === location.pathname) {
      return <Navigate to="/" replace />;
    }
    return <Navigate to={home} replace />;
  }

  return <>{children}</>;
};

export default RoleRoute;
