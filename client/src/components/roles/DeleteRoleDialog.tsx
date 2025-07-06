
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Role } from "@/types/roles";

interface DeleteRoleDialogProps {
  role: Role;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DeleteRoleDialog({ role, open, onOpenChange, onSuccess }: DeleteRoleDialogProps) {
  const [error, setError] = useState<string | null>(null);
  
  const deleteRole = useMutation({
    mutationFn: async () => {
      // Using a soft delete approach by setting is_active to false
      const { data, error } = await supabase
        .from("roles")
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq("id", role.id);
        
      if (error) throw new Error(error.message);
      return data;
    },
    onError: (error: Error) => {
      setError(error.message);
    },
    onSuccess: () => {
      setError(null);
      onSuccess();
    },
  });
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Delete Role</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the role "{role.name}"? This action is reversible but may affect users currently assigned to this role.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {error && (
            <div className="bg-destructive/10 p-3 rounded-md text-destructive text-sm mb-4">
              {error}
            </div>
          )}
          
          <p className="text-muted-foreground">
            This will mark the role as inactive in the system. Any existing users with this role may need to be reassigned.
          </p>
        </div>
        
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button 
            type="button"
            variant="destructive"
            onClick={() => deleteRole.mutate()}
            disabled={deleteRole.isPending}
          >
            {deleteRole.isPending ? "Deleting..." : "Delete Role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
