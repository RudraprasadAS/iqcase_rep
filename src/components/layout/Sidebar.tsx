
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  BarChart3,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Users2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";

interface SidebarProps {
  className?: string;
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
}

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isCollapsed: boolean;
}

const NavItem = ({ to, icon, label, isCollapsed }: NavItemProps) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "justify-start px-2 py-1.5 text-sm font-medium hover:bg-secondary",
              isActive ? "bg-secondary" : "transparent",
              isCollapsed ? "justify-center" : "justify-start"
            )}
            asChild
          >
            <Link to={to}>
              <div className="flex items-center gap-2">
                {icon}
                {!isCollapsed && <span>{label}</span>}
              </div>
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent className="bg-popover text-popover-foreground">
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const Sidebar = ({ className, isOpen, setIsOpen }: SidebarProps) => {
  const isMobile = useIsMobile();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    if (setIsOpen) {
      setIsOpen(!isCollapsed);
    }
  };

  return (
    <aside
      className={cn(
        "flex flex-col border-r bg-background",
        isCollapsed ? "w-[72px]" : "w-[240px]",
        className
      )}
    >
      <div className="flex-1 space-y-4 p-2">
        <div className="flex items-center justify-between pl-3 pr-2">
          <Link to="/dashboard" className="flex items-center gap-2 font-semibold">
            <BarChart3 />
            {!isCollapsed && <span>Case Management</span>}
          </Link>
          {isMobile && (
            <Button
              variant="outline"
              size="icon"
              onClick={toggleCollapse}
              className="h-8 w-8 rounded-md"
            >
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </div>

        <nav className="grid gap-1 px-2">
          <NavItem
            to="/dashboard"
            icon={<LayoutDashboard size={20} />}
            label="Dashboard"
            isCollapsed={isCollapsed}
          />
          <NavItem
            to="/admin/permissions"
            icon={<ShieldCheck size={20} />}
            label="Permissions"
            isCollapsed={isCollapsed}
          />
          <NavItem
            to="/admin/users"
            icon={<Users2 size={20} />}
            label="Users"
            isCollapsed={isCollapsed}
          />
          <NavItem
            to="/settings"
            icon={<Settings size={20} />}
            label="Settings"
            isCollapsed={isCollapsed}
          />
        </nav>
      </div>

      <div className="flex items-center justify-center py-3">
        {!isCollapsed && (
          <Button variant="outline" size="sm" onClick={toggleCollapse}>
            Collapse
          </Button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
