import { Outlet } from "react-router";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { TutorSidebar } from "@/components/sidebar/TutorSidebar";
import Header from "./Header";
import { ImpersonationBanner } from "@/components/layout/ImpersonationBanner";
import DashboardThemeScope from "@/components/theme/DashboardThemeScope";
import { NoIndexSeo } from "@/components/seo/PageSeo";

const TutorLayout = () => {
  return (
    <DashboardThemeScope>
      <NoIndexSeo title="Tutor dashboard | GYGI" />
      <SidebarProvider>
        <TutorSidebar />
        <SidebarInset className="flex h-svh min-h-0 min-w-0 flex-col overflow-hidden">
          <ImpersonationBanner />
          <Header />
          <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto bg-background p-3 sm:p-6">
            <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </DashboardThemeScope>
  );
};

export default TutorLayout;
