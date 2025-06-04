import {
  Home,
  FileText,
  BarChart3,
  TrendingUp,
  BookOpen,
  Bell,
  Users,
  Shield,
  Lock,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';

export const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: FileText, label: 'Cases', path: '/cases' },
    { icon: BarChart3, label: 'Reports', path: '/reports' },
    { icon: TrendingUp, label: 'Insights', path: '/insights' },
    { icon: BookOpen, label: 'Knowledge Base', path: '/knowledge' },
    { icon: Bell, label: 'Notifications', path: '/notifications' },
  ];

  const adminItems = [
    { icon: Users, label: 'Users', path: '/admin/users' },
    { icon: Shield, label: 'Roles', path: '/admin/roles' },
    { icon: Lock, label: 'Permissions', path: '/admin/permissions' },
  ];

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  // Helper to check if user is admin (assuming admin role has specific ID)
  const isAdmin = user && user.email?.includes('admin'); // Temporary check

  return (
    <div className="flex flex-col h-full bg-gray-100 border-r py-4 w-60">
      <div className="px-4 mb-4">
        <Button variant="ghost" className="w-full justify-start font-normal" onClick={() => navigate('/')}>
          <Home className="mr-2 h-4 w-4" />
          Go to Homepage
        </Button>
      </div>
      <Separator />
      <div className="flex-grow p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.label}>
              <Button
                variant="ghost"
                className={`w-full justify-start font-normal ${isActive(item.path) ? 'text-blue-600' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            </li>
          ))}
        </ul>
        {isAdmin && (
          <>
            <Separator className="my-4" />
            <ul className="space-y-2">
              {adminItems.map((item) => (
                <li key={item.label}>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start font-normal ${isActive(item.path) ? 'text-blue-600' : ''}`}
                    onClick={() => navigate(item.path)}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
      <Separator />
      <div className="p-4">
        <Button variant="outline" className="w-full" onClick={() => logout()}>
          Logout
        </Button>
      </div>
    </div>
  );
};
