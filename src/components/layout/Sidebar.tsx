
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  Shield,
  Users,
  Menu,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

interface SidebarItemProps {
  icon: React.ReactNode;
  title: string;
  path?: string;
  isActive: boolean;
  children?: React.ReactNode;
  isSubmenuOpen?: boolean;
  toggleSubmenu?: () => void;
}

const Sidebar = ({ isOpen, setIsOpen }: SidebarProps) => {
  const location = useLocation();
  const [isAdminOpen, setIsAdminOpen] = useState(
    location.pathname.startsWith("/admin")
  );

  const toggleAdminMenu = () => {
    setIsAdminOpen(!isAdminOpen);
  };

  const isPathActive = (path: string) => location.pathname === path;
  const isPathInSubmenu = (basePath: string) => location.pathname.startsWith(basePath);

  return (
    <>
      {/* Mobile sidebar backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-64 flex-shrink-0 flex-col bg-caseMgmt-surface text-caseMgmt-foreground border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-xl font-semibold">Case Management</span>
          </Link>
          <button
            className="lg:hidden"
            onClick={() => setIsOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col flex-grow overflow-y-auto">
          <nav className="flex-1 px-2 py-4 space-y-1">
            {/* Dashboard */}
            <SidebarItem
              icon={<LayoutDashboard className="h-5 w-5" />}
              title="Dashboard"
              path="/dashboard"
              isActive={isPathActive("/dashboard")}
            />

            {/* Admin section */}
            <div>
              <SidebarItem
                icon={<Shield className="h-5 w-5" />}
                title="Administration"
                isActive={isPathInSubmenu("/admin")}
                isSubmenuOpen={isAdminOpen}
                toggleSubmenu={toggleAdminMenu}
              />

              {isAdminOpen && (
                <div className="ml-6 space-y-1 mt-1">
                  <SidebarItem
                    icon={<Users className="h-4 w-4" />}
                    title="Users"
                    path="/admin/users"
                    isActive={isPathActive("/admin/users")}
                  />
                  <SidebarItem
                    icon={<Shield className="h-4 w-4" />}
                    title="Permissions"
                    path="/admin/permissions"
                    isActive={isPathActive("/admin/permissions")}
                  />
                </div>
              )}
            </div>
          </nav>
        </div>
      </aside>
    </>
  );
};

const SidebarItem = ({
  icon,
  title,
  path,
  isActive,
  children,
  isSubmenuOpen,
  toggleSubmenu,
}: SidebarItemProps) => {
  const CommonContent = (
    <div className="flex items-center">
      <span className="mr-3">{icon}</span>
      <span>{title}</span>
    </div>
  );

  const classes = cn(
    "flex w-full justify-between items-center px-2 py-2 rounded-md transition-colors",
    {
      "bg-caseMgmt-primary text-caseMgmt-primary-foreground": isActive,
      "text-caseMgmt-foreground hover:bg-caseMgmt-muted": !isActive,
    }
  );

  // If it's a submenu toggle
  if (toggleSubmenu) {
    return (
      <button className={classes} onClick={toggleSubmenu}>
        {CommonContent}
        {isSubmenuOpen ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>
    );
  }

  // If it's a link
  if (path) {
    return (
      <Link to={path} className={classes}>
        {CommonContent}
        {children}
      </Link>
    );
  }

  // Default fallback
  return (
    <div className={classes}>
      {CommonContent}
      {children}
    </div>
  );
};

export default Sidebar;
