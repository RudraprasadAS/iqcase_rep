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
  TrendingUp,
  Users,
  UserCog
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
import { AccessControl } from '@/components/auth';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, module: 'dashboard' },
  { name: 'Cases', href: '/cases', icon: FileText, module: 'cases' },
  { name: 'Knowledge Base', href: '/knowledge', icon: BookOpen, module: 'knowledge' },
  { name: 'Notifications', href: '/notifications', icon: Bell, module: 'notifications' },
  { name: 'Insights', href: '/insights', icon: TrendingUp, module: 'insights' },
];

const reportNavigation = [
  { name: 'Reports', href: '/analytics/reports', module: 'reports' },
  { name: 'Report Builder', href: '/analytics/builder', module: 'reports' },
  { name: 'Dashboards', href: '/analytics/dashboards', module: 'dashboards' },
];

const adminNavigation = [
  { name: 'Users', href: '/admin/users', module: 'users_management' },
  { name: 'Permissions', href: '/admin/permissions', module: 'permissions_management' },
  { name: 'Roles', href: '/admin/roles', module: 'roles_management' },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  
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
                <AccessControl key={item.name} module={item.module} type="can_view" fallback={null}>
                  <SidebarMenuItem>
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
                </AccessControl>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <AccessControl module="reports" type="can_view" fallback={null}>
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
                          <AccessControl key={item.name} module={item.module} type="can_view" fallback={null}>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton asChild>
                                <NavLink to={item.href}>
                                  <span>{item.name}</span>
                                </NavLink>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          </AccessControl>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </AccessControl>

        {/* Admin section - only show if user has access to any admin feature */}
        <AccessControl module="users_management" type="can_view" fallback={
          <AccessControl module="permissions_management" type="can_view" fallback={
            <AccessControl module="roles_management" type="can_view" fallback={null}>
              <></>
            </AccessControl>
          }>
            <></>
          </AccessControl>
        }>
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
                          <AccessControl key={item.name} module={item.module} type="can_view" fallback={null}>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton asChild>
                                <NavLink to={item.href}>
                                  <span>{item.name}</span>
                                </NavLink>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          </AccessControl>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </AccessControl>
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
