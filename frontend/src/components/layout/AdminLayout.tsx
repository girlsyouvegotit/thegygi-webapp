import { Outlet } from "react-router";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/sidebar/AdminSidebar";
import { Header } from "@/components/layout/Header";
import { ImpersonationBanner } from "@/components/layout/ImpersonationBanner";
import { AdminBasePathProvider } from "@/hooks/useAdminPath";
import DashboardThemeScope from "@/components/theme/DashboardThemeScope";
import { NoIndexSeo } from "@/components/seo/PageSeo";

const AdminLayout = () => {
  return (
    <DashboardThemeScope>
      <NoIndexSeo title="Admin dashboard | GYGI" />
      <AdminBasePathProvider base="/admin">
        <SidebarProvider>
          <AdminSidebar />
          <SidebarInset className="min-w-0 overflow-x-hidden">
            <ImpersonationBanner />
            <Header />
            <main className="min-w-0 overflow-x-hidden bg-background p-3 sm:p-5 lg:p-6">
              <div className="mx-auto w-full min-w-0 max-w-[1600px]">
                <Outlet />
              </div>
            </main>
          </SidebarInset>
        </SidebarProvider>
      </AdminBasePathProvider>
    </DashboardThemeScope>
  );
};

export default AdminLayout;