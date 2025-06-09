
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, FileText, Filter, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { 
  PermissionGuard, 
  ButtonPermissionWrapper,
  FieldPermissionWrapper 
} from "@/components/auth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import PriorityBadge from "@/components/cases/PriorityBadge";
import StatusBadge from "@/components/cases/StatusBadge";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useFieldPermissions } from "@/hooks/useFieldPermissions";

const Cases = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const { userInfo } = useRoleAccess();

  // Get field-level permissions for the cases module
  const {
    canViewField,
    canEditField,
    getVisibleFields,
    isLoading: permissionsLoading
  } = useFieldPermissions('cases', [
    'title',
    'description', 
    'status',
    'priority',
    'category',
    'submitted_by',
    'assigned_to',
    'location',
    'created_at',
    'actions'
  ]);

  // Fetch cases data with role-based filtering
  const { data: cases, isLoading } = useQuery({
    queryKey: ["cases", searchQuery, statusFilter, priorityFilter, userInfo?.id],
    queryFn: async () => {
      let query = supabase
        .from("cases")
        .select(`
          *,
          category:case_categories(name),
          submitted_by_user:users!cases_submitted_by_fkey(name),
          assigned_to_user:users!cases_assigned_to_fkey(name)
        `)
        .order("created_at", { ascending: false });

      // Filter cases based on user role
      if (userInfo && userInfo.role.name !== 'super_admin' && userInfo.role.name !== 'admin') {
        // For non-admin users, only show cases they're assigned to or submitted by them
        query = query.or(`assigned_to.eq.${userInfo.id},submitted_by.eq.${userInfo.id}`);
      }

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      if (priorityFilter !== "all") {
        query = query.eq("priority", priorityFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!userInfo,
  });

  if (permissionsLoading) {
    return <div className="animate-pulse bg-gray-200 h-4 w-full rounded"></div>;
  }

  return (
    <PermissionGuard elementKey="cases" permissionType="view">
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Cases</h1>
            <p className="text-muted-foreground">Manage and track all cases</p>
          </div>
          
          <div className="flex gap-2">
            <ButtonPermissionWrapper elementKey="cases.export_cases">
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Export
              </Button>
            </ButtonPermissionWrapper>
            
            <ButtonPermissionWrapper elementKey="cases.create_case">
              <Button onClick={() => navigate("/cases/new")}>
                <Plus className="h-4 w-4 mr-2" />
                New Case
              </Button>
            </ButtonPermissionWrapper>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search cases..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <FieldPermissionWrapper elementKey="cases.status" permissionType="view">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </FieldPermissionWrapper>

              <FieldPermissionWrapper elementKey="cases.priority" permissionType="view">
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </FieldPermissionWrapper>
            </div>
          </CardContent>
        </Card>

        {/* Cases Table with Field-Level Permissions */}
        <Card>
          <CardHeader>
            <CardTitle>Cases List</CardTitle>
            <CardDescription>
              A comprehensive list of all cases in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                <p>Loading cases...</p>
              </div>
            ) : cases?.length === 0 ? (
              <div className="text-center py-8">
                <h3 className="text-lg font-medium mb-2">No cases found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || statusFilter !== "all" || priorityFilter !== "all"
                    ? "Try adjusting your search or filters"
                    : "Get started by creating your first case"}
                </p>
                <ButtonPermissionWrapper elementKey="cases.create_case">
                  <Button onClick={() => navigate("/cases/new")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Case
                  </Button>
                </ButtonPermissionWrapper>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    {canViewField('title') && <TableHead>Title</TableHead>}
                    {canViewField('status') && <TableHead>Status</TableHead>}
                    {canViewField('priority') && <TableHead>Priority</TableHead>}
                    {canViewField('category') && <TableHead>Category</TableHead>}
                    {canViewField('submitted_by') && <TableHead>Submitted By</TableHead>}
                    {canViewField('assigned_to') && <TableHead>Assigned To</TableHead>}
                    {canViewField('location') && <TableHead>Location</TableHead>}
                    {canViewField('created_at') && <TableHead>Created</TableHead>}
                    {canViewField('actions') && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cases?.map((caseItem) => (
                    <TableRow 
                      key={caseItem.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/cases/${caseItem.id}`)}
                    >
                      {canViewField('title') && (
                        <TableCell className="font-medium">
                          <FieldPermissionWrapper 
                            elementKey="cases.title" 
                            permissionType="view"
                          >
                            <div>
                              <div className="font-semibold">{caseItem.title}</div>
                              {canViewField('description') && (
                                <div className="text-sm text-muted-foreground truncate max-w-xs">
                                  {caseItem.description}
                                </div>
                              )}
                            </div>
                          </FieldPermissionWrapper>
                        </TableCell>
                      )}
                      
                      {canViewField('status') && (
                        <TableCell>
                          <FieldPermissionWrapper 
                            elementKey="cases.status" 
                            permissionType="view"
                          >
                            <StatusBadge status={caseItem.status} />
                          </FieldPermissionWrapper>
                        </TableCell>
                      )}
                      
                      {canViewField('priority') && (
                        <TableCell>
                          <FieldPermissionWrapper 
                            elementKey="cases.priority" 
                            permissionType="view"
                          >
                            <PriorityBadge priority={caseItem.priority} />
                          </FieldPermissionWrapper>
                        </TableCell>
                      )}
                      
                      {canViewField('category') && (
                        <TableCell>
                          <FieldPermissionWrapper 
                            elementKey="cases.category" 
                            permissionType="view"
                          >
                            {caseItem.category?.name || 'Uncategorized'}
                          </FieldPermissionWrapper>
                        </TableCell>
                      )}
                      
                      {canViewField('submitted_by') && (
                        <TableCell>
                          <FieldPermissionWrapper 
                            elementKey="cases.submitted_by" 
                            permissionType="view"
                          >
                            {caseItem.submitted_by_user?.name || 'Unknown'}
                          </FieldPermissionWrapper>
                        </TableCell>
                      )}
                      
                      {canViewField('assigned_to') && (
                        <TableCell>
                          <FieldPermissionWrapper 
                            elementKey="cases.assigned_to" 
                            permissionType="view"
                          >
                            {caseItem.assigned_to_user?.name || 'Unassigned'}
                          </FieldPermissionWrapper>
                        </TableCell>
                      )}
                      
                      {canViewField('location') && (
                        <TableCell className="max-w-xs truncate">
                          <FieldPermissionWrapper 
                            elementKey="cases.location" 
                            permissionType="view"
                          >
                            {caseItem.location || 'Not specified'}
                          </FieldPermissionWrapper>
                        </TableCell>
                      )}
                      
                      {canViewField('created_at') && (
                        <TableCell>
                          <FieldPermissionWrapper 
                            elementKey="cases.created_at" 
                            permissionType="view"
                          >
                            {new Date(caseItem.created_at).toLocaleDateString()}
                          </FieldPermissionWrapper>
                        </TableCell>
                      )}
                      
                      {canViewField('actions') && (
                        <TableCell>
                          <FieldPermissionWrapper 
                            elementKey="cases.actions" 
                            permissionType="edit"
                          >
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/cases/${caseItem.id}`);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </FieldPermissionWrapper>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
};

export default Cases;
