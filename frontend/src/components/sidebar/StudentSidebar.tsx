import { useState } from "react";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Video,
  PlayCircle,
  FileQuestion,
  FileText,
  HeartHandshake,
  TrendingUp,
  Calendar,
  Award,
  CircleUser,
  LogOut,
  Quote,
  GraduationCap,
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
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "My Learning", url: "/my-learning", icon: BookOpen },
  { title: "Community", url: "/community", icon: Users },
  { title: "Live Classes", url: "/live-classes", icon: Video },
  { title: "Recordings", url: "/recordings", icon: PlayCircle },
  { title: "Quizzes", url: "/quizzes", icon: FileQuestion },
  { title: "Assignments", url: "/assignments", icon: FileText },
  { title: "Mentorship", url: "/mentorship", icon: HeartHandshake },
  { title: "Progress", url: "/progress", icon: TrendingUp },
  { title: "Certificates", url: "/certificates", icon: Award },
  { title: "After Graduation", url: "/after-graduation", icon: GraduationCap },
  { title: "My Testimonial", url: "/my-testimonial", icon: Quote },
  { title: "Calendar", url: "/calendar", icon: Calendar },
  { title: "Profile", url: "/profile", icon: CircleUser },
];

export const StudentSidebar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile, setOpenMobile } = useSidebar();
  const [logoutOpen, setLogoutOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const handleNavigation = (url: string) => {
    navigate(url);
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar
      variant="floating"
      collapsible="icon"
      className={FLOATING_SIDEBAR_CLASS}
    >
      <SidebarHeader className="border-b border-border p-4 group-data-[collapsible=icon]:p-2">
        <div className="flex min-w-0 items-center gap-2 group-data-[collapsible=icon]:justify-center">
          <div className="h-8 w-8 shrink-0 rounded-lg bg-primary flex items-center justify-center">
            <BookOpen className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="min-w-0 overflow-hidden transition-[width,opacity] duration-200 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0">
            <p className="font-semibold">GYGI</p>
            <p className="text-xs text-muted-foreground">Student Portal</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2 py-3">
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
      <SidebarFooter className="border-t border-border p-4 group-data-[collapsible=icon]:p-2">
        <NavUser
          profileHref="/profile"
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
