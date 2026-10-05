import { Outlet } from "react-router";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SuperAdminSidebar } from "@/components/sidebar/SuperAdminSidebar";
import { Header } from "@/components/layout/Header";
import DashboardThemeScope from "@/components/theme/DashboardThemeScope";
import { NoIndexSeo } from "@/components/seo/PageSeo";

const SuperAdminLayout = () => {
  return (
    <DashboardThemeScope>
      <NoIndexSeo title="Super Admin | GYGI" />
      <SidebarProvider className="bg-background">
        <SuperAdminSidebar />
        <SidebarInset className="min-h-svh min-w-0 overflow-x-hidden bg-background">
          <Header />
          <main className="relative min-w-0 flex-1 overflow-x-hidden bg-background p-0">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,color-mix(in_srgb,var(--primary)_10%,transparent),transparent_45%),radial-gradient(ellipse_at_bottom_left,color-mix(in_srgb,var(--primary)_6%,transparent),transparent_40%)]"
            />
            <div className="relative z-[1] min-w-0 w-full">
              <Outlet />
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </DashboardThemeScope>
  );
};

export default SuperAdminLayout;
