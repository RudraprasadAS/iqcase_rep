
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Home,
  FileText,
  Users,
  Settings,
  BarChart,
  MessageSquare,
  FolderClosed,
  CalendarCheck,
  ShieldCheck,
} from "lucide-react";
import { NavLink } from "react-router-dom";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const Sidebar = ({ isOpen, setIsOpen }: SidebarProps) => {
  return (
    <div
      className={cn(
        "bg-white border-r border-caseMgmt-border h-screen transition-all duration-300 overflow-hidden",
        isOpen ? "w-64" : "w-16"
      )}
    >
      <div className="flex flex-col h-full">
        <div className={cn("h-16 p-4", isOpen ? "justify-between" : "justify-center", "flex items-center")}>
          {isOpen && <h1 className="font-semibold text-caseMgmt-primary text-lg">CaseManager</h1>}
        </div>

        <ScrollArea className="flex-1">
          <div className="px-2 py-2">
            <nav className="space-y-1">
              <NavItem icon={Home} to="/dashboard" label="Dashboard" isOpen={isOpen} />
              <NavItem icon={FileText} to="/cases" label="Cases" isOpen={isOpen} />
              <NavItem icon={Users} to="/users" label="Users" isOpen={isOpen} />
              <NavItem icon={FolderClosed} to="/categories" label="Categories" isOpen={isOpen} />
              <NavItem icon={MessageSquare} to="/messages" label="Messages" isOpen={isOpen} />
              <NavItem icon={CalendarCheck} to="/deadlines" label="Deadlines" isOpen={isOpen} />
              <NavItem icon={BarChart} to="/reports" label="Reports" isOpen={isOpen} />
              
              {/* Admin section with Roles and Permissions */}
              {isOpen && <div className="pt-4 pb-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Admin</div>}
              <NavItem icon={ShieldCheck} to="/admin/roles" label="Roles" isOpen={isOpen} />
              <NavItem icon={ShieldCheck} to="/admin/permissions" label="Permissions" isOpen={isOpen} />
              
              <Separator className="my-4" />
              
              <NavItem icon={Settings} to="/settings" label="Settings" isOpen={isOpen} />
            </nav>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

interface NavItemProps {
  icon: React.ElementType;
  to: string;
  label: string;
  isOpen: boolean;
}

const NavItem = ({ icon: Icon, to, label, isOpen }: NavItemProps) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex items-center py-2 px-3 rounded-md transition-colors",
          isActive
            ? "bg-caseMgmt-primary text-white"
            : "hover:bg-gray-100 text-gray-700"
        )
      }
    >
      <Icon className="w-5 h-5" />
      {isOpen && <span className="ml-3">{label}</span>}
    </NavLink>
  );
};

export default Sidebar;
