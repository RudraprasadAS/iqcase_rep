
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LayoutDashboard, FileText, Bell, MessageCircle } from 'lucide-react';

const CitizenSidebar = () => {
  const navigation = [
    { name: 'Dashboard', href: '/citizen/dashboard', icon: LayoutDashboard },
    { name: 'My Cases', href: '/citizen/cases', icon: FileText },
    { name: 'Notifications', href: '/citizen/notifications', icon: Bell },
    { name: 'Knowledge Base', href: '/knowledge', icon: MessageCircle },
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
        </nav>
      </div>
    </div>
  );
};

export default CitizenSidebar;
