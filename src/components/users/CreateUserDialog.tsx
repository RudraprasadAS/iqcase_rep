
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { Role } from "@/types/roles";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roles: Role[];
  onUserCreated: () => void;
}

const userSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Must be a valid email"),
  role_id: z.string().min(1, "Role is required"),
  user_type: z.enum(["internal", "public", "guest"]),
  is_active: z.boolean().default(true),
});

type UserFormValues = z.infer<typeof userSchema>;

const CreateUserDialog = ({ open, onOpenChange, roles, onUserCreated }: CreateUserDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: "",
      email: "",
      role_id: "",
      user_type: "internal",
      is_active: true,
    },
  });
  
  const onSubmit = async (data: UserFormValues) => {
    setIsSubmitting(true);
    
    try {
      // First check if user already exists
      const { data: existingUser, error: checkError } = await supabase
        .from("users")
        .select("id, email")
        .eq("email", data.email)
        .maybeSingle();
        
      if (checkError) {
        console.error("Error checking existing user:", checkError);
        throw checkError;
      }

      if (existingUser) {
        toast({
          variant: "destructive",
          title: "Error",
          description: `A user with email ${data.email} already exists. Please use a different email.`,
        });
        return;
      }

      // If no existing user, create new one
      const { error } = await supabase
        .from("users")
        .insert({
          name: data.name,
          email: data.email,
          role_id: data.role_id,
          user_type: data.user_type,
          is_active: data.is_active,
        });
        
      if (error) {
        console.error("Error creating user:", error);
        throw error;
      }
      
      toast({
        title: "Success",
        description: "User created successfully",
      });
      
      form.reset();
      onUserCreated();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error in user creation:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create user",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="user@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="role_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="user_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User Type</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select user type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="internal">Internal</SelectItem>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="guest">Guest</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Active Status</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Will the user be active immediately?
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create User"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateUserDialog;
