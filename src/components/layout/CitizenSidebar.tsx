
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LayoutDashboard, FileText, Bell, MessageCircle } from 'lucide-react';
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
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { PermissionGuard } from "@/components/auth";

const navigation = [
  { name: 'Dashboard', href: '/citizen/dashboard', icon: LayoutDashboard, elementKey: 'citizen.dashboard' },
  { name: 'My Cases', href: '/citizen/cases', icon: FileText, elementKey: 'citizen.cases' },
  { name: 'Notifications', href: '/citizen/notifications', icon: Bell, elementKey: 'citizen.notifications' },
  { name: 'Knowledge Base', href: '/citizen/knowledge', icon: MessageCircle, elementKey: 'citizen.knowledge' },
];

const CitizenSidebar = () => {
  const { state } = useSidebar();

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
          <SidebarGroupLabel>Portal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <PermissionGuard elementKey={item.elementKey}>
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
                  </PermissionGuard>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="px-2 py-1 text-xs text-muted-foreground font-inter">
              {state === "expanded" ? "© 2024 CivIQ" : "© CQ"}
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default CitizenSidebar;
