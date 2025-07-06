
import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Role } from "@/types/roles";

interface CreateRoleDialogProps {
  onRoleCreated?: (roleId: string) => void;
}

export const CreateRoleDialog: React.FC<CreateRoleDialogProps> = ({ onRoleCreated }) => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  
  // Create new role
  const createRoleMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("roles")
        .insert([{
          name: newRoleName,
          description: newRoleDescription,
          is_system: false // Explicitly set is_system to false for new roles
        }])
        .select();
        
      if (error) throw error;
      return data[0] as Role;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast({
        title: "Role created",
        description: `The role "${newRoleName}" has been created successfully.`
      });
      if (onRoleCreated) {
        onRoleCreated(data.id);
      }
      setIsOpen(false);
      setNewRoleName("");
      setNewRoleDescription("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating role",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleCreateRole = () => {
    createRoleMutation.mutate();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Role</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="role-name">Role Name</Label>
            <Input
              id="role-name"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              placeholder="Enter role name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role-description">Description (Optional)</Label>
            <Input
              id="role-description"
              value={newRoleDescription}
              onChange={(e) => setNewRoleDescription(e.target.value)}
              placeholder="Enter description"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateRole}
            disabled={!newRoleName.trim() || createRoleMutation.isPending}
          >
            Create Role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
