
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
  ButtonPermissionWrapper 
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

const Cases = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const { 
    userInfo, 
    isCitizen, 
    isCaseWorker, 
    hasFullCasesAccess, 
    canViewCases,
    canCreateCases,
    isLoading: roleLoading,
    error: roleError
  } = useRoleAccess();

  console.log("🔍 [Cases] Current user info:", userInfo);
  console.log("🔍 [Cases] User role:", userInfo?.role?.name);
  console.log("🔍 [Cases] Role loading:", roleLoading);
  console.log("🔍 [Cases] Role error:", roleError);
  console.log("🔍 [Cases] Is citizen:", isCitizen);
  console.log("🔍 [Cases] Is case worker:", isCaseWorker);
  console.log("🔍 [Cases] Can view cases:", canViewCases);

  // Show loading while role is being determined
  if (roleLoading) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p>Loading user permissions...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error if role loading failed
  if (roleError) {
    console.error("🔍 [Cases] Role access error:", roleError);
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-medium text-red-600 mb-2">Permission Error</h3>
            <p className="text-gray-500 mb-4">
              Unable to load user permissions: {roleError.message}
            </p>
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Block citizen access to internal cases page
  if (isCitizen) {
    console.log("🔍 [Cases] Citizen detected, redirecting to citizen portal");
    navigate("/citizen/dashboard", { replace: true });
    return null;
  }

  // Block access if user cannot view cases
  if (!canViewCases) {
    console.log("🔍 [Cases] User cannot view cases, showing access denied");
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-500 mb-4">
              You don't have permission to view cases.
            </p>
            <p className="text-sm text-gray-400">
              Current role: {userInfo?.role?.name || 'Unknown'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch cases data with role-based filtering
  const { data: cases, isLoading, error } = useQuery({
    queryKey: ["cases", searchQuery, statusFilter, priorityFilter, userInfo?.id],
    queryFn: async () => {
      console.log("🔍 [Cases] Fetching cases for user:", userInfo?.id, "role:", userInfo?.role?.name);
      
      let query = supabase
        .from("cases")
        .select(`
          *,
          category:case_categories(name),
          submitted_by_user:users!cases_submitted_by_fkey(name),
          assigned_to_user:users!cases_assigned_to_fkey(name)
        `)
        .order("created_at", { ascending: false });

      // Apply search filters
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
      
      if (error) {
        console.error("🔍 [Cases] Error fetching cases:", error);
        throw error;
      }
      
      console.log("🔍 [Cases] Fetched cases:", data?.length, "cases");
      return data;
    },
    enabled: !!userInfo && canViewCases,
  });

  if (error) {
    console.error("🔍 [Cases] Query error:", error);
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-medium text-red-600 mb-2">Error Loading Cases</h3>
            <p className="text-gray-500 mb-4">
              {error.message || "There was an error loading the cases. Please try again."}
            </p>
            <p className="text-sm text-gray-400 mb-4">
              This might be a permissions issue. Current role: {userInfo?.role?.name || 'Unknown'}
            </p>
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <PermissionGuard elementKey="cases" permissionType="view">
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Cases</h1>
            <p className="text-muted-foreground">
              {isCaseWorker 
                ? "Manage your assigned cases and tasks" 
                : hasFullCasesAccess 
                  ? "Manage and track all cases" 
                  : "View your related cases"
              }
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Current role: {userInfo?.role?.name} | User ID: {userInfo?.id}
            </p>
          </div>
          
          <div className="flex gap-2">
            {hasFullCasesAccess && (
              <ButtonPermissionWrapper elementKey="cases.export_cases">
                <Button variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </ButtonPermissionWrapper>
            )}
            
            {canCreateCases && (
              <ButtonPermissionWrapper elementKey="cases.create_case">
                <Button onClick={() => navigate("/cases/new")}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Case
                </Button>
              </ButtonPermissionWrapper>
            )}
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
            </div>
          </CardContent>
        </Card>

        {/* Cases Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              {isCaseWorker 
                ? "My Cases & Tasks" 
                : hasFullCasesAccess 
                  ? "Cases List" 
                  : "My Related Cases"
              }
            </CardTitle>
            <CardDescription>
              {isCaseWorker 
                ? "Cases assigned to you, tasks you're responsible for, and cases where you're involved"
                : hasFullCasesAccess 
                  ? "A comprehensive list of all cases in the system"
                  : "Cases you're involved with or have access to"
              }
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
                    : isCaseWorker 
                      ? "No cases have been assigned to you yet or you haven't been involved in any cases"
                      : "Get started by creating your first case"}
                </p>
                {canCreateCases && (
                  <ButtonPermissionWrapper elementKey="cases.create_case">
                    <Button onClick={() => navigate("/cases/new")}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Case
                    </Button>
                  </ButtonPermissionWrapper>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Submitted By</TableHead>
                    {hasFullCasesAccess && <TableHead>Assigned To</TableHead>}
                    <TableHead>Location</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cases?.map((caseItem) => (
                    <TableRow 
                      key={caseItem.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/cases/${caseItem.id}`)}
                    >
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-semibold">{caseItem.title}</div>
                          <div className="text-sm text-muted-foreground truncate max-w-xs">
                            {caseItem.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={caseItem.status} />
                      </TableCell>
                      <TableCell>
                        <PriorityBadge priority={caseItem.priority} />
                      </TableCell>
                      <TableCell>
                        {caseItem.category?.name || 'Uncategorized'}
                      </TableCell>
                      <TableCell>
                        {caseItem.submitted_by_user?.name || 'Unknown'}
                      </TableCell>
                      {hasFullCasesAccess && (
                        <TableCell>
                          {caseItem.assigned_to_user?.name || 'Unassigned'}
                        </TableCell>
                      )}
                      <TableCell className="max-w-xs truncate">
                        {caseItem.location || 'Not specified'}
                      </TableCell>
                      <TableCell>
                        {new Date(caseItem.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
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
                      </TableCell>
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
