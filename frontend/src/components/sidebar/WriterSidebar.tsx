import { useState } from "react";
import {
  LayoutDashboard,
  FileText,
  PenLine,
  BookOpen,
  CircleUser,
  LogOut,
  ExternalLink,
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
} from "@/lib/sidebarStyles";
import { LogoutDialog } from "@/components/auth/LogoutDialog";

const navItems = [
  { title: "Dashboard", url: "/writer/dashboard", icon: LayoutDashboard },
  { title: "All posts", url: "/writer/posts", icon: FileText },
  { title: "New post", url: "/writer/posts/new", icon: PenLine },
  { title: "About page", url: "/writer/about", icon: BookOpen },
  { title: "Profile", url: "/writer/profile", icon: CircleUser },
] as const;

export const WriterSidebar = () => {
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

  const isActive = (url: string) => {
    if (url === "/writer/posts/new")
      return location.pathname === "/writer/posts/new";
    if (url === "/writer/posts")
      return (
        location.pathname === "/writer/posts" ||
        (/^\/writer\/posts\/[^/]+/.test(location.pathname) &&
          location.pathname !== "/writer/posts/new")
      );
    return (
      location.pathname === url || location.pathname.startsWith(`${url}/`)
    );
  };

  return (
    <Sidebar
      variant="floating"
      collapsible="icon"
      className={FLOATING_SIDEBAR_CLASS}
    >
      <SidebarHeader className="p-4 group-data-[collapsible=icon]:p-2">
        <div className="flex min-w-0 items-center gap-2.5 group-data-[collapsible=icon]:justify-center">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary shadow-sm shadow-primary/25">
            <PenLine className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="min-w-0 overflow-hidden transition-[width,opacity] duration-200 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0">
            <p className="truncate text-base font-bold tracking-tight text-[#1E1B4B]">
              GYGI
            </p>
            <p className="truncate text-xs text-muted-foreground">
              Writer Portal
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-2">
        <SidebarMenu className="gap-1">
          {navItems.map((item) => {
            const active = isActive(item.url);
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
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="View public blog"
              className="h-10 rounded-xl px-3 text-slate-600 hover:bg-slate-100 hover:text-[#1E1B4B]"
              onClick={() => window.open("/blog", "_blank")}
            >
              <div className="flex min-w-0 items-center gap-3">
                <ExternalLink className="h-4 w-4 shrink-0" />
                <span className="truncate font-medium">Public blog</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <div className="mx-1 mt-auto rounded-2xl bg-gradient-to-br from-primary to-[#8B2BB8] p-4 text-white shadow-lg shadow-primary/25 group-data-[collapsible=icon]:hidden">
          <p className="text-sm font-bold">Keep the Journal live</p>
          <p className="mt-1 text-[11px] leading-relaxed text-white/80">
            Publish stories and refresh About so the public site stays current.
          </p>
          <button
            type="button"
            onClick={() => handleNavigation("/writer/posts/new")}
            className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-white/95 px-3 py-2 text-xs font-bold text-primary transition hover:bg-white"
          >
            Write a post
          </button>
        </div>
      </SidebarContent>

      <SidebarFooter className="gap-2 border-t border-border p-3 group-data-[collapsible=icon]:p-2">
        <NavUser
          profileHref="/writer/profile"
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
