
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

const navigation = [
  { name: 'Dashboard', href: '/citizen/dashboard', icon: LayoutDashboard },
  { name: 'My Cases', href: '/citizen/cases', icon: FileText },
  { name: 'Notifications', href: '/citizen/notifications', icon: Bell },
  { name: 'Knowledge Base', href: '/citizen/knowledge', icon: MessageCircle },
];

const CitizenSidebar = () => {
  const { state } = useSidebar();

  return (
    <Sidebar collapsible="icon" className="font-inter">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1">
          <img 
            src="/lovable-uploads/ee388e32-d054-4367-b2ac-0dd3512cb8fd.png" 
            alt="CivIQ Logo" 
            className="w-8 h-8"
          />
          {state === "expanded" && (
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold text-blue-600 font-inter">CivIQ</span>
              <span className="truncate text-xs text-muted-foreground font-inter">Citizen Portal</span>
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
