
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
          <SidebarGroupLabel className="font-inter">Portal</SidebarGroupLabel>
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
