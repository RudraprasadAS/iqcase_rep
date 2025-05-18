
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Role } from "@/types/roles";

interface CreateUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  roles: Role[];
}

export const CreateUserDialog = ({ 
  isOpen, 
  onClose, 
  roles 
}: CreateUserDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role_id: "",
    user_type: "internal",
    is_active: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, is_active: checked }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const { data: authData } = await supabase.auth.getUser();
      const currentUserId = authData?.user?.id;
      
      // Create user record
      const { data, error } = await supabase
        .from("users")
        .insert({
          name: formData.name,
          email: formData.email,
          role_id: formData.role_id,
          user_type: formData.user_type,
          is_active: formData.is_active,
          created_by: currentUserId || null,
        });
      
      if (error) throw error;
      
      toast({
        title: "User created",
        description: "The user has been created successfully.",
      });
      
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onClose();
      
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      role_id: "",
      user_type: "internal",
      is_active: true,
    });
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) {
          onClose();
          resetForm();
        }
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the system. They will not have access until they create an account.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role_id}
                onValueChange={(value) => handleSelectChange("role_id", value)}
                disabled={isSubmitting}
                required
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="userType">User Type</Label>
              <Select
                value={formData.user_type}
                onValueChange={(value) => handleSelectChange("user_type", value)}
                disabled={isSubmitting}
              >
                <SelectTrigger id="userType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">Internal</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="guest">Guest</SelectItem>
                  <SelectItem value="contractor">Contractor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="active" 
                checked={formData.is_active}
                onCheckedChange={handleSwitchChange}
                disabled={isSubmitting}
              />
              <Label htmlFor="active">Active</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
