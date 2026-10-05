import type { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuthContext";
import {
  dashboardThemeCssVars,
  getDashboardTheme,
} from "@/lib/dashboardThemes";

/**
 * Scopes dashboard CSS accent tokens to authenticated role shells.
 * Public/marketing pages stay on the GYGI default.
 */
const DashboardThemeScope = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const theme = getDashboardTheme(user?.dashboardTheme);

  return (
    <div
      className="min-h-svh w-full bg-background text-foreground [&_[data-slot=sidebar-wrapper]]:min-h-svh"
      data-dashboard-theme={theme.id}
      style={dashboardThemeCssVars(theme)}
    >
      {children}
    </div>
  );
};

export default DashboardThemeScope;
