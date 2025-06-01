
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Home,
  FileText,
  Plus,
  MessageSquare,
  User,
  Bell
} from "lucide-react";
import { NavLink } from "react-router-dom";

const CitizenSidebar = () => {
  const isOpen = true;

  return (
    <div
      className={cn(
        "bg-white border-r border-gray-200 h-screen transition-all duration-300 overflow-hidden",
        isOpen ? "w-64" : "w-16"
      )}
    >
      <div className="flex flex-col h-full">
        <div className={cn("h-16 p-4", isOpen ? "justify-between" : "justify-center", "flex items-center")}>
          {isOpen && <h1 className="font-semibold text-blue-600 text-lg">Citizen Portal</h1>}
        </div>

        <ScrollArea className="flex-1">
          <div className="px-2 py-2">
            <nav className="space-y-1">
              <NavItem icon={Home} to="/citizen/dashboard" label="Dashboard" isOpen={isOpen} />
              <NavItem icon={FileText} to="/citizen/cases" label="My Cases" isOpen={isOpen} />
              <NavItem icon={Plus} to="/citizen/cases/new" label="Submit New Case" isOpen={isOpen} />
              <NavItem icon={MessageSquare} to="/citizen/messages" label="Messages" isOpen={isOpen} />
              <NavItem icon={Bell} to="/citizen/notifications" label="Notifications" isOpen={isOpen} />
              <NavItem icon={User} to="/citizen/profile" label="Profile" isOpen={isOpen} />
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
            ? "bg-blue-600 text-white"
            : "hover:bg-gray-100 text-gray-700"
        )
      }
    >
      <Icon className="w-5 h-5" />
      {isOpen && <span className="ml-3">{label}</span>}
    </NavLink>
  );
};

export default CitizenSidebar;
