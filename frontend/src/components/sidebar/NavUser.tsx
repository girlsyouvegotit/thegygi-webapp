import { useMemo } from "react";
import { useNavigate } from "react-router";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { withMediaCacheBust } from "@/lib/profileMedia";

interface NavUserProps {
  user: {
    name: string;
    email: string;
    avatar: string;
    avatarUpdatedAt?: string;
  };
  profileHref: string;
  className?: string;
}

export function NavUser({ user, profileHref, className }: NavUserProps) {
  const navigate = useNavigate();
  const avatarSrc = useMemo(
    () => withMediaCacheBust(user.avatar, user.avatarUpdatedAt),
    [user.avatar, user.avatarUpdatedAt],
  );

  return (
    <button
      type="button"
      onClick={() => navigate(profileHref)}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-muted group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0",
        className,
      )}
      title="Open profile"
    >
      <Avatar className="h-9 w-9 rounded-lg border border-border/80 shadow-sm">
        <AvatarImage src={avatarSrc} alt={user.name} />
        <AvatarFallback className="rounded-lg bg-primary/10 font-bold text-primary">
          {user.name?.charAt(0) || "U"}
        </AvatarFallback>
      </Avatar>
      <div className="grid min-w-0 flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
        <span className="truncate font-medium">{user.name}</span>
        <span className="truncate text-xs text-muted-foreground">
          {user.email}
        </span>
      </div>
    </button>
  );
}
