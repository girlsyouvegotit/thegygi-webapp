import { Outlet } from "react-router";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { StudentSidebar } from "@/components/sidebar/StudentSidebar";
import Header from "./Header";
import { ImpersonationBanner } from "@/components/layout/ImpersonationBanner";
import DashboardThemeScope from "@/components/theme/DashboardThemeScope";
import { NoIndexSeo } from "@/components/seo/PageSeo";

const StudentLayout = () => {
  return (
    <DashboardThemeScope>
      <NoIndexSeo title="Student dashboard | GYGI" />
      <SidebarProvider>
        <StudentSidebar />
        <SidebarInset className="min-w-0 overflow-x-hidden">
          <ImpersonationBanner />
          <Header />
          <main className="min-w-0 overflow-x-hidden bg-background p-3 sm:p-6 lg:px-8 lg:py-7 xl:px-10">
            <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </DashboardThemeScope>
  );
};

export default StudentLayout;
