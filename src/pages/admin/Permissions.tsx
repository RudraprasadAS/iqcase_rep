
import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Role } from "@/types/roles";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface Permission {
  id: string;
  role_id: string;
  module_name: string;
  field_name: string | null;
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

interface TableInfo {
  name: string;
  schema: string;
  fields: string[];
}

const PermissionsPage = () => {
  const queryClient = useQueryClient();
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [isCreateRoleDialogOpen, setIsCreateRoleDialogOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({});
  const [showSelectAll, setShowSelectAll] = useState<boolean>(false);
  
  // Fetch all roles
  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("roles")
        .select("*")
        .order("name");
        
      if (error) throw error;
      return data as Role[];
    },
  });
  
  // Fetch all database tables
  const { data: tables, isLoading: tablesLoading } = useQuery({
    queryKey: ["database_tables"],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_tables_info');
        
      if (error) {
        console.error("Error fetching tables:", error);
        // Fallback to a predefined list of core tables
        return [
          { name: "cases", schema: "public", fields: ["id", "title", "description", "status"] },
          { name: "users", schema: "public", fields: ["id", "name", "email"] },
          { name: "roles", schema: "public", fields: ["id", "name", "description"] },
          { name: "permissions", schema: "public", fields: ["id", "role_id", "module_name"] },
          { name: "case_categories", schema: "public", fields: ["id", "name", "description"] }
        ] as TableInfo[];
      }
      
      return data as TableInfo[];
    },
  });
  
  // Fetch permissions for selected role
  const { data: permissions, isLoading: permissionsLoading } = useQuery({
    queryKey: ["permissions", selectedRoleId],
    queryFn: async () => {
      if (!selectedRoleId) return [] as Permission[];
      
      const { data, error } = await supabase
        .from("permissions")
        .select("*")
        .eq("role_id", selectedRoleId);
        
      if (error) throw error;
      return (data || []) as Permission[];
    },
    enabled: !!selectedRoleId,
  });

  // Create new role
  const createRoleMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("roles")
        .insert([{
          name: newRoleName,
          description: newRoleDescription
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
      setSelectedRoleId(data.id);
      setIsCreateRoleDialogOpen(false);
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

  // Update permission
  const updatePermissionMutation = useMutation({
    mutationFn: async ({ 
      roleId, 
      moduleName, 
      fieldName = null, 
      canView, 
      canEdit,
      canDelete 
    }: { 
      roleId: string;
      moduleName: string;
      fieldName?: string | null;
      canView: boolean;
      canEdit: boolean;
      canDelete: boolean;
    }) => {
      // Check if permission already exists
      const { data: existingPermissions } = await supabase
        .from("permissions")
        .select("id")
        .eq("role_id", roleId)
        .eq("module_name", moduleName)
        .eq("field_name", fieldName);

      if (existingPermissions && existingPermissions.length > 0) {
        // Update existing permission
        const { data, error } = await supabase
          .from("permissions")
          .update({
            can_view: canView,
            can_edit: canEdit,
            can_delete: canDelete,
            updated_at: new Date().toISOString()
          })
          .eq("id", existingPermissions[0].id);
          
        if (error) throw error;
        return data;
      } else {
        // Create new permission
        const { data, error } = await supabase
          .from("permissions")
          .insert([{
            role_id: roleId,
            module_name: moduleName,
            field_name: fieldName,
            can_view: canView,
            can_edit: canEdit,
            can_delete: canDelete
          }]);
          
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissions", selectedRoleId] });
      toast({
        title: "Permission updated",
        description: "The permission has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating permission",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleToggleTable = (tableName: string) => {
    setExpandedTables(prev => ({
      ...prev,
      [tableName]: !prev[tableName]
    }));
  };

  const handlePermissionChange = (
    roleId: string,
    moduleName: string,
    fieldName: string | null,
    type: 'view' | 'edit' | 'delete',
    checked: boolean
  ) => {
    // For system roles, don't allow changes
    const role = roles?.find(r => r.id === roleId);
    if (role?.is_system) {
      toast({
        title: "Cannot modify system role",
        description: "System roles have predefined permissions that cannot be changed.",
        variant: "destructive",
      });
      return;
    }

    // Get current permissions for this role and module
    const existingPermission = permissions?.find(
      p => p.role_id === roleId && 
           p.module_name === moduleName && 
           p.field_name === fieldName
    );

    // Apply permission logic
    let newCanView = existingPermission?.can_view || false;
    let newCanEdit = existingPermission?.can_edit || false; 
    let newCanDelete = existingPermission?.can_delete || false;

    if (type === 'view') {
      newCanView = checked;
      // If view is unchecked, uncheck edit and delete as well
      if (!checked) {
        newCanEdit = false;
        newCanDelete = false;
      }
    } else if (type === 'edit') {
      newCanEdit = checked;
      // If edit is checked, automatically check view
      if (checked) {
        newCanView = true;
      }
    } else if (type === 'delete') {
      newCanDelete = checked;
      // If delete is checked, automatically check view
      if (checked) {
        newCanView = true;
      }
    }

    updatePermissionMutation.mutate({
      roleId,
      moduleName,
      fieldName,
      canView: newCanView,
      canEdit: newCanEdit,
      canDelete: newCanDelete
    });
  };

  const handleSelectAllForTable = (
    roleId: string,
    tableName: string,
    type: 'view' | 'edit' | 'delete',
    checked: boolean
  ) => {
    const tableInfo = tables?.find(t => t.name === tableName);
    if (!tableInfo) return;

    // Apply to table-level permission
    handlePermissionChange(roleId, tableName, null, type, checked);

    // Apply to all fields
    if (tableInfo.fields) {
      tableInfo.fields.forEach(field => {
        handlePermissionChange(roleId, tableName, field, type, checked);
      });
    }
  };

  const isChecked = (
    roleId: string,
    moduleName: string,
    fieldName: string | null,
    type: 'view' | 'edit' | 'delete'
  ): boolean => {
    // System roles have all permissions by default
    const role = roles?.find(r => r.id === roleId);
    if (role?.is_system) return true;

    // Check if permission exists
    const permission = permissions?.find(
      p => p.role_id === roleId && 
           p.module_name === moduleName && 
           p.field_name === fieldName
    );

    if (type === 'view') return !!permission?.can_view;
    if (type === 'edit') return !!permission?.can_edit;
    return !!permission?.can_delete;
  };

  // Define relevant modules/tables to show
  const relevantTables = tables?.filter(t => 
    !t.name.startsWith('pg_') && 
    !t.name.includes('_audit_') && 
    !t.name.includes('_log')
  ) || [];

  // Filter out system tables and sort by name
  const sortedTables = [...relevantTables].sort((a, b) => a.name.localeCompare(b.name));
  
  const isLoading = rolesLoading || tablesLoading || (!!selectedRoleId && permissionsLoading);
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Permission Matrix</h1>
          <p className="text-muted-foreground">Manage permissions by role and database entity</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="select-all-toggle">Show "Select All" options</Label>
            <Switch 
              id="select-all-toggle"
              checked={showSelectAll} 
              onCheckedChange={setShowSelectAll} 
            />
          </div>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Permission Matrix</CardTitle>
          <CardDescription>
            Configure what each role can access across your database tables and fields
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-end mb-6">
                <div className="w-[300px]">
                  <Label htmlFor="role-select" className="mb-2 block">Select Role</Label>
                  <div className="flex gap-2">
                    <Select 
                      value={selectedRoleId} 
                      onValueChange={setSelectedRoleId}
                    >
                      <SelectTrigger id="role-select" className="flex-1">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles?.map(role => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name} {role.is_system && "(System)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Dialog open={isCreateRoleDialogOpen} onOpenChange={setIsCreateRoleDialogOpen}>
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
                          <Button variant="outline" onClick={() => setIsCreateRoleDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button 
                            onClick={() => createRoleMutation.mutate()}
                            disabled={!newRoleName.trim() || createRoleMutation.isPending}
                          >
                            Create Role
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
              
              {!selectedRoleId ? (
                <div className="text-center py-12 border rounded-md bg-muted/10">
                  <p className="text-muted-foreground">Select a role to manage permissions</p>
                </div>
              ) : (
                <div>
                  <div className="overflow-x-auto border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="min-w-[200px]">Table / Field</TableHead>
                          <TableHead className="text-center w-[100px]">View</TableHead>
                          <TableHead className="text-center w-[100px]">Edit</TableHead>
                          <TableHead className="text-center w-[100px]">Delete</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedTables.length > 0 ? (
                          sortedTables.map(table => (
                            <React.Fragment key={table.name}>
                              {/* Table-level row */}
                              <TableRow className="bg-muted/20 hover:bg-muted/30">
                                <TableCell className="font-medium">
                                  <div className="flex items-center">
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      className="p-1 mr-2"
                                      onClick={() => handleToggleTable(table.name)}
                                    >
                                      {expandedTables[table.name] ? 
                                        <ChevronDown className="h-4 w-4" /> : 
                                        <ChevronRight className="h-4 w-4" />
                                      }
                                    </Button>
                                    <span className="font-semibold">{table.name}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="flex justify-center">
                                    <Checkbox 
                                      checked={isChecked(selectedRoleId, table.name, null, 'view')}
                                      onCheckedChange={(checked) => 
                                        handlePermissionChange(selectedRoleId, table.name, null, 'view', !!checked)
                                      }
                                      disabled={roles?.find(r => r.id === selectedRoleId)?.is_system}
                                    />
                                    {showSelectAll && (
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        className="ml-2 text-xs h-5"
                                        onClick={() => handleSelectAllForTable(
                                          selectedRoleId, 
                                          table.name, 
                                          'view', 
                                          !isChecked(selectedRoleId, table.name, null, 'view')
                                        )}
                                      >
                                        all
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="flex justify-center">
                                    <Checkbox 
                                      checked={isChecked(selectedRoleId, table.name, null, 'edit')}
                                      onCheckedChange={(checked) => 
                                        handlePermissionChange(selectedRoleId, table.name, null, 'edit', !!checked)
                                      }
                                      disabled={
                                        roles?.find(r => r.id === selectedRoleId)?.is_system || 
                                        !isChecked(selectedRoleId, table.name, null, 'view')
                                      }
                                    />
                                    {showSelectAll && (
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        className="ml-2 text-xs h-5"
                                        onClick={() => handleSelectAllForTable(
                                          selectedRoleId, 
                                          table.name, 
                                          'edit', 
                                          !isChecked(selectedRoleId, table.name, null, 'edit')
                                        )}
                                        disabled={!isChecked(selectedRoleId, table.name, null, 'view')}
                                      >
                                        all
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="flex justify-center">
                                    <Checkbox 
                                      checked={isChecked(selectedRoleId, table.name, null, 'delete')}
                                      onCheckedChange={(checked) => 
                                        handlePermissionChange(selectedRoleId, table.name, null, 'delete', !!checked)
                                      }
                                      disabled={
                                        roles?.find(r => r.id === selectedRoleId)?.is_system || 
                                        !isChecked(selectedRoleId, table.name, null, 'view')
                                      }
                                    />
                                    {showSelectAll && (
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        className="ml-2 text-xs h-5"
                                        onClick={() => handleSelectAllForTable(
                                          selectedRoleId, 
                                          table.name, 
                                          'delete', 
                                          !isChecked(selectedRoleId, table.name, null, 'delete')
                                        )}
                                        disabled={!isChecked(selectedRoleId, table.name, null, 'view')}
                                      >
                                        all
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                              
                              {/* Field-level rows */}
                              {expandedTables[table.name] && table.fields && table.fields.map(field => (
                                <TableRow key={`${table.name}-${field}`} className="border-0">
                                  <TableCell className="pl-10 py-2 text-sm">
                                    {field}
                                  </TableCell>
                                  <TableCell className="text-center py-2">
                                    <Checkbox 
                                      checked={isChecked(selectedRoleId, table.name, field, 'view')}
                                      onCheckedChange={(checked) => 
                                        handlePermissionChange(selectedRoleId, table.name, field, 'view', !!checked)
                                      }
                                      disabled={roles?.find(r => r.id === selectedRoleId)?.is_system}
                                    />
                                  </TableCell>
                                  <TableCell className="text-center py-2">
                                    <Checkbox 
                                      checked={isChecked(selectedRoleId, table.name, field, 'edit')}
                                      onCheckedChange={(checked) => 
                                        handlePermissionChange(selectedRoleId, table.name, field, 'edit', !!checked)
                                      }
                                      disabled={
                                        roles?.find(r => r.id === selectedRoleId)?.is_system || 
                                        !isChecked(selectedRoleId, table.name, field, 'view')
                                      }
                                    />
                                  </TableCell>
                                  <TableCell className="text-center py-2">
                                    <Checkbox 
                                      checked={isChecked(selectedRoleId, table.name, field, 'delete')}
                                      onCheckedChange={(checked) => 
                                        handlePermissionChange(selectedRoleId, table.name, field, 'delete', !!checked)
                                      }
                                      disabled={
                                        roles?.find(r => r.id === selectedRoleId)?.is_system || 
                                        !isChecked(selectedRoleId, table.name, field, 'view')
                                      }
                                    />
                                  </TableCell>
                                </TableRow>
                              ))}
                            </React.Fragment>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8">
                              No tables available
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  
                  <div className="mt-6 text-sm text-muted-foreground">
                    <p>• <strong>View</strong>: Controls whether the role can see the table/field</p>
                    <p>• <strong>Edit</strong>: Controls whether the role can modify the field (requires View permission)</p>
                    <p>• <strong>Delete</strong>: Controls whether the role can delete records (requires View permission)</p>
                    <p>• System roles have predefined permissions that cannot be modified</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PermissionsPage;
