
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
  Key,
  UserCog,
  Database
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
import { useMenuPermissions } from '@/hooks/usePermissionCheck';

// Base navigation items that should always be available
const baseNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, module: 'dashboard' },
];

// Module to navigation mapping
const moduleNavigation: Record<string, any> = {
  'cases': { name: 'Cases', href: '/cases', icon: FileText },
  'knowledge_base': { name: 'Knowledge Base', href: '/knowledge', icon: BookOpen },
  'notifications': { name: 'Notifications', href: '/notifications', icon: Bell },
  'insights': { name: 'Insights', href: '/insights', icon: TrendingUp },
};

const reportNavigation = [
  { name: 'Reports', href: '/reports', module: 'reports' },
  { name: 'Report Builder', href: '/reports/builder', module: 'reports' },
  { name: 'Dashboards', href: '/dashboards', module: 'dashboards' },
];

const adminNavigation = [
  { name: 'Users', href: '/admin/users', icon: Users, module: 'users' },
  { name: 'Permissions', href: '/admin/permissions', icon: Key, module: 'permissions' },
  { name: 'Roles', href: '/admin/roles', icon: UserCog, module: 'roles' },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isDatabaseOpen, setIsDatabaseOpen] = useState(false);
  
  const {
    canViewAnalytics,
    canViewReports,
    canViewAdmin,
    canViewUsers,
    canViewPermissions,
    canViewRoles,
    canViewDashboards,
    canViewInsights,
    canViewCases,
    canViewNotifications,
    canViewKnowledge,
    availableModules,
    userPermissions,
    isLoading
  } = useMenuPermissions();

  console.log('[AppSidebar] Available modules:', availableModules);
  console.log('[AppSidebar] User permissions:', userPermissions);

  if (isLoading) {
    return (
      <Sidebar collapsible="icon" className="font-inter">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-1">
            <img 
              src="/lovable-uploads/ee388e32-d054-4367-b2ac-0dd3512cb8fd.png" 
              alt="CivIQ" 
              className="w-6 h-6 flex-shrink-0"
            />
            {state === "expanded" && (
              <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
                <span className="truncate font-semibold text-gray-900 font-inter">CivIQ</span>
              </div>
            )}
          </div>
          <SidebarTrigger className="ml-auto" />
        </SidebarHeader>
        <SidebarContent>
          <div className="p-4 text-sm text-muted-foreground">Loading permissions...</div>
        </SidebarContent>
      </Sidebar>
    );
  }

  // Build dynamic navigation based on permissions
  const dynamicNavigation = [];
  
  // Add base navigation
  dynamicNavigation.push(...baseNavigation);
  
  // Add module-based navigation items
  availableModules.forEach(module => {
    if (moduleNavigation[module]) {
      dynamicNavigation.push(moduleNavigation[module]);
    }
  });

  // Filter admin navigation based on specific permissions
  const filteredAdminNavigation = adminNavigation.filter(item => {
    switch (item.module) {
      case 'users':
        return canViewUsers;
      case 'permissions':
        return canViewPermissions;
      case 'roles':
        return canViewRoles;
      default:
        return false;
    }
  });

  // Filter reports navigation based on specific permissions
  const filteredReportNavigation = reportNavigation.filter(item => {
    if (item.module === 'dashboards') return canViewDashboards;
    return canViewReports;
  });

  // Get database tables that user has access to (for database section)
  const databaseTables = availableModules.filter(module => 
    !['dashboard', 'analytics', 'reports', 'admin', 'users', 'permissions', 'roles', 'dashboards', 'insights'].includes(module)
  );

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
              {dynamicNavigation.map((item) => (
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

        {/* Analytics section */}
        {(canViewAnalytics || canViewReports || canViewDashboards) && filteredReportNavigation.length > 0 && (
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
                        {filteredReportNavigation.map((item) => (
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

        {/* Database Tables section - show all tables user has access to */}
        {databaseTables.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Database</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <Collapsible open={isDatabaseOpen} onOpenChange={setIsDatabaseOpen}>
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip="Database Tables">
                        <Database />
                        <span>Tables</span>
                        <ChevronDown className={cn("ml-auto transition-transform", isDatabaseOpen && "rotate-180")} />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {databaseTables.map((tableName) => (
                          <SidebarMenuSubItem key={tableName}>
                            <SidebarMenuSubButton asChild>
                              <NavLink to={`/data/${tableName}`}>
                                <span>{tableName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
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

        {/* Admin section */}
        {canViewAdmin && filteredAdminNavigation.length > 0 && (
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
                        {filteredAdminNavigation.map((item) => (
                          <SidebarMenuSubItem key={item.name}>
                            <SidebarMenuSubButton asChild>
                              <NavLink to={item.href}>
                                <item.icon className="h-4 w-4" />
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
