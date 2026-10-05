import { useState } from "react";
import { Crown, LogOut, ChevronDown } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
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
import { SA_ADMIN_OPS_NAV, SA_COMMAND_NAV } from "@/lib/superAdminNav";
import { LogoutDialog } from "@/components/auth/LogoutDialog";

export const SuperAdminSidebar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile, setOpenMobile } = useSidebar();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [opsOpen, setOpsOpen] = useState(
    location.pathname.startsWith("/super-admin/ops"),
  );
  const testimonialCounts = useTestimonialSidebarCount();

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
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 shadow-sm">
            <Crown className="h-4 w-4 text-amber-300" />
          </div>
          <div className="min-w-0 overflow-hidden transition-[width,opacity] duration-200 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0">
            <p className="truncate font-semibold tracking-tight text-slate-900">
              GYGI
            </p>
            <p className="truncate text-xs text-muted-foreground">
              Super
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        {SA_COMMAND_NAV.map((group) => (
          <SidebarGroup key={group.label} className="p-0 pb-3">
            <SidebarGroupLabel className="px-3 text-[10px] font-bold tracking-wider text-muted-foreground uppercase group-data-[collapsible=icon]:hidden">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {group.items.map((item) => {
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
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        <SidebarGroup className="p-0 pb-3">
          <button
            type="button"
            onClick={() => setOpsOpen((v) => !v)}
            className="mb-1 flex w-full items-center justify-between px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase group-data-[collapsible=icon]:hidden"
          >
            Admin ops (full)
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 transition",
                opsOpen ? "rotate-0" : "-rotate-90",
              )}
            />
          </button>
          {(opsOpen || location.pathname.startsWith("/super-admin/ops")) && (
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {SA_ADMIN_OPS_NAV.map((item) => {
                  const active = navItemIsActive(location.pathname, item.url);
                  const isTestimonials = item.url.includes("/testimonials");
                  const badge = isTestimonials
                    ? testimonialCounts.student
                    : 0;
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        type="button"
                        tooltip={item.title}
                        isActive={active}
                        className={cn(
                          "h-9 px-3 text-[13px]",
                          active ? SIDEBAR_ITEM_ACTIVE : SIDEBAR_ITEM_IDLE,
                        )}
                        onClick={() => handleNavigation(item.url)}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span className="truncate font-medium">{item.title}</span>
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
            </SidebarGroupContent>
          )}
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gap-2 border-t border-border p-3 group-data-[collapsible=icon]:p-2">
        <NavUser
          profileHref="/super-admin/ops/profile"
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
