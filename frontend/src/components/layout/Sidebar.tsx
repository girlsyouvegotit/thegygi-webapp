import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";

interface SidebarProps {
  children: React.ReactNode;
  className?: string;
}

const Sidebar = ({ children, className }: SidebarProps) => {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-20 h-full bg-background border-r transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
        className,
      )}
    >
      {children}
    </aside>
  );
};

export default Sidebar;
