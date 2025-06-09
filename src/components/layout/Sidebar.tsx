
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import {
  LayoutDashboard,
  FileText,
  Plus,
  Bell,
  BookOpen,
  BarChart3,
  Settings,
  Users,
  Shield,
  UserCog,
  ChevronDown,
  ChevronRight,
  PieChart,
  TrendingUp
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const { hasAdminAccess, userInfo } = useRoleAccess();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    reports: true,
    admin: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      current: location.pathname === '/dashboard'
    },
    {
      name: 'Cases',
      href: '/cases',
      icon: FileText,
      current: location.pathname.startsWith('/cases')
    },
    {
      name: 'New Case',
      href: '/cases/new',
      icon: Plus,
      current: location.pathname === '/cases/new'
    },
    {
      name: 'Notifications',
      href: '/notifications',
      icon: Bell,
      current: location.pathname === '/notifications'
    },
    {
      name: 'Knowledge Base',
      href: '/knowledge',
      icon: BookOpen,
      current: location.pathname === '/knowledge'
    }
  ];

  const reportsSection = {
    name: 'Reports & Analytics',
    icon: BarChart3,
    expanded: expandedSections.reports,
    items: [
      {
        name: 'My Reports',
        href: '/reports',
        icon: FileText,
        current: location.pathname === '/reports'
      },
      {
        name: 'Report Builder',
        href: '/reports/builder',
        icon: Plus,
        current: location.pathname.startsWith('/reports/builder')
      },
      {
        name: 'Dashboards',
        href: '/reports/dashboards',
        icon: PieChart,
        current: location.pathname === '/reports/dashboards'
      },
      {
        name: 'Standard Reports',
        href: '/reports/standard',
        icon: BarChart3,
        current: location.pathname === '/reports/standard'
      },
      {
        name: 'Insights',
        href: '/insights',
        icon: TrendingUp,
        current: location.pathname === '/insights'
      }
    ]
  };

  const adminSection = hasAdminAccess ? {
    name: 'Administration',
    icon: Settings,
    expanded: expandedSections.admin,
    items: [
      {
        name: 'Users',
        href: '/admin/users',
        icon: Users,
        current: location.pathname === '/admin/users'
      },
      {
        name: 'Roles',
        href: '/admin/roles',
        icon: UserCog,
        current: location.pathname === '/admin/roles'
      },
      {
        name: 'Permissions',
        href: '/admin/permissions',
        icon: Shield,
        current: location.pathname === '/admin/permissions'
      }
    ]
  } : null;

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r border-gray-200">
      <div className="flex h-16 items-center justify-center border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">CaseFlow</h1>
      </div>
      
      <nav className="flex-1 space-y-1 bg-white px-2 py-4">
        {/* Main navigation */}
        {navigation.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            className={cn(
              item.current
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
            )}
          >
            <item.icon
              className={cn(
                item.current ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500',
                'mr-3 h-5 w-5 flex-shrink-0'
              )}
            />
            {item.name}
          </Link>
        ))}

        {/* Reports Section */}
        <div className="pt-4">
          <button
            onClick={() => toggleSection('reports')}
            className={cn(
              'w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            )}
          >
            <reportsSection.icon className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-500" />
            {reportsSection.name}
            {reportsSection.expanded ? (
              <ChevronDown className="ml-auto h-4 w-4" />
            ) : (
              <ChevronRight className="ml-auto h-4 w-4" />
            )}
          </button>
          
          {reportsSection.expanded && (
            <div className="ml-4 space-y-1">
              {reportsSection.items.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    item.current
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                  )}
                >
                  <item.icon
                    className={cn(
                      item.current ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500',
                      'mr-3 h-4 w-4 flex-shrink-0'
                    )}
                  />
                  {item.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Admin Section */}
        {adminSection && (
          <div className="pt-4">
            <button
              onClick={() => toggleSection('admin')}
              className={cn(
                'w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <adminSection.icon className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-500" />
              {adminSection.name}
              {adminSection.expanded ? (
                <ChevronDown className="ml-auto h-4 w-4" />
              ) : (
                <ChevronRight className="ml-auto h-4 w-4" />
              )}
            </button>
            
            {adminSection.expanded && (
              <div className="ml-4 space-y-1">
                {adminSection.items.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      item.current
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                      'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                    )}
                  >
                    <item.icon
                      className={cn(
                        item.current ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500',
                        'mr-3 h-4 w-4 flex-shrink-0'
                      )}
                    />
                    {item.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* User info at bottom */}
        {userInfo && (
          <div className="pt-4 mt-auto border-t border-gray-200">
            <div className="px-2 py-2">
              <p className="text-xs text-gray-500">Logged in as:</p>
              <p className="text-sm font-medium text-gray-900 truncate">{userInfo.name}</p>
              <p className="text-xs text-gray-500 capitalize">{userInfo.role?.name}</p>
            </div>
          </div>
        )}
      </nav>
    </div>
  );
};

export default Sidebar;
