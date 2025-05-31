
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Users, 
  Settings, 
  FileText, 
  BarChart3, 
  Shield, 
  ChevronLeft, 
  ChevronRight,
  Plus,
  BookOpen,
  Calendar,
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  const navigationItems = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: Home,
    },
    {
      title: 'Cases',
      href: '/cases',
      icon: FileText,
    },
    {
      title: 'Knowledge Base',
      href: '/knowledge',
      icon: BookOpen,
    },
    {
      title: 'Reports',
      href: '/reports',
      icon: BarChart3,
    }
  ];

  const quickActions = [
    {
      title: 'New Case',
      href: '/cases/new',
      icon: Plus,
    }
  ];

  const adminItems = [
    {
      title: 'Users',
      href: '/admin/users',
      icon: Users,
    },
    {
      title: 'Permissions',
      href: '/admin/permissions',
      icon: Shield,
    }
  ];

  return (
    <div className={cn(
      "bg-white border-r border-gray-200 flex flex-col transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        {!isCollapsed && (
          <h1 className="text-xl font-bold text-gray-900">IQCase</h1>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-b border-gray-200">
        {!isCollapsed && (
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Quick Actions</h2>
        )}
        <div className="space-y-1">
          {quickActions.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-blue-100 text-blue-700" 
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                  isCollapsed && "justify-center"
                )}
              >
                <Icon className={cn("h-4 w-4", !isCollapsed && "mr-3")} />
                {!isCollapsed && item.title}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 p-4">
        {!isCollapsed && (
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Navigation</h2>
        )}
        <nav className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.href);
            
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-blue-100 text-blue-700" 
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                  isCollapsed && "justify-center"
                )}
              >
                <Icon className={cn("h-4 w-4", !isCollapsed && "mr-3")} />
                {!isCollapsed && item.title}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Admin Section */}
      <div className="p-4 border-t border-gray-200">
        {!isCollapsed && (
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Administration</h2>
        )}
        <nav className="space-y-1">
          {adminItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-blue-100 text-blue-700" 
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                  isCollapsed && "justify-center"
                )}
              >
                <Icon className={cn("h-4 w-4", !isCollapsed && "mr-3")} />
                {!isCollapsed && item.title}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
