
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
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

  // Fetch frontend registry elements to show available permissions
  const { data: frontendElements } = useQuery({
    queryKey: ["frontend-registry"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("frontend_registry")
        .select("*")
        .eq("is_active", true)
        .order("module", { ascending: true })
        .order("element_key", { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: open,
  });
  
  // Basic permissions structure based on frontend elements
  const [permissions, setPermissions] = useState<Record<string, { view: boolean; edit: boolean }>>({});

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
      
      // Then, if we have a role ID and permissions, create the permissions
      if (data && data[0] && data[0].id) {
        const roleId = data[0].id;
        
        // Create permissions for each selected element
        const permissionPromises = [];
        
        for (const [elementId, perms] of Object.entries(permissions)) {
          if (perms.view || perms.edit) {
            permissionPromises.push(
              supabase.from("permissions").insert({
                role_id: roleId,
                frontend_registry_id: elementId,
                can_view: perms.view,
                can_edit: perms.edit,
              })
            );
          }
        }
        
        // Wait for all permissions to be created
        if (permissionPromises.length > 0) {
          await Promise.all(permissionPromises);
        }
      }
      
      return data;
    },
    onError: (error: Error) => {
      setError(error.message);
    },
    onSuccess: () => {
      form.reset();
      setPermissions({});
      setError(null);
      onSuccess();
    },
  });
  
  function onSubmit(values: FormValues) {
    createRole.mutate(values);
  }

  const handlePermissionChange = (elementId: string, type: 'view' | 'edit', checked: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [elementId]: {
        ...prev[elementId],
        [type]: checked,
        // If setting edit to true, also set view to true
        ...(type === 'edit' && checked ? { view: true } : {}),
        // If setting view to false, also set edit to false
        ...(type === 'view' && !checked ? { edit: false } : {}),
      }
    }));
  };

  // Group frontend elements by module
  const groupedElements = frontendElements?.reduce((acc, element) => {
    if (!acc[element.module]) {
      acc[element.module] = [];
    }
    acc[element.module].push(element);
    return acc;
  }, {} as Record<string, typeof frontendElements>) || {};
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
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
                {Object.entries(groupedElements).map(([module, elements]) => (
                  <AccordionItem key={module} value={module}>
                    <AccordionTrigger className="text-sm capitalize">
                      {module.replace('_', ' ')} Module
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3">
                        {elements.map((element) => {
                          const elementPerms = permissions[element.id] || { view: false, edit: false };
                          return (
                            <div key={element.id} className="flex items-center justify-between p-2 border rounded">
                              <div className="flex-1">
                                <div className="font-medium text-sm">
                                  {element.label || element.element_key}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {element.element_type} • {element.screen}
                                </div>
                              </div>
                              <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                  <Checkbox 
                                    id={`${element.id}-view`}
                                    checked={elementPerms.view}
                                    onCheckedChange={(checked) => 
                                      handlePermissionChange(element.id, 'view', checked as boolean)
                                    }
                                  />
                                  <label htmlFor={`${element.id}-view`} className="text-sm">
                                    View
                                  </label>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  <Checkbox 
                                    id={`${element.id}-edit`}
                                    checked={elementPerms.edit}
                                    onCheckedChange={(checked) => 
                                      handlePermissionChange(element.id, 'edit', checked as boolean)
                                    }
                                  />
                                  <label htmlFor={`${element.id}-edit`} className="text-sm">
                                    Edit
                                  </label>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
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
