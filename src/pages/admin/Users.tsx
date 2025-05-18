
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PageHeader } from "@/components/layout/PageHeader";
import { UserList } from "@/components/users/UserList";
import { CreateUserDialog } from "@/components/users/CreateUserDialog";
import { useToast } from "@/hooks/use-toast";
import { Role } from "@/types/roles";
import { Card, CardContent } from "@/components/ui/card";
import { Search, UserPlus, Filter } from "lucide-react";
import {
  Select as SelectPrimitive,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export interface User {
  id: string;
  name: string;
  email: string;
  role_id: string;
  is_active: boolean;
  user_type: string;
  created_by: string | null;
  auth_user_id: string | null;
  last_login: string | null;
  created_at: string | null;
  updated_at: string | null;
}

const Users = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [userTypeFilter, setUserTypeFilter] = useState<string>("all");

  // Fetch users
  const {
    data: users = [],
    isLoading: isUsersLoading,
    error: usersError,
  } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      console.log("[Users] Fetching users");
      const { data, error } = await supabase
        .from("users")
        .select("*, roles(name)");

      if (error) {
        console.error("[Users] Error fetching users:", error);
        throw error;
      }

      console.log("[Users] Users fetched:", data);
      return data;
    },
  });

  // Fetch roles for filtering and dropdown
  const {
    data: roles = [],
    isLoading: isRolesLoading,
  } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      console.log("[Users] Fetching roles");
      const { data, error } = await supabase
        .from("roles")
        .select("*")
        .order("name");

      if (error) {
        console.error("[Users] Error fetching roles:", error);
        throw error;
      }

      console.log("[Users] Roles fetched:", data);
      return data;
    },
  });

  // Apply filters and search
  const filteredUsers = users.filter((user: any) => {
    // Search filter
    const matchesSearch =
      searchQuery === "" ||
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Status filter
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && user.is_active) ||
      (statusFilter === "inactive" && !user.is_active);
    
    // Role filter
    const matchesRole = roleFilter === "all" || user.role_id === roleFilter;
    
    // User type filter
    const matchesType = userTypeFilter === "all" || user.user_type === userTypeFilter;
    
    return matchesSearch && matchesStatus && matchesRole && matchesType;
  });

  // Get unique user types for filter dropdown
  const uniqueUserTypes = Array.from(
    new Set(users.map((user: any) => user.user_type))
  ).filter(Boolean);

  useEffect(() => {
    if (usersError) {
      toast({
        title: "Error fetching users",
        description: "There was a problem loading the users data.",
        variant: "destructive",
      });
    }
  }, [usersError, toast]);

  return (
    <>
      <Helmet>
        <title>User Management</title>
      </Helmet>
      
      <PageHeader
        title="User Management"
        description="Manage all users, roles, and access permissions"
        action={
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Create User
          </Button>
        }
      />

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3 items-end">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users by name or email"
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              <div className="w-full md:w-auto">
                <SelectPrimitive
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger className="w-full md:w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </SelectPrimitive>
              </div>
              
              <div className="w-full md:w-auto">
                <SelectPrimitive
                  value={roleFilter}
                  onValueChange={setRoleFilter}
                >
                  <SelectTrigger className="w-full md:w-[140px]">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {roles.map((role: Role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </SelectPrimitive>
              </div>
              
              <div className="w-full md:w-auto">
                <SelectPrimitive
                  value={userTypeFilter}
                  onValueChange={setUserTypeFilter}
                >
                  <SelectTrigger className="w-full md:w-[140px]">
                    <SelectValue placeholder="User Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {uniqueUserTypes.map((type: string) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </SelectPrimitive>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {isUsersLoading || isRolesLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : (
        <UserList users={filteredUsers} roles={roles} />
      )}
      
      <CreateUserDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        roles={roles}
      />
    </>
  );
};

export default Users;
