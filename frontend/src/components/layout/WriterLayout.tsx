import { Outlet } from "react-router";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { WriterSidebar } from "@/components/sidebar/WriterSidebar";
import { Header } from "@/components/layout/Header";
import { ImpersonationBanner } from "@/components/layout/ImpersonationBanner";
import DashboardThemeScope from "@/components/theme/DashboardThemeScope";
import { NoIndexSeo } from "@/components/seo/PageSeo";

const WriterLayout = () => {
  return (
    <DashboardThemeScope>
      <NoIndexSeo title="Writer workspace | GYGI" />
      <SidebarProvider className="bg-background">
        <WriterSidebar />
        <SidebarInset className="min-h-svh min-w-0 overflow-x-hidden bg-background">
          <ImpersonationBanner />
          <Header />
          <main className="min-w-0 flex-1 overflow-x-hidden bg-background p-0">
            <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </DashboardThemeScope>
  );
};

export default WriterLayout;
