
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  FileText, 
  BarChart3, 
  Settings, 
  BookOpen,
  Bell,
  Shield,
  ChevronDown,
  TrendingUp
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { usePermissionCheck } from '@/hooks/usePermissionCheck';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Cases', href: '/cases', icon: FileText },
  { name: 'Knowledge Base', href: '/knowledge', icon: BookOpen },
  { name: 'Notifications', href: '/notifications', icon: Bell },
  { name: 'Insights', href: '/insights', icon: TrendingUp },
];

const reportNavigation = [
  { name: 'Reports', href: '/reports' },
  { name: 'Report Builder', href: '/reports/builder' },
  { name: 'Dashboards', href: '/dashboards' },
];

const adminNavigation = [
  { name: 'Users', href: '/admin/users' },
  { name: 'Permissions', href: '/admin/permissions' },
  { name: 'Roles', href: '/admin/roles' },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { isInternal, roleName } = useRoleAccess();
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  
  // Check permissions for Analytics and Admin sections
  const { hasPermission: canAccessReports } = usePermissionCheck('reports', null, 'view');
  const { hasPermission: canAccessUsers } = usePermissionCheck('users', null, 'view');
  const { hasPermission: canAccessPermissions } = usePermissionCheck('permissions', null, 'view');
  
  // For backward compatibility, also check role-based access
  const hasAnalyticsAccess = canAccessReports || ['admin', 'manager', 'analyst'].includes(roleName || '');
  const hasAdminAccess = (canAccessUsers || canAccessPermissions) || roleName === 'admin';
  
  console.log('[AppSidebar] Access checks:', {
    roleName,
    canAccessReports,
    canAccessUsers,
    canAccessPermissions,
    hasAnalyticsAccess,
    hasAdminAccess,
    isInternal
  });
  
  // Don't show anything if user is not internal
  if (!isInternal) {
    return null;
  }
  
  return (
    <Sidebar collapsible="icon" className="font-inter">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1">
          {state === "expanded" ? (
            <img 
              src="/lovable-uploads/ee388e32-d054-4367-b2ac-0dd3512cb8fd.png" 
              alt="CivIQ Logo" 
              className="w-8 h-8 flex-shrink-0"
            />
          ) : (
            <img 
              src="/lovable-uploads/ee388e32-d054-4367-b2ac-0dd3512cb8fd.png" 
              alt="CivIQ" 
              className="w-6 h-6 flex-shrink-0"
            />
          )}
          {state === "expanded" && (
            <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
              <span className="truncate font-semibold text-gray-900 font-inter">CivIQ</span>
            </div>
          )}
        </div>
        <SidebarTrigger className="ml-auto" />
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton asChild tooltip={item.name}>
                    <NavLink
                      to={item.href}
                      className={({ isActive }) =>
                        cn(isActive && "bg-blue-100 text-blue-900")
                      }
                    >
                      <item.icon />
                      <span>{item.name}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Analytics section - only show if user has access */}
        {hasAnalyticsAccess && (
          <SidebarGroup>
            <SidebarGroupLabel>Analytics</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <Collapsible open={isReportsOpen} onOpenChange={setIsReportsOpen}>
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip="Analytics">
                        <BarChart3 />
                        <span>Analytics</span>
                        <ChevronDown className={cn("ml-auto transition-transform", isReportsOpen && "rotate-180")} />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {reportNavigation.map((item) => (
                          <SidebarMenuSubItem key={item.name}>
                            <SidebarMenuSubButton asChild>
                              <NavLink to={item.href}>
                                <span>{item.name}</span>
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Admin section - only show if user has access */}
        {hasAdminAccess && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <Collapsible open={isAdminOpen} onOpenChange={setIsAdminOpen}>
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip="Admin">
                        <Shield />
                        <span>Admin</span>
                        <ChevronDown className={cn("ml-auto transition-transform", isAdminOpen && "rotate-180")} />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {adminNavigation.map((item) => (
                          <SidebarMenuSubItem key={item.name}>
                            <SidebarMenuSubButton asChild>
                              <NavLink to={item.href}>
                                <span>{item.name}</span>
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Settings">
              <NavLink to="/settings" className="font-inter">
                <Settings />
                <span>Settings</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
