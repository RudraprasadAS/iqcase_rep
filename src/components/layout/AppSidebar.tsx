
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
  Users
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
import { useAccessibleModules } from '@/hooks/useModulePermissions';
import { moduleRegistry } from '@/config/moduleRegistry';

// Icon mapping for the module registry
const iconMap: Record<string, any> = {
  'LayoutDashboard': LayoutDashboard,
  'FileText': FileText,
  'BookOpen': BookOpen,
  'Bell': Bell,
  'TrendingUp': TrendingUp,
  'BarChart3': BarChart3,
  'Shield': Shield,
  'Users': Users,
};

export function AppSidebar() {
  const { state } = useSidebar();
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const { accessibleModules, isLoading } = useAccessibleModules();
  
  // Group accessible modules by category
  const coreModules = accessibleModules.filter(m => m.category === 'core');
  const analyticsModules = accessibleModules.filter(m => m.category === 'analytics');
  const adminModules = accessibleModules.filter(m => m.category === 'admin');
  
  const getModuleIcon = (iconName: string) => {
    return iconMap[iconName] || LayoutDashboard;
  };

  const getModulePath = (moduleName: string) => {
    const module = moduleRegistry.modules.find(m => m.name === moduleName);
    const firstScreen = module?.screens[0];
    return firstScreen?.path || `/${moduleName}`;
  };

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
          <div className="animate-pulse space-y-2 p-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </SidebarContent>
      </Sidebar>
    );
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
        {/* Core Application Modules */}
        {coreModules.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Application</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {coreModules.map((module) => {
                  const IconComponent = getModuleIcon(module.icon);
                  return (
                    <SidebarMenuItem key={module.name}>
                      <SidebarMenuButton asChild tooltip={module.label}>
                        <NavLink
                          to={getModulePath(module.name)}
                          className={({ isActive }) =>
                            cn(isActive && "bg-blue-100 text-blue-900")
                          }
                        >
                          <IconComponent />
                          <span>{module.label}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Analytics Modules */}
        {analyticsModules.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Analytics</SidebarGroupLabel>
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
                        {analyticsModules.map((module) => (
                          <SidebarMenuSubItem key={module.name}>
                            <SidebarMenuSubButton asChild>
                              <NavLink to={getModulePath(module.name)}>
                                <span>{module.label}</span>
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

        {/* Admin Modules */}
        {adminModules.length > 0 && (
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
                        {adminModules.map((module) => (
                          <SidebarMenuSubItem key={module.name}>
                            <SidebarMenuSubButton asChild>
                              <NavLink to={getModulePath(module.name)}>
                                <span>{module.label}</span>
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
