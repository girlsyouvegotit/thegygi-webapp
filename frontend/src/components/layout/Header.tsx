import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { useNotification } from "@/hooks/useNotification";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { NotificationToastStack } from "@/components/notifications/NotificationToast";
import { WorkspaceSearch } from "@/components/layout/WorkspaceSearch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuthContext";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import {
  profilePathForRole,
  withMediaCacheBust,
} from "@/lib/profileMedia";
import { navPathForRole } from "@/lib/roleHome";
import { useNavigate } from "react-router";
import { useCallback, useMemo } from "react";
import { useOfficialChatOptional } from "@/hooks/OfficialChatProvider";
import {
  isOfficialChatNotification,
  officialChatArgsFromNotification,
} from "@/lib/officialChat";
import { isGetInvolvedInquiryNotification } from "@/lib/getInvolvedReply";
import { useGetInvolvedReplyOptional } from "@/hooks/GetInvolvedReplyProvider";

function isCommunityChatNotification(n: {
  type?: string;
  metadata?: Record<string, unknown> | null;
}): boolean {
  if (n.type !== "community_mention") return false;
  const meta = n.metadata || {};
  return Boolean(meta.openCommunityChat || meta.channelId || meta.openDm);
}

function communityChatPath(n: {
  metadata?: Record<string, unknown> | null;
}): string {
  const meta = n.metadata || {};
  const channelId =
    typeof meta.channelId === "string" ? meta.channelId : undefined;
  return channelId ? `/community?channel=${channelId}` : "/community";
}

export const Header = () => {
  const { toggleSidebar } = useSidebar();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { unreadCount, toasts, dismissToast, markAsRead } = useNotification();
  const officialChat = useOfficialChatOptional();
  const getInvolvedReply = useGetInvolvedReplyOptional();

  const avatarSrc = useMemo(
    () => withMediaCacheBust(user?.avatar, user?.avatarUpdatedAt),
    [user?.avatar, user?.avatarUpdatedAt],
  );

  const handleToastOpen = useCallback(
    (n: (typeof toasts)[number]) => {
      dismissToast(n.toastId);
      if (!n.isRead) void markAsRead(n._id);

      if (
        isGetInvolvedInquiryNotification(n) &&
        getInvolvedReply?.openGetInvolvedReply(n)
      ) {
        return;
      }

      if (isOfficialChatNotification(n) && officialChat) {
        const args = officialChatArgsFromNotification(n);
        if (args) {
          officialChat.openOfficialChat(args);
          return;
        }
      }

      if (isCommunityChatNotification(n)) {
        navigate(navPathForRole(user?.role, communityChatPath(n)));
        return;
      }

      if (n.link) navigate(navPathForRole(user?.role, n.link));
    },
    [
      dismissToast,
      markAsRead,
      navigate,
      officialChat,
      getInvolvedReply,
      user?.role,
    ],
  );

  return (
    <>
      <header className="sticky top-0 z-30 mx-3 mt-3 flex h-14 items-center gap-2 rounded-2xl border border-border bg-background px-3 shadow-md sm:mx-5 sm:gap-4 sm:px-4 lg:mx-7">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="shrink-0 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
          aria-label="Toggle navigation"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <WorkspaceSearch className="max-w-none sm:max-w-md lg:max-w-lg" />

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
          <NotificationBell unreadCount={unreadCount} />
          <button
            type="button"
            onClick={() => navigate(profilePathForRole(user?.role))}
            className="rounded-full ring-offset-background transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            aria-label="Open your profile"
            title="Your profile"
          >
            <Avatar className="h-9 w-9 border border-border shadow-sm">
              <AvatarImage src={avatarSrc} alt={user?.name || "Profile"} />
              <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
          </button>
        </div>
      </header>

      <NotificationToastStack
        toasts={toasts}
        onDismiss={dismissToast}
        onOpen={handleToastOpen}
      />
    </>
  );
};

export default Header;
