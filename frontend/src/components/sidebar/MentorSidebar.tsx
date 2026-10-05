import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Target,
  MessageSquare,
  HeartHandshake,
  StickyNote,
  CircleUser,
  LogOut,
  Briefcase,
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
  { title: "Dashboard", url: "/mentor/dashboard", icon: LayoutDashboard },
  { title: "My Mentees", url: "/mentor/mentees", icon: Users },
  { title: "Sessions", url: "/mentor/sessions", icon: Calendar },
  { title: "Goals", url: "/mentor/goals", icon: Target },
  { title: "Feedback", url: "/mentor/feedback", icon: MessageSquare },
  { title: "Portfolio Reviews", url: "/mentor/portfolio-reviews", icon: Briefcase },
  { title: "Notes", url: "/mentor/notes", icon: StickyNote },
  { title: "Profile", url: "/mentor/profile", icon: CircleUser },
];

export const MentorSidebar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile, setOpenMobile } = useSidebar();
  const [logoutOpen, setLogoutOpen] = useState(false);

  const handleNavigation = (url: string) => {
    navigate(url);
    if (isMobile) setOpenMobile(false);
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
        <div className="flex min-w-0 items-center gap-2.5 group-data-[collapsible=icon]:justify-center">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary shadow-sm shadow-primary/25">
            <HeartHandshake className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="min-w-0 overflow-hidden transition-[width,opacity] duration-200 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0">
            <p className="truncate font-semibold tracking-tight text-slate-900">
              GYGI
            </p>
            <p className="truncate text-xs text-muted-foreground">
              Mentor Portal
            </p>
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
                  <span className="truncate font-medium">{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="gap-2 border-t border-border p-3 group-data-[collapsible=icon]:p-2">
        <NavUser
          profileHref="/mentor/profile"
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
          className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-sm text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
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
