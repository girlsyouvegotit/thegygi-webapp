import { useState } from "react";
import {
  LayoutDashboard,
  FolderTree,
  Users,
  HeartHandshake,
  PlayCircle,
  TrendingUp,
  GraduationCap,
  Banknote,
  Activity,
  Settings,
  CircleUser,
  LogOut,
  MessageCircle,
  Briefcase,
  ArrowLeftRight,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
  useSidebar,
} from "@/components/ui/sidebar";
import { useTestimonialSidebarCount } from "@/hooks/useTestimonialSidebarCount";
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
  { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Categories", url: "/admin/categories", icon: FolderTree },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Mentorship", url: "/admin/mentorship", icon: HeartHandshake },
  { title: "Recordings", url: "/admin/recordings", icon: PlayCircle },
  { title: "Analytics", url: "/admin/analytics", icon: TrendingUp },
  {
    title: "Student Performance",
    url: "/admin/student-performance",
    icon: GraduationCap,
  },
  { title: "Finance", url: "/admin/finance", icon: Banknote },
  {
    title: "Testimonials",
    url: "/admin/testimonials",
    icon: MessageCircle,
  },
  {
    title: "Alumni Ops",
    url: "/admin/alumni-ops",
    icon: Briefcase,
  },
  {
    title: "Category Changes",
    url: "/admin/category-changes",
    icon: ArrowLeftRight,
  },
  { title: "Activity Logs", url: "/admin/activity-logs", icon: Activity },
  { title: "Settings", url: "/admin/settings", icon: Settings },
  { title: "Profile", url: "/admin/profile", icon: CircleUser },
];

export const AdminSidebar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile, setOpenMobile } = useSidebar();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const testimonialCounts = useTestimonialSidebarCount();

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
      <SidebarHeader className="border-b border-border p-4 group-data-[collapsible=icon]:p-2">
        <div className="flex min-w-0 items-center gap-2 group-data-[collapsible=icon]:justify-center">
          <img
            src="/gygiLogo.jpg"
            alt="GYGI"
            className="h-8 w-8 shrink-0 rounded-lg object-cover shadow-sm ring-1 ring-black/5"
          />
          <div className="min-w-0 overflow-hidden transition-[width,opacity] duration-200 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0">
            <p className="font-semibold">GYGI</p>
            <p className="text-xs text-muted-foreground">Admin Portal</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2 py-3">
        <SidebarMenu className="gap-1">
          {navItems.map((item) => {
            const isTestimonials = item.url === "/admin/testimonials";
            const badge = isTestimonials ? testimonialCounts.student : 0;
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
                {badge > 0 ? (
                  <SidebarMenuBadge className="rounded-full bg-primary text-[10px] font-bold text-white peer-hover/menu-button:text-white peer-data-[active=true]/menu-button:text-white">
                    {badge > 99 ? "99+" : badge}
                  </SidebarMenuBadge>
                ) : null}
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="border-t border-border p-4 group-data-[collapsible=icon]:p-2">
        <NavUser
          profileHref="/admin/profile"
          user={{
            name: user?.name || "",
            email: user?.email || "",
            avatar: user?.avatar || "",
            avatarUpdatedAt: user?.avatarUpdatedAt,
          }}
        />
        <button
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
