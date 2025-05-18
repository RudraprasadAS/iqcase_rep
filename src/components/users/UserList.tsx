
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { EditUserDialog } from "./EditUserDialog";
import { Role } from "@/types/roles";
import { User } from "@/pages/admin/Users";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { format } from "date-fns";

interface UserListProps {
  users: any[];
  roles: Role[];
}

export const UserList: React.FC<UserListProps> = ({ users, roles }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Toggle user active status
  const toggleUserActiveMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      console.log(`[UserList] Setting user ${userId} active status to ${isActive}`);
      
      const { data, error } = await supabase
        .from("users")
        .update({ is_active: isActive })
        .eq("id", userId);

      if (error) {
        console.error("[UserList] Error updating user active status:", error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({
        title: "User updated",
        description: "The user's status has been updated successfully.",
      });
    },
    onError: (error) => {
      console.error("[UserList] Mutation error:", error);
      toast({
        title: "Error updating user",
        description: "There was a problem updating the user's status.",
        variant: "destructive",
      });
    },
  });

  const handleToggleActive = (userId: string, currentValue: boolean) => {
    toggleUserActiveMutation.mutate({
      userId,
      isActive: !currentValue,
    });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    try {
      return format(new Date(dateString), "MMM d, yyyy h:mm a");
    } catch (e) {
      return "Invalid date";
    }
  };

  const getUserRoleName = (roleId: string) => {
    const role = roles.find((r) => r.id === roleId);
    return role ? role.name : "Unknown";
  };

  const getUserTypeBadgeVariant = (userType: string) => {
    switch (userType) {
      case "internal":
        return "default";
      case "public":
        return "secondary";
      case "guest":
        return "outline";
      case "contractor":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user: any) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{getUserRoleName(user.role_id)}</TableCell>
                  <TableCell>
                    <Badge variant={getUserTypeBadgeVariant(user.user_type)}>
                      {user.user_type?.charAt(0).toUpperCase() + user.user_type?.slice(1) || "Unknown"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={user.is_active}
                        onCheckedChange={() => handleToggleActive(user.id, user.is_active)}
                      />
                      <span>{user.is_active ? "Active" : "Inactive"}</span>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(user.last_login)}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingUser(user)}
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {editingUser && (
        <EditUserDialog
          user={editingUser}
          roles={roles}
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
        />
      )}
    </>
  );
};
