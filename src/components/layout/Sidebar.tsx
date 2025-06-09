
import { Home, FileText, Users, Settings, BarChart3, Bell, BookOpen, Layers, UserCog } from "lucide-react";
import { NavItem } from "./NavItem";
import { PermissionGuard } from "@/components/auth/PermissionGuard";

export const Sidebar = () => {
  return (
    <div className="pb-12 w-64 bg-background border-r">
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="space-y-1">
            <PermissionGuard elementKey="dashboard">
              <NavItem href="/dashboard" icon={Home}>
                Dashboard
              </NavItem>
            </PermissionGuard>
            
            <PermissionGuard elementKey="cases">
              <NavItem href="/cases" icon={FileText}>
                Cases
              </NavItem>
            </PermissionGuard>
            
            <PermissionGuard elementKey="notifications">
              <NavItem href="/notifications" icon={Bell}>
                Notifications
              </NavItem>
            </PermissionGuard>
            
            <PermissionGuard elementKey="reports">
              <NavItem href="/reports" icon={BarChart3}>
                Reports
              </NavItem>
            </PermissionGuard>
            
            <NavItem href="/knowledge" icon={BookOpen}>
              Knowledge Base
            </NavItem>
            
            <NavItem href="/insights" icon={Layers}>
              Insights
            </NavItem>
          </div>
        </div>
        
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Admin
          </h2>
          <div className="space-y-1">
            <PermissionGuard elementKey="users_management">
              <NavItem href="/admin/users" icon={Users}>
                Users
              </NavItem>
            </PermissionGuard>
            
            <PermissionGuard elementKey="roles_and_permissions">
              <NavItem href="/admin/permissions" icon={UserCog}>
                Permissions
              </NavItem>
            </PermissionGuard>
            
            <PermissionGuard elementKey="roles_and_permissions">
              <NavItem href="/admin/roles" icon={Settings}>
                Roles
              </NavItem>
            </PermissionGuard>
          </div>
        </div>
      </div>
    </div>
  );
};
