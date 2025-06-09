
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
  Database,
  Users,
  MapPin,
  Calendar,
  MessageSquare,
  Tag,
  Archive,
  Activity
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
import { useMenuPermissions, useBulkPermissionCheck } from '@/hooks/usePermissionCheck';

// Core navigation items that should always be available
const coreNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, moduleName: 'dashboard' },
  { name: 'Cases', href: '/cases', icon: FileText, moduleName: 'cases' },
  { name: 'Knowledge Base', href: '/knowledge', icon: BookOpen, moduleName: 'knowledge' },
  { name: 'Notifications', href: '/notifications', icon: Bell, moduleName: 'notifications' },
];

// Icon mapping for different modules
const moduleIcons: Record<string, any> = {
  dashboard: LayoutDashboard,
  cases: FileText,
  knowledge: BookOpen,
  notifications: Bell,
  insights: TrendingUp,
  analytics: BarChart3,
  reports: BarChart3,
  dashboards: BarChart3,
  admin: Shield,
  users: Users,
  permissions: Shield,
  roles: Shield,
  locations: MapPin,
  case_categories: Tag,
  case_messages: MessageSquare,
  case_notes: FileText,
  case_attachments: Archive,
  case_activities: Activity,
  case_tasks: FileText,
  case_watchers: Users,
  case_feedback: MessageSquare,
  notifications: Bell,
  report_templates: BarChart3,
  report_configs: BarChart3,
  dashboard_templates: BarChart3,
  dashboard_layouts: BarChart3,
  data_sources: Database,
};

// Get icon for module
const getModuleIcon = (moduleName: string) => {
  return moduleIcons[moduleName] || Database;
};

// Generate route for module
const getModuleRoute = (moduleName: string) => {
  const routeMap: Record<string, string> = {
    dashboard: '/dashboard',
    cases: '/cases',
    knowledge: '/knowledge',
    notifications: '/notifications',
    insights: '/insights',
    reports: '/reports',
    dashboards: '/dashboards',
    users: '/admin/users',
    permissions: '/admin/permissions',
    roles: '/admin/roles',
    // Add more route mappings as needed
  };
  
  return routeMap[moduleName] || `/${moduleName}`;
};

// Format display name for module
const formatModuleName = (moduleName: string) => {
  return moduleName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export function AppSidebar() {
  const { state } = useSidebar();
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isDataOpen, setIsDataOpen] = useState(false);
  
  const {
    canViewAnalytics,
    canViewReports,
    canViewAdmin,
    canViewUsers,
    canViewPermissions,
    canViewRoles,
    canViewDashboards,
    canViewInsights,
    isLoading: menuPermissionsLoading
  } = useMenuPermissions();

  // Get ALL modules that the user has view permissions for
  const allPossibleModules = [
    'cases', 'users', 'roles', 'permissions', 'locations', 'case_categories',
    'case_messages', 'case_notes', 'case_attachments', 'case_activities',
    'case_tasks', 'case_watchers', 'case_feedback', 'notifications',
    'report_templates', 'report_configs', 'dashboard_templates', 
    'dashboard_layouts', 'data_sources', 'insights', 'analytics',
    'reports', 'dashboards'
  ];

  const modulePermissions = allPossibleModules.map(module => ({
    moduleName: module,
    permissionType: 'view' as const
  }));

  const { permissionResults, isLoading: bulkPermissionsLoading } = useBulkPermissionCheck(modulePermissions);

  const isLoading = menuPermissionsLoading || bulkPermissionsLoading;

  // Show loading state
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

  // Core application items (always show these)
  const coreItems = coreNavigation.filter(item => {
    if (item.moduleName === 'insights') return canViewInsights;
    return true; // Show dashboard, cases, knowledge base, notifications for all authenticated users
  });

  // Analytics/Reporting modules
  const analyticsModules = ['analytics', 'reports', 'dashboards', 'report_templates', 'report_configs', 'dashboard_templates', 'dashboard_layouts'];
  const availableAnalyticsModules = analyticsModules.filter(module => 
    permissionResults[`${module}.view`] === true
  );

  // Admin modules
  const adminModules = ['users', 'permissions', 'roles'];
  const availableAdminModules = adminModules.filter(module => 
    permissionResults[`${module}.view`] === true
  );

  // Data/Case Management modules
  const dataModules = ['case_categories', 'locations', 'case_messages', 'case_notes', 'case_attachments', 'case_activities', 'case_tasks', 'case_watchers', 'case_feedback', 'data_sources'];
  const availableDataModules = dataModules.filter(module => 
    permissionResults[`${module}.view`] === true
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
        {/* Core Application */}
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {coreItems.map((item) => (
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
        {availableAnalyticsModules.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Analytics & Reports</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <Collapsible open={isAnalyticsOpen} onOpenChange={setIsAnalyticsOpen}>
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip="Analytics">
                        <BarChart3 />
                        <span>Analytics</span>
                        <ChevronDown className={cn("ml-auto transition-transform", isAnalyticsOpen && "rotate-180")} />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {availableAnalyticsModules.map((module) => (
                          <SidebarMenuSubItem key={module}>
                            <SidebarMenuSubButton asChild>
                              <NavLink to={getModuleRoute(module)}>
                                <span>{formatModuleName(module)}</span>
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

        {/* Data Management section */}
        {availableDataModules.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Data Management</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <Collapsible open={isDataOpen} onOpenChange={setIsDataOpen}>
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip="Data Management">
                        <Database />
                        <span>Data Management</span>
                        <ChevronDown className={cn("ml-auto transition-transform", isDataOpen && "rotate-180")} />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {availableDataModules.map((module) => (
                          <SidebarMenuSubItem key={module}>
                            <SidebarMenuSubButton asChild>
                              <NavLink to={getModuleRoute(module)}>
                                <span>{formatModuleName(module)}</span>
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
        {availableAdminModules.length > 0 && (
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
                        {availableAdminModules.map((module) => (
                          <SidebarMenuSubItem key={module}>
                            <SidebarMenuSubButton asChild>
                              <NavLink to={getModuleRoute(module)}>
                                <span>{formatModuleName(module)}</span>
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
