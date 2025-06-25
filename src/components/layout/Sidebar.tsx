
import { Home, FileText, Users, Settings, BarChart3, Bell, BookOpen, Layers, UserCog } from "lucide-react";
import { NavItem } from "./NavItem";
import { AccessControl } from "@/components/auth";
import { useAuth } from "@/hooks/useAuth";

export const Sidebar = () => {
  const { user } = useAuth();

  return (
    <div className="pb-12 w-64 bg-background border-r">
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="space-y-1">
            <AccessControl module="dashboard" type="can_view">
              <NavItem href="/dashboard" icon={Home}>
                Dashboard
              </NavItem>
            </AccessControl>
            
            <AccessControl module="cases" type="can_view">
              <NavItem href="/cases" icon={FileText}>
                Cases
              </NavItem>
            </AccessControl>
            
            <AccessControl module="notifications" type="can_view">
              <NavItem href="/notifications" icon={Bell}>
                Notifications
              </NavItem>
            </AccessControl>
            
            <AccessControl module="reports" type="can_view">
              <NavItem href="/reports" icon={BarChart3}>
                Reports
              </NavItem>
            </AccessControl>
            
            <AccessControl module="knowledge" type="can_view">
              <NavItem href="/knowledge" icon={BookOpen}>
                Knowledge Base
              </NavItem>
            </AccessControl>
            
            <AccessControl module="insights" type="can_view">
              <NavItem href="/insights" icon={Layers}>
                Insights
              </NavItem>
            </AccessControl>
          </div>
        </div>
        
        {/* Admin section - only show if user has access to ANY admin feature */}
        <AccessControl module="users_management" type="can_view" fallback={
          <AccessControl module="permissions_management" type="can_view" fallback={
            <AccessControl module="roles_management" type="can_view" fallback={null}>
              <div className="px-3 py-2">
                <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                  Admin
                </h2>
                <div className="space-y-1">
                  <AccessControl module="roles_management" type="can_view">
                    <NavItem href="/admin/roles" icon={Settings}>
                      Roles
                    </NavItem>
                  </AccessControl>
                </div>
              </div>
            </AccessControl>
          }>
            <div className="px-3 py-2">
              <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                Admin
              </h2>
              <div className="space-y-1">
                <AccessControl module="permissions_management" type="can_view">
                  <NavItem href="/admin/permissions" icon={UserCog}>
                    Permissions
                  </NavItem>
                </AccessControl>
                
                <AccessControl module="roles_management" type="can_view">
                  <NavItem href="/admin/roles" icon={Settings}>
                    Roles
                  </NavItem>
                </AccessControl>
              </div>
            </div>
          </AccessControl>
        }>
          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
              Admin
            </h2>
            <div className="space-y-1">
              <AccessControl module="users_management" type="can_view">
                <NavItem href="/admin/users" icon={Users}>
                  Users
                </NavItem>
              </AccessControl>
              
              <AccessControl module="permissions_management" type="can_view">
                <NavItem href="/admin/permissions" icon={UserCog}>
                  Permissions
                </NavItem>
              </AccessControl>
              
              <AccessControl module="roles_management" type="can_view">
                <NavItem href="/admin/roles" icon={Settings}>
                  Roles
                </NavItem>
              </AccessControl>
            </div>
          </div>
        </AccessControl>
      </div>
    </div>
  );
};
