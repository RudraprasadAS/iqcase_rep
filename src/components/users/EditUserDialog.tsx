
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Role } from "@/types/roles";
import { User } from "@/pages/admin/Users";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

interface EditUserDialogProps {
  user: User;
  roles: Role[];
  isOpen: boolean;
  onClose: () => void;
}

const userEditFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  role_id: z.string().min(1, { message: "Role is required" }),
  is_active: z.boolean(),
  user_type: z.string().optional(),
});

type UserEditFormValues = z.infer<typeof userEditFormSchema>;

export const EditUserDialog: React.FC<EditUserDialogProps> = ({
  user,
  roles,
  isOpen,
  onClose,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<UserEditFormValues>({
    resolver: zodResolver(userEditFormSchema),
    defaultValues: {
      name: user.name || "",
      role_id: user.role_id || "",
      is_active: user.is_active ?? true,
      user_type: user.user_type || "internal",
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (values: UserEditFormValues) => {
      console.log("[EditUserDialog] Updating user with values:", values);
      
      const { data, error } = await supabase
        .from("users")
        .update(values)
        .eq("id", user.id)
        .select();

      if (error) {
        console.error("[EditUserDialog] Error updating user:", error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({
        title: "User updated",
        description: "The user has been updated successfully.",
      });
      onClose();
    },
    onError: (error) => {
      console.error("[EditUserDialog] Mutation error:", error);
      toast({
        title: "Error updating user",
        description: "There was a problem updating the user. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (values: UserEditFormValues) => {
    setIsSubmitting(true);
    try {
      await updateUserMutation.mutateAsync(values);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update the user's information and access settings.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center space-x-4 py-2 rounded-lg border border-muted px-4">
              <div className="w-full">
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {user.email}
                </p>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Email address cannot be changed
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="role_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
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
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="internal">Internal</SelectItem>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="guest">Guest</SelectItem>
                        <SelectItem value="contractor">Contractor</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      User Status
                    </FormLabel>
                    <FormDescription>
                      Set whether this user is active in the system
                    </FormDescription>
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
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
