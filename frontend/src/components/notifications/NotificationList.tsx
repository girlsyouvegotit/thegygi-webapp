import { Link } from "react-router";
import { useNotification } from "@/hooks/useNotification";
import { useAuth } from "@/hooks/useAuthContext";
import { NotificationItem } from "./NotificationItem";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck } from "lucide-react";

interface NotificationListProps {
  titleId?: string;
  onItemNavigate?: () => void;
}

export const NotificationList = ({
  titleId,
  onItemNavigate,
}: NotificationListProps) => {
  const { user } = useAuth();
  const { notifications, unreadCount, markAllAsRead } = useNotification();
  const signedIn = Boolean(user?._id);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Bell className="h-4 w-4" />
          </span>
          <div>
            <h4
              id={titleId}
              className="text-sm font-bold tracking-tight text-slate-900"
            >
              Notifications
            </h4>
            <p className="text-[11px] font-medium text-slate-400">
              {!signedIn
                ? "Sign in to stay updated"
                : unreadCount > 0
                  ? `${unreadCount} unread`
                  : "You're all caught up"}
            </p>
          </div>
        </div>
        {signedIn && unreadCount > 0 ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 rounded-full px-2.5 text-xs font-semibold text-primary hover:bg-primary/10 hover:text-primary"
            onClick={() => void markAllAsRead()}
          >
            <CheckCheck className="mr-1 h-3.5 w-3.5" />
            Mark all
          </Button>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {!signedIn ? (
          <div className="px-4 py-14 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50">
              <Bell className="h-5 w-5 text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-600">
              Sign in for notifications
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Story updates and account alerts appear here
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <Button asChild size="sm" className="rounded-full px-4">
                <Link to="/login" onClick={onItemNavigate}>
                  Sign in
                </Link>
              </Button>
              <Button
                asChild
                size="sm"
                variant="outline"
                className="rounded-full px-4"
              >
                <Link to="/register" onClick={onItemNavigate}>
                  Join
                </Link>
              </Button>
            </div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-14 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50">
              <Bell className="h-5 w-5 text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-600">
              No notifications yet
            </p>
            <p className="mt-1 text-xs text-slate-400">
              New updates will show up here
            </p>
          </div>
        ) : (
          <div className="space-y-2 p-3 pb-4">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification._id}
                notification={notification}
                onNavigate={onItemNavigate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
