
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  name: z.string().min(2, { message: "Role name must be at least 2 characters" }),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateRoleDialog({ open, onOpenChange, onSuccess }: CreateRoleDialogProps) {
  const [error, setError] = useState<string | null>(null);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });
  
  // Basic permissions structure
  const [permissions, setPermissions] = useState({
    cases: {
      view: false,
      create: false,
      edit: false,
      delete: false,
    },
    users: {
      view: false,
      create: false,
      edit: false,
      delete: false,
    },
    reports: {
      view: false,
      create: false,
      edit: false,
      delete: false,
    },
  });

  const createRole = useMutation({
    mutationFn: async (values: FormValues) => {
      // First, create the role
      const { data, error } = await supabase
        .from("roles")
        .insert([
          {
            name: values.name,
            description: values.description || null,
            is_system: false,
            role_type: "custom",
          },
        ])
        .select();
        
      if (error) throw new Error(error.message);
      
      // Then, if we have a role ID, create the permissions
      if (data && data[0] && data[0].id) {
        const roleId = data[0].id;
        
        // Create permissions for each module
        const permissionPromises = [];
        
        for (const [module, actions] of Object.entries(permissions)) {
          for (const [action, value] of Object.entries(actions)) {
            if (value) {
              permissionPromises.push(
                supabase.from("permissions").insert({
                  role_id: roleId,
                  module_name: module,
                  field_name: action,
                  can_view: action === 'view',
                  can_edit: action === 'edit',
                })
              );
            }
          }
        }
        
        // Wait for all permissions to be created
        await Promise.all(permissionPromises);
      }
      
      return data;
    },
    onError: (error: Error) => {
      setError(error.message);
    },
    onSuccess: () => {
      form.reset();
      setPermissions({
        cases: { view: false, create: false, edit: false, delete: false },
        users: { view: false, create: false, edit: false, delete: false },
        reports: { view: false, create: false, edit: false, delete: false },
      });
      setError(null);
      onSuccess();
    },
  });
  
  function onSubmit(values: FormValues) {
    createRole.mutate(values);
  }

  const handlePermissionChange = (module: string, action: string, checked: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [module]: {
        ...prev[module as keyof typeof prev],
        [action]: checked
      }
    }));
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Role</DialogTitle>
          <DialogDescription>
            Add a new role to the system. Roles define what users can do in the application.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            {error && (
              <div className="bg-destructive/10 p-3 rounded-md text-destructive text-sm">
                {error}
              </div>
            )}
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter role name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the purpose of this role"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Permissions</h3>
              <p className="text-sm text-muted-foreground">
                Define what this role can access and modify
              </p>
              
              <Accordion type="multiple" className="w-full">
                {/* Cases Module Permissions */}
                <AccordionItem value="cases">
                  <AccordionTrigger className="text-sm">Cases Module</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="cases-view" 
                          checked={permissions.cases.view}
                          onCheckedChange={(checked) => 
                            handlePermissionChange('cases', 'view', checked as boolean)
                          }
                        />
                        <label htmlFor="cases-view" className="text-sm font-medium">
                          View Cases
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="cases-create" 
                          checked={permissions.cases.create}
                          onCheckedChange={(checked) => 
                            handlePermissionChange('cases', 'create', checked as boolean)
                          }
                        />
                        <label htmlFor="cases-create" className="text-sm font-medium">
                          Create Cases
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="cases-edit" 
                          checked={permissions.cases.edit}
                          onCheckedChange={(checked) => 
                            handlePermissionChange('cases', 'edit', checked as boolean)
                          }
                        />
                        <label htmlFor="cases-edit" className="text-sm font-medium">
                          Edit Cases
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="cases-delete" 
                          checked={permissions.cases.delete}
                          onCheckedChange={(checked) => 
                            handlePermissionChange('cases', 'delete', checked as boolean)
                          }
                        />
                        <label htmlFor="cases-delete" className="text-sm font-medium">
                          Delete Cases
                        </label>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                {/* Users Module Permissions */}
                <AccordionItem value="users">
                  <AccordionTrigger className="text-sm">Users Module</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="users-view" 
                          checked={permissions.users.view}
                          onCheckedChange={(checked) => 
                            handlePermissionChange('users', 'view', checked as boolean)
                          }
                        />
                        <label htmlFor="users-view" className="text-sm font-medium">
                          View Users
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="users-create" 
                          checked={permissions.users.create}
                          onCheckedChange={(checked) => 
                            handlePermissionChange('users', 'create', checked as boolean)
                          }
                        />
                        <label htmlFor="users-create" className="text-sm font-medium">
                          Create Users
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="users-edit" 
                          checked={permissions.users.edit}
                          onCheckedChange={(checked) => 
                            handlePermissionChange('users', 'edit', checked as boolean)
                          }
                        />
                        <label htmlFor="users-edit" className="text-sm font-medium">
                          Edit Users
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="users-delete" 
                          checked={permissions.users.delete}
                          onCheckedChange={(checked) => 
                            handlePermissionChange('users', 'delete', checked as boolean)
                          }
                        />
                        <label htmlFor="users-delete" className="text-sm font-medium">
                          Delete Users
                        </label>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                {/* Reports Module Permissions */}
                <AccordionItem value="reports">
                  <AccordionTrigger className="text-sm">Reports Module</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="reports-view" 
                          checked={permissions.reports.view}
                          onCheckedChange={(checked) => 
                            handlePermissionChange('reports', 'view', checked as boolean)
                          }
                        />
                        <label htmlFor="reports-view" className="text-sm font-medium">
                          View Reports
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="reports-create" 
                          checked={permissions.reports.create}
                          onCheckedChange={(checked) => 
                            handlePermissionChange('reports', 'create', checked as boolean)
                          }
                        />
                        <label htmlFor="reports-create" className="text-sm font-medium">
                          Create Reports
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="reports-edit" 
                          checked={permissions.reports.edit}
                          onCheckedChange={(checked) => 
                            handlePermissionChange('reports', 'edit', checked as boolean)
                          }
                        />
                        <label htmlFor="reports-edit" className="text-sm font-medium">
                          Edit Reports
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="reports-delete" 
                          checked={permissions.reports.delete}
                          onCheckedChange={(checked) => 
                            handlePermissionChange('reports', 'delete', checked as boolean)
                          }
                        />
                        <label htmlFor="reports-delete" className="text-sm font-medium">
                          Delete Reports
                        </label>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
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
                type="submit"
                disabled={createRole.isPending}
              >
                {createRole.isPending ? "Creating..." : "Create Role"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
