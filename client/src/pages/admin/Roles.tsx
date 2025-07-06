
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RoleList } from "@/components/roles/RoleList";
import { CreateRoleDialog } from "@/components/roles/CreateRoleDialog";
import { EditRoleDialog } from "@/components/roles/EditRoleDialog";
import { DeleteRoleDialog } from "@/components/roles/DeleteRoleDialog";
import { Plus } from "lucide-react";
import { Role } from "@/types/roles";

const RolesPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);

  // Fetch roles
  const { data: roles, isLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("roles")
        .select("*")
        .order("name");
        
      if (error) {
        toast({
          title: "Error fetching roles",
          description: error.message,
          variant: "destructive",
        });
        return [];
      }
      
      return data as Role[];
    },
  });
  
  const handleEdit = (role: Role) => {
    setEditingRole(role);
  };
  
  const handleDelete = (role: Role) => {
    setDeletingRole(role);
  };
  
  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false);
    toast({
      title: "Role created",
      description: "The role has been created successfully.",
    });
    queryClient.invalidateQueries({ queryKey: ["roles"] });
  };
  
  const handleEditSuccess = () => {
    setEditingRole(null);
    toast({
      title: "Role updated",
      description: "The role has been updated successfully.",
    });
    queryClient.invalidateQueries({ queryKey: ["roles"] });
  };
  
  const handleDeleteSuccess = () => {
    setDeletingRole(null);
    toast({
      title: "Role deleted",
      description: "The role has been deleted successfully.",
    });
    queryClient.invalidateQueries({ queryKey: ["roles"] });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Role Management</h1>
          <p className="text-muted-foreground">Create and manage user roles</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Role
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Roles</CardTitle>
          <CardDescription>
            Manage the roles available in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RoleList 
            roles={roles || []} 
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>
      
      <CreateRoleDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleCreateSuccess}
      />
      
      {editingRole && (
        <EditRoleDialog
          role={editingRole}
          open={!!editingRole}
          onOpenChange={() => setEditingRole(null)}
          onSuccess={handleEditSuccess}
        />
      )}
      
      {deletingRole && (
        <DeleteRoleDialog
          role={deletingRole}
          open={!!deletingRole}
          onOpenChange={() => setDeletingRole(null)}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </div>
  );
};

export default RolesPage;
