import {
  LayoutDashboard,
  Video,
  CalendarPlus,
  FileQuestion,
  FileText,
  Users,
  TrendingUp,
  CircleUser,
  LogOut,
  PlayCircle,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavUser } from "./NavUser";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuthContext";
import { useNavigate, useLocation } from "react-router";
import { cn } from "@/lib/utils";
import {
  FLOATING_SIDEBAR_CLASS,
  SIDEBAR_ITEM_ACTIVE,
  SIDEBAR_ITEM_IDLE,
  navItemIsActive,
} from "@/lib/sidebarStyles";
import { LogoutDialog } from "@/components/auth/LogoutDialog";

const navItems = [
  { title: "Dashboard", url: "/tutor/dashboard", icon: LayoutDashboard },
  { title: "My Classes", url: "/tutor/classes", icon: Video },
  { title: "Recordings", url: "/tutor/recordings", icon: PlayCircle },
  { title: "Schedule Class", url: "/tutor/schedule", icon: CalendarPlus },
  { title: "Quizzes", url: "/tutor/quizzes", icon: FileQuestion },
  { title: "Assignments", url: "/tutor/assignments", icon: FileText },
  { title: "Students", url: "/tutor/students", icon: Users },
  { title: "Analytics", url: "/tutor/analytics", icon: TrendingUp },
  { title: "Profile", url: "/tutor/profile", icon: CircleUser },
];

export const TutorSidebar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile, setOpenMobile } = useSidebar();
  const [logoutOpen, setLogoutOpen] = useState(false);

  const handleNavigation = (url: string) => {
    navigate(url);
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <Sidebar
      variant="floating"
      collapsible="icon"
      className={FLOATING_SIDEBAR_CLASS}
    >
      <SidebarHeader className="border-b p-4 group-data-[collapsible=icon]:p-2">
        <div className="flex min-w-0 items-center gap-2 group-data-[collapsible=icon]:justify-center">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
            <Video className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="min-w-0 overflow-hidden transition-[width,opacity] duration-200 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0">
            <p className="font-semibold">GYGI</p>
            <p className="text-xs text-muted-foreground">Tutor Portal</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu className="gap-1">
          {navItems.map((item) => {
            const active = navItemIsActive(location.pathname, item.url);
            return (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton
                  type="button"
                  tooltip={item.title}
                  isActive={active}
                  className={cn(
                    "h-10 px-3",
                    active ? SIDEBAR_ITEM_ACTIVE : SIDEBAR_ITEM_IDLE,
                  )}
                  onClick={() => handleNavigation(item.url)}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="border-t p-4 group-data-[collapsible=icon]:p-2">
        <NavUser
          profileHref="/tutor/profile"
          user={{
            name: user?.name || "",
            email: user?.email || "",
            avatar: user?.avatar || "",
            avatarUpdatedAt: user?.avatarUpdatedAt,
          }}
        />
        <button
          type="button"
          onClick={() => setLogoutOpen(true)}
          className="flex w-full items-center gap-3 rounded-lg p-2 text-sm text-muted-foreground hover:bg-muted group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span className="group-data-[collapsible=icon]:hidden">Logout</span>
        </button>
      </SidebarFooter>
      <LogoutDialog
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        onConfirm={handleLogout}
      />
    </Sidebar>
  );
};
