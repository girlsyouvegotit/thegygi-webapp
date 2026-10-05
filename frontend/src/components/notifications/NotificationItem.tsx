import { useNotification } from "@/hooks/useNotification";
import { useAuth } from "@/hooks/useAuthContext";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import type { notification } from "@/types";
import { useNavigate } from "react-router";
import { getNotificationVisual } from "./notificationVisuals";
import { useOfficialChatOptional } from "@/hooks/OfficialChatProvider";
import {
  isOfficialChatNotification,
  officialChatArgsFromNotification,
} from "@/lib/officialChat";
import { navPathForRole } from "@/lib/roleHome";
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

interface NotificationItemProps {
  notification: notification;
  onNavigate?: () => void;
}

export const NotificationItem = ({
  notification,
  onNavigate,
}: NotificationItemProps) => {
  const { markAsRead } = useNotification();
  const { user } = useAuth();
  const navigate = useNavigate();
  const officialChat = useOfficialChatOptional();
  const getInvolvedReply = useGetInvolvedReplyOptional();
  const visual = getNotificationVisual(notification.type);
  const Icon = visual.icon;

  const handleClick = () => {
    if (!notification.isRead) {
      void markAsRead(notification._id);
    }
    onNavigate?.();

    if (isGetInvolvedInquiryNotification(notification)) {
      if (getInvolvedReply?.openGetInvolvedReply(notification)) return;
    }

    if (isOfficialChatNotification(notification) && officialChat) {
      const args = officialChatArgsFromNotification(notification);
      if (args) {
        officialChat.openOfficialChat(args);
        return;
      }
    }

    if (isCommunityChatNotification(notification)) {
      navigate(navPathForRole(user?.role, communityChatPath(notification)));
      return;
    }

    if (notification.link) {
      navigate(navPathForRole(user?.role, notification.link));
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "group flex w-full gap-3 rounded-2xl border border-transparent p-3 text-left transition",
        visual.surface,
        !notification.isRead && "border-border/60 shadow-sm",
        "hover:bg-white/80 hover:shadow-sm",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          visual.iconChip,
        )}
      >
        <Icon className="h-4 w-4" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="mb-1 flex items-center gap-2">
          <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-bold tracking-wide text-slate-600 uppercase">
            {visual.label}
          </span>
          {!notification.isRead ? (
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          ) : null}
          <span className="ml-auto shrink-0 text-[10px] font-medium text-slate-400">
            {formatDistanceToNow(new Date(notification.createdAt), {
              addSuffix: true,
            })}
          </span>
        </span>
        <span
          className={cn(
            "block text-sm leading-snug text-slate-900",
            !notification.isRead ? "font-bold" : "font-semibold",
          )}
        >
          {notification.title}
        </span>
        <span className="mt-0.5 line-clamp-2 text-xs leading-snug text-slate-500">
          {notification.message}
        </span>
      </span>
    </button>
  );
};
