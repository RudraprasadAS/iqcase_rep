
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  BarChart3, 
  Settings, 
  BookOpen,
  Bell,
  ChevronDown,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const Sidebar = () => {
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Cases', href: '/cases', icon: FileText },
    { name: 'Knowledge Base', href: '/knowledge', icon: BookOpen },
    { name: 'Notifications', href: '/notifications', icon: Bell },
  ];

  const reportNavigation = [
    { name: 'Standard Reports', href: '/reports/standard' },
    { name: 'Report Builder', href: '/reports/builder' },
    { name: 'Table Builder', href: '/reports/table-builder' },
  ];

  const adminNavigation = [
    { name: 'Users', href: '/admin/users' },
    { name: 'Permissions', href: '/admin/permissions' },
  ];

  return (
    <div className="flex flex-col w-64 bg-gray-50 border-r border-gray-200 h-full">
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <nav className="mt-5 flex-1 px-2 bg-gray-50 space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'group flex items-center px-2 py-2 text-sm font-medium rounded-md',
                  isActive
                    ? 'bg-blue-100 text-blue-900'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )
              }
            >
              <item.icon
                className="mr-3 flex-shrink-0 h-6 w-6"
                aria-hidden="true"
              />
              {item.name}
            </NavLink>
          ))}

          {/* Reports Section */}
          <Collapsible open={isReportsOpen} onOpenChange={setIsReportsOpen}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full justify-start px-2 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              >
                <BarChart3 className="mr-3 h-6 w-6" />
                Reports
                <ChevronDown className={cn("ml-auto h-4 w-4 transition-transform", isReportsOpen && "rotate-180")} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="ml-6 space-y-1">
              {reportNavigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    cn(
                      'block px-2 py-2 text-sm font-medium rounded-md',
                      isActive
                        ? 'bg-blue-100 text-blue-900'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    )
                  }
                >
                  {item.name}
                </NavLink>
              ))}
            </CollapsibleContent>
          </Collapsible>

          {/* Admin Section */}
          <Collapsible open={isAdminOpen} onOpenChange={setIsAdminOpen}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full justify-start px-2 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              >
                <Shield className="mr-3 h-6 w-6" />
                Admin
                <ChevronDown className={cn("ml-auto h-4 w-4 transition-transform", isAdminOpen && "rotate-180")} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="ml-6 space-y-1">
              {adminNavigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    cn(
                      'block px-2 py-2 text-sm font-medium rounded-md',
                      isActive
                        ? 'bg-blue-100 text-blue-900'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    )
                  }
                >
                  {item.name}
                </NavLink>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
