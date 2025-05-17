
import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Role } from "@/types/roles";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronRight, Plus, Save } from "lucide-react";
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

interface UnsavedPermission {
  roleId: string;
  moduleName: string;
  fieldName: string | null;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

const PermissionsPage = () => {
  const queryClient = useQueryClient();
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [isCreateRoleDialogOpen, setIsCreateRoleDialogOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({});
  const [showSelectAll, setShowSelectAll] = useState<boolean>(false);
  const [unsavedChanges, setUnsavedChanges] = useState<UnsavedPermission[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
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

  // Save all permission changes
  const savePermissionsMutation = useMutation({
    mutationFn: async () => {
      if (unsavedChanges.length === 0) return;

      const permissionsToSave = unsavedChanges.map(change => ({
        role_id: change.roleId,
        module_name: change.moduleName,
        field_name: change.fieldName,
        can_view: change.canView,
        can_edit: change.canEdit,
        can_delete: change.canDelete
      }));

      const { data, error } = await supabase
        .from("permissions")
        .upsert(permissionsToSave, { 
          onConflict: 'role_id,module_name,field_name', 
          ignoreDuplicates: false 
        });
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissions", selectedRoleId] });
      toast({
        title: "Permissions saved",
        description: `All permission changes have been saved successfully.`
      });
      setUnsavedChanges([]);
      setHasUnsavedChanges(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error saving permissions",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleToggleTable = (tableName: string) => {
    setExpandedTables(prev => ({
      ...prev,
      [tableName]: !prev[tableName]
    }));
  };

  // Updated handle permission change to implement required behavior rules
  const handlePermissionChange = (
    roleId: string,
    moduleName: string,
    fieldName: string | null,
    type: 'view' | 'edit' | 'delete',
    checked: boolean
  ) => {
    // Find the role to check if it's a system role
    const role = roles?.find(r => r.id === roleId);
    
    // Only prevent modifications for system roles that are explicitly marked as is_system=true
    if (role?.is_system === true) {
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

    // Apply updated permission logic based on behavior rules
    let newCanView = existingPermission?.can_view || false;
    let newCanEdit = existingPermission?.can_edit || false; 
    let newCanDelete = existingPermission?.can_delete || false;

    if (type === 'view') {
      newCanView = checked;
      // If unchecking view, also uncheck edit and delete
      if (!checked) {
        newCanEdit = false;
        newCanDelete = false;
      }
    } else if (type === 'edit') {
      newCanEdit = checked;
      
      // If checking edit, auto-enable view
      if (checked) {
        newCanView = true;
      } 
      // If unchecking edit, auto-uncheck delete
      else {
        newCanDelete = false;
      }
    } else if (type === 'delete') {
      newCanDelete = checked;
      
      // If checking delete, auto-enable both view and edit
      if (checked) {
        newCanView = true;
        newCanEdit = true;
      }
      // If unchecking delete, no impact on other permissions
    }

    // Add to unsaved changes
    const changeKey = `${roleId}-${moduleName}-${fieldName || 'null'}`; 
    
    // Remove previous change for the same permission if exists
    const filteredChanges = unsavedChanges.filter(
      change => !(change.roleId === roleId && 
                 change.moduleName === moduleName && 
                 change.fieldName === fieldName)
    );
    
    // Add the new change
    setUnsavedChanges([
      ...filteredChanges,
      {
        roleId,
        moduleName,
        fieldName,
        canView: newCanView,
        canEdit: newCanEdit,
        canDelete: newCanDelete
      }
    ]);
    
    setHasUnsavedChanges(true);
  };

  // New function to handle bulk toggle for all fields in a table
  const handleBulkToggleForTable = (
    roleId: string,
    tableName: string,
    type: 'view' | 'edit' | 'delete',
    checked: boolean
  ) => {
    // Find the table info
    const tableInfo = tables?.find(t => t.name === tableName);
    if (!tableInfo) return;

    // Apply to table-level permission
    handlePermissionChange(roleId, tableName, null, type, checked);

    // Apply the same permission to all fields under this table
    if (tableInfo.fields) {
      tableInfo.fields.forEach(field => {
        handlePermissionChange(roleId, tableName, field, type, checked);
      });
    }

    // Auto-expand the table to show the affected fields
    if (checked && !expandedTables[tableName]) {
      setExpandedTables(prev => ({
        ...prev,
        [tableName]: true
      }));
    }
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

  const handleSaveChanges = () => {
    savePermissionsMutation.mutate();
  };

  const getEffectivePermission = (
    roleId: string,
    moduleName: string,
    fieldName: string | null,
    type: 'view' | 'edit' | 'delete'
  ): boolean => {
    // Check if there's an unsaved change
    const unsavedChange = unsavedChanges.find(
      change => change.roleId === roleId && 
                change.moduleName === moduleName && 
                change.fieldName === fieldName
    );

    if (unsavedChange) {
      if (type === 'view') return unsavedChange.canView;
      if (type === 'edit') return unsavedChange.canEdit;
      return unsavedChange.canDelete;
    }

    // For system roles specifically marked with is_system=true, return true for all permissions
    const role = roles?.find(r => r.id === roleId);
    if (role?.is_system === true) return true;

    // Check if permission exists in the database
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
                            {role.name} {role.is_system === true && "(System)"}
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
                
                <Button
                  onClick={handleSaveChanges}
                  disabled={savePermissionsMutation.isPending}
                  className={`ml-auto ${hasUnsavedChanges ? 'animate-pulse' : ''}`}
                >
                  <Save className="h-4 w-4 mr-2" /> Save Changes
                </Button>
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
                                      checked={getEffectivePermission(selectedRoleId, table.name, null, 'view')}
                                      onCheckedChange={(checked) => 
                                        handleBulkToggleForTable(selectedRoleId, table.name, 'view', !!checked)
                                      }
                                      disabled={roles?.find(r => r.id === selectedRoleId)?.is_system === true}
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
                                          !getEffectivePermission(selectedRoleId, table.name, null, 'view')
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
                                      checked={getEffectivePermission(selectedRoleId, table.name, null, 'edit')}
                                      onCheckedChange={(checked) => 
                                        handleBulkToggleForTable(selectedRoleId, table.name, 'edit', !!checked)
                                      }
                                      disabled={
                                        roles?.find(r => r.id === selectedRoleId)?.is_system === true
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
                                          !getEffectivePermission(selectedRoleId, table.name, null, 'edit')
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
                                      checked={getEffectivePermission(selectedRoleId, table.name, null, 'delete')}
                                      onCheckedChange={(checked) => 
                                        handleBulkToggleForTable(selectedRoleId, table.name, 'delete', !!checked)
                                      }
                                      disabled={
                                        roles?.find(r => r.id === selectedRoleId)?.is_system === true
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
                                          !getEffectivePermission(selectedRoleId, table.name, null, 'delete')
                                        )}
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
                                      checked={getEffectivePermission(selectedRoleId, table.name, field, 'view')}
                                      onCheckedChange={(checked) => 
                                        handlePermissionChange(selectedRoleId, table.name, field, 'view', !!checked)
                                      }
                                      disabled={roles?.find(r => r.id === selectedRoleId)?.is_system === true}
                                    />
                                  </TableCell>
                                  <TableCell className="text-center py-2">
                                    <Checkbox 
                                      checked={getEffectivePermission(selectedRoleId, table.name, field, 'edit')}
                                      onCheckedChange={(checked) => 
                                        handlePermissionChange(selectedRoleId, table.name, field, 'edit', !!checked)
                                      }
                                      disabled={
                                        roles?.find(r => r.id === selectedRoleId)?.is_system === true
                                      }
                                    />
                                  </TableCell>
                                  <TableCell className="text-center py-2">
                                    <Checkbox 
                                      checked={getEffectivePermission(selectedRoleId, table.name, field, 'delete')}
                                      onCheckedChange={(checked) => 
                                        handlePermissionChange(selectedRoleId, table.name, field, 'delete', !!checked)
                                      }
                                      disabled={
                                        roles?.find(r => r.id === selectedRoleId)?.is_system === true
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
                    <p>• <strong>Edit</strong>: Controls whether the role can modify the field</p>
                    <p>• <strong>Delete</strong>: Controls whether the role can delete records</p>
                    <p className="mt-2 border-l-2 pl-3 border-primary/50">
                      <strong>Permission Rules:</strong><br/>
                      - Selecting Edit will automatically select View<br/>
                      - Selecting Delete will automatically select Edit and View<br/>
                      - Deselecting View will deselect Edit and Delete<br/>
                      - Deselecting Edit will deselect Delete
                    </p>
                    <p className="mt-2 border-l-2 pl-3 border-primary/50">
                      <strong>Bulk Toggles:</strong><br/>
                      - Checking a table-level permission applies that permission to all fields<br/>
                      - Individual field permissions can still be manually adjusted afterward
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleSaveChanges}
            disabled={savePermissionsMutation.isPending || unsavedChanges.length === 0}
            className="w-full"
          >
            <Save className="h-4 w-4 mr-2" /> Save All Permission Changes
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PermissionsPage;
