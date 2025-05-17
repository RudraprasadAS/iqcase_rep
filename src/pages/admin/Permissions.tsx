
import { useState, useEffect } from "react";
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

interface Permission {
  id: string;
  role_id: string;
  module_name: string;
  field_name: string | null;
  can_view: boolean;
  can_edit: boolean;
}

interface TableInfo {
  name: string;
  schema: string;
  fields: string[];
}

const PermissionsPage = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("tables");
  
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
      // This is a simplified approach. In a real implementation, you might want to use
      // a dedicated function to get table information or have an API endpoint for this
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
  
  // Fetch all permissions
  const { data: permissions, isLoading: permissionsLoading } = useQuery({
    queryKey: ["permissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("permissions")
        .select("*");
        
      if (error) throw error;
      return data as Permission[];
    },
  });

  // Update permission
  const updatePermission = useMutation({
    mutationFn: async ({ 
      roleId, 
      moduleName, 
      fieldName = null, 
      canView, 
      canEdit 
    }: { 
      roleId: string;
      moduleName: string;
      fieldName?: string | null;
      canView: boolean;
      canEdit: boolean;
    }) => {
      // Check if permission already exists
      const { data: existingPermission } = await supabase
        .from("permissions")
        .select("id")
        .eq("role_id", roleId)
        .eq("module_name", moduleName)
        .eq("field_name", fieldName)
        .single();

      if (existingPermission) {
        // Update existing permission
        const { data, error } = await supabase
          .from("permissions")
          .update({
            can_view: canView,
            can_edit: canEdit,
            updated_at: new Date().toISOString()
          })
          .eq("id", existingPermission.id);
          
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
            can_edit: canEdit
          }]);
          
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
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

  const handlePermissionChange = (
    roleId: string,
    moduleName: string,
    fieldName: string | null,
    type: 'view' | 'edit',
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

    updatePermission.mutate({
      roleId,
      moduleName,
      fieldName,
      canView: type === 'view' ? checked : existingPermission?.can_view || false,
      canEdit: type === 'edit' ? checked : existingPermission?.can_edit || false
    });
  };

  const isChecked = (
    roleId: string,
    moduleName: string,
    fieldName: string | null,
    type: 'view' | 'edit'
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

    return type === 'view' ? !!permission?.can_view : !!permission?.can_edit;
  };

  // Define available modules for the tabs
  const modules = [
    { id: "tables", name: "Tables" },
    { id: "reports", name: "Reports" },
    { id: "dashboards", name: "Dashboards" },
    { id: "admin", name: "Admin" },
  ];

  // Filter tables for the current tab/module
  const getTablesForModule = (moduleId: string) => {
    if (!tables) return [];
    
    switch (moduleId) {
      case "tables":
        return tables.filter(t => 
          !t.name.startsWith('report_') && 
          !t.name.startsWith('dashboard_') &&
          !t.name.startsWith('pg_')
        );
      case "reports":
        return tables.filter(t => t.name.startsWith('report_'));
      case "dashboards":
        return tables.filter(t => t.name.startsWith('dashboard_'));
      case "admin":
        return tables.filter(t => 
          t.name === 'roles' || 
          t.name === 'permissions' || 
          t.name === 'users'
        );
      default:
        return tables;
    }
  };

  const isLoading = rolesLoading || tablesLoading || permissionsLoading;
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Permission Matrix</h1>
          <p className="text-muted-foreground">Manage permissions by role and database entity</p>
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
              {/* Module tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="mb-6 overflow-x-auto flex w-full justify-start">
                  {modules.map(module => (
                    <TabsTrigger 
                      key={module.id}
                      value={module.id}
                      className="min-w-[100px]"
                    >
                      {module.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {modules.map(module => (
                  <TabsContent key={module.id} value={module.id} className="mt-0">
                    <div className="overflow-x-auto">
                      {getTablesForModule(module.id).length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="min-w-[200px]">Table/Entity</TableHead>
                              {roles?.map(role => (
                                <TableHead key={role.id} colSpan={2} className="text-center border-l">
                                  {role.name}
                                  {role.is_system && <span className="ml-1 text-xs text-muted-foreground">(System)</span>}
                                </TableHead>
                              ))}
                            </TableRow>
                            <TableRow>
                              <TableHead>Field</TableHead>
                              {roles?.map(role => (
                                <React.Fragment key={role.id}>
                                  <TableHead className="text-center border-l w-[80px]">View</TableHead>
                                  <TableHead className="text-center w-[80px]">Edit</TableHead>
                                </React.Fragment>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {getTablesForModule(module.id).map(table => (
                              <React.Fragment key={table.name}>
                                {/* Table-level permissions */}
                                <TableRow className="bg-muted/50">
                                  <TableCell className="font-medium">
                                    {table.name} (Entire table)
                                  </TableCell>
                                  {roles?.map(role => (
                                    <React.Fragment key={role.id}>
                                      <TableCell className="text-center border-l">
                                        <Checkbox 
                                          checked={isChecked(role.id, table.name, null, 'view')}
                                          onCheckedChange={(checked) => 
                                            handlePermissionChange(role.id, table.name, null, 'view', !!checked)
                                          }
                                          disabled={role.is_system}
                                        />
                                      </TableCell>
                                      <TableCell className="text-center">
                                        <Checkbox 
                                          checked={isChecked(role.id, table.name, null, 'edit')}
                                          onCheckedChange={(checked) => 
                                            handlePermissionChange(role.id, table.name, null, 'edit', !!checked)
                                          }
                                          disabled={role.is_system}
                                        />
                                      </TableCell>
                                    </React.Fragment>
                                  ))}
                                </TableRow>
                                
                                {/* Field-level permissions - commented out for now as it can get very large
                                {table.fields?.map(field => (
                                  <TableRow key={`${table.name}-${field}`}>
                                    <TableCell className="pl-8">
                                      {field}
                                    </TableCell>
                                    {roles?.map(role => (
                                      <React.Fragment key={role.id}>
                                        <TableCell className="text-center border-l">
                                          <Checkbox 
                                            checked={isChecked(role.id, table.name, field, 'view')}
                                            onCheckedChange={(checked) => 
                                              handlePermissionChange(role.id, table.name, field, 'view', !!checked)
                                            }
                                            disabled={role.is_system}
                                          />
                                        </TableCell>
                                        <TableCell className="text-center">
                                          <Checkbox 
                                            checked={isChecked(role.id, table.name, field, 'edit')}
                                            onCheckedChange={(checked) => 
                                              handlePermissionChange(role.id, table.name, field, 'edit', !!checked)
                                            }
                                            disabled={role.is_system}
                                          />
                                        </TableCell>
                                      </React.Fragment>
                                    ))}
                                  </TableRow>
                                ))}
                                */}
                              </React.Fragment>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="text-center py-6 text-muted-foreground">
                          No tables found for this module.
                        </div>
                      )}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
              
              <div className="mt-6 text-sm text-muted-foreground">
                <p>Note: System roles (Admin) have predefined permissions that cannot be modified.</p>
                <p>Changes take effect immediately and will be applied to all users with the corresponding role.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PermissionsPage;
