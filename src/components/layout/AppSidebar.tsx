
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
            <div className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white font-bold text-lg rounded flex-shrink-0 font-inter">
              C
            </div>
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
          <SidebarGroupLabel className="font-inter">Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton asChild tooltip={item.name}>
                    <NavLink
                      to={item.href}
                      className={({ isActive }) =>
                        cn(
                          "font-inter flex items-center gap-2 px-2 py-2 text-sm font-medium rounded-md transition-colors",
                          isActive 
                            ? "bg-blue-100 text-blue-900 font-semibold" 
                            : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                        )
                      }
                    >
                      <item.icon />
                      <span className="font-inter">{item.name}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="font-inter">Analytics</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <Collapsible open={isReportsOpen} onOpenChange={setIsReportsOpen}>
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip="Analytics" className="font-inter">
                      <BarChart3 />
                      <span className="font-inter">Analytics</span>
                      <ChevronDown className={cn("ml-auto transition-transform font-inter", isReportsOpen && "rotate-180")} />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {reportNavigation.map((item) => (
                        <SidebarMenuSubItem key={item.name}>
                          <SidebarMenuSubButton asChild>
                            <NavLink 
                              to={item.href}
                              className={({ isActive }) =>
                                cn(
                                  "font-inter",
                                  isActive && "bg-blue-100 text-blue-900 font-semibold"
                                )
                              }
                            >
                              <span className="font-inter">{item.name}</span>
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

        <SidebarGroup>
          <SidebarGroupLabel className="font-inter">Administration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <Collapsible open={isAdminOpen} onOpenChange={setIsAdminOpen}>
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip="Admin" className="font-inter">
                      <Shield />
                      <span className="font-inter">Admin</span>
                      <ChevronDown className={cn("ml-auto transition-transform font-inter", isAdminOpen && "rotate-180")} />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {adminNavigation.map((item) => (
                        <SidebarMenuSubItem key={item.name}>
                          <SidebarMenuSubButton asChild>
                            <NavLink 
                              to={item.href}
                              className={({ isActive }) =>
                                cn(
                                  "font-inter",
                                  isActive && "bg-blue-100 text-blue-900 font-semibold"
                                )
                              }
                            >
                              <span className="font-inter">{item.name}</span>
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
      </SidebarContent>
      
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Settings">
              <NavLink 
                to="/settings" 
                className={({ isActive }) =>
                  cn(
                    "font-inter",
                    isActive && "bg-blue-100 text-blue-900 font-semibold"
                  )
                }
              >
                <Settings />
                <span className="font-inter">Settings</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
