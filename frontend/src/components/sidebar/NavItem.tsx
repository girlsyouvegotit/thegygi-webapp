import { Link } from "react-router";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface NavItemProps {
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  isCollapsed?: boolean;
  onClick?: () => void;
}

export const NavItem = ({
  title,
  url,
  icon: Icon,
  isActive,
  isCollapsed,
  onClick,
}: NavItemProps) => {
  return (
    <Link
      to={url}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        isCollapsed && "justify-center px-2",
      )}
      title={isCollapsed ? title : undefined}
    >
      {Icon && <Icon className="h-5 w-5 shrink-0" />}
      {!isCollapsed && <span className="truncate">{title}</span>}
    </Link>
  );
};
