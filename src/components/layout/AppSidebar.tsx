
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  BarChart3, 
  Settings, 
  BookOpen,
  Bell,
  Shield,
  PieChart,
  Calendar
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export function AppSidebar() {
  const location = useLocation();
  const { 
    isAdmin, 
    hasManagerAccess, 
    hasCaseworkerAccess, 
    hasViewerAccess,
    roleName 
  } = useRoleAccess();

  // Main navigation items based on role
  const navigationItems = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
      show: true // All internal users can access dashboard
    },
    {
      title: "Cases",
      url: "/cases",
      icon: FileText,
      show: hasViewerAccess // Admin, Manager, Caseworker, Viewer can access
    },
    {
      title: "Knowledge Base",
      url: "/knowledge",
      icon: BookOpen,
      show: true // All internal users can access
    },
    {
      title: "Notifications",
      url: "/notifications",
      icon: Bell,
      show: true // All internal users can access
    },
    {
      title: "Insights",
      url: "/insights",
      icon: PieChart,
      show: true // All internal users can access
    },
    {
      title: "Dashboards",
      url: "/dashboards",
      icon: Calendar,
      show: true // All internal users can access
    }
  ];

  // Reports submenu - Only Admin and Manager can access
  const reportsItems = [
    {
      title: "Standard Reports",
      url: "/reports/standard",
    },
    {
      title: "Report Builder",
      url: "/reports/builder",
    },
    {
      title: "Table Builder",
      url: "/reports/table-builder",
    }
  ];

  // Admin submenu - Only Admin can access
  const adminItems = [
    {
      title: "Users",
      url: "/admin/users",
    },
    {
      title: "Roles",
      url: "/admin/roles",
    },
    {
      title: "Permissions",
      url: "/admin/permissions",
    }
  ];

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Case Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.filter(item => item.show).map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {/* Reports Section - Only Admin and Manager */}
              {hasManagerAccess && (
                <Collapsible>
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton>
                        <BarChart3 />
                        <span>Reports</span>
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {reportsItems.map((item) => (
                          <SidebarMenuSubItem key={item.title}>
                            <SidebarMenuSubButton asChild isActive={location.pathname === item.url}>
                              <Link to={item.url}>
                                <span>{item.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )}

              {/* Admin Section - Only Admin */}
              {isAdmin && (
                <Collapsible>
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton>
                        <Shield />
                        <span>Administration</span>
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {adminItems.map((item) => (
                          <SidebarMenuSubItem key={item.title}>
                            <SidebarMenuSubButton asChild isActive={location.pathname === item.url}>
                              <Link to={item.url}>
                                <span>{item.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Role indicator */}
        <SidebarGroup>
          <SidebarGroupLabel>User Info</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-2 py-1 text-xs text-muted-foreground">
              Role: {roleName || 'Unknown'}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
