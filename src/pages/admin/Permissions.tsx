
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Role } from "@/types/roles";

const PermissionsPage = () => {
  const [selectedModule, setSelectedModule] = useState<string>("cases");
  
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
  
  // Fetch permissions for the selected module
  const { data: permissions, isLoading: permissionsLoading } = useQuery({
    queryKey: ["permissions", selectedModule],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("permissions")
        .select("*")
        .eq("module_name", selectedModule);
        
      if (error) throw error;
      return data;
    },
  });

  // Define available modules
  const modules = [
    { id: "cases", name: "Cases" },
    { id: "users", name: "Users" },
    { id: "reports", name: "Reports" },
    { id: "categories", name: "Categories" },
    { id: "dashboard", name: "Dashboard" },
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Permission Matrix</h1>
          <p className="text-muted-foreground">Manage permissions by role and module</p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Permission Matrix</CardTitle>
          <CardDescription>
            Configure what each role can do within different modules of the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rolesLoading || permissionsLoading ? (
            <div className="flex justify-center py-8">Loading permission data...</div>
          ) : (
            <div>
              {/* Module selector */}
              <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
                {modules.map(module => (
                  <button
                    key={module.id}
                    onClick={() => setSelectedModule(module.id)}
                    className={`px-4 py-2 rounded-md whitespace-nowrap ${
                      selectedModule === module.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {module.name}
                  </button>
                ))}
              </div>
              
              {/* Permission matrix */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-muted">
                      <th className="border px-4 py-2 text-left">Role</th>
                      <th className="border px-4 py-2 text-center">View</th>
                      <th className="border px-4 py-2 text-center">Create</th>
                      <th className="border px-4 py-2 text-center">Edit</th>
                      <th className="border px-4 py-2 text-center">Delete</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roles?.map(role => (
                      <tr key={role.id}>
                        <td className="border px-4 py-2 font-medium">{role.name}</td>
                        <td className="border px-4 py-2 text-center">
                          <input 
                            type="checkbox" 
                            className="h-4 w-4"
                            disabled={role.is_system}
                            defaultChecked={role.is_system || false}
                          />
                        </td>
                        <td className="border px-4 py-2 text-center">
                          <input 
                            type="checkbox" 
                            className="h-4 w-4"
                            disabled={role.is_system}
                            defaultChecked={role.is_system || false}
                          />
                        </td>
                        <td className="border px-4 py-2 text-center">
                          <input 
                            type="checkbox" 
                            className="h-4 w-4"
                            disabled={role.is_system}
                            defaultChecked={role.is_system || false}
                          />
                        </td>
                        <td className="border px-4 py-2 text-center">
                          <input 
                            type="checkbox" 
                            className="h-4 w-4"
                            disabled={role.is_system}
                            defaultChecked={role.is_system || false}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-6 text-sm text-muted-foreground">
                <p>Note: System roles (Admin) have predefined permissions that cannot be modified.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PermissionsPage;
