
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, FileText, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { 
  PermissionGuard, 
  FieldPermissionWrapper, 
  ButtonPermissionWrapper 
} from "@/components/auth";

const Cases = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  // Fetch cases data - remove the permission check that was blocking it
  const { data: cases, isLoading } = useQuery({
    queryKey: ["cases", searchQuery, statusFilter, priorityFilter],
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
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "destructive";
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "outline";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "default";
      case "in_progress": return "secondary";
      case "resolved": return "outline";
      case "closed": return "outline";
      default: return "outline";
    }
  };

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

        {/* Cases List */}
        <div className="grid gap-6">
          {isLoading ? (
            <div className="grid gap-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="pt-6">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : cases?.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <h2 className="text-2xl font-semibold mb-2">No cases found</h2>
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
              </CardContent>
            </Card>
          ) : (
            cases?.map((caseItem) => (
              <Card key={caseItem.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader 
                  className="pb-4"
                  onClick={() => navigate(`/cases/${caseItem.id}`)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{caseItem.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {caseItem.description}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <Badge variant={getPriorityColor(caseItem.priority)}>
                        {caseItem.priority}
                      </Badge>
                      <Badge variant={getStatusColor(caseItem.status)}>
                        {caseItem.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium">Category:</span>
                      <p>{caseItem.category?.name || 'Uncategorized'}</p>
                    </div>
                    
                    <div>
                      <span className="font-medium">Submitted by:</span>
                      <p>{caseItem.submitted_by_user?.name || 'Unknown'}</p>
                    </div>
                    
                    <div>
                      <span className="font-medium">Assigned to:</span>
                      <p>{caseItem.assigned_to_user?.name || 'Unassigned'}</p>
                    </div>
                    
                    <div>
                      <span className="font-medium">Location:</span>
                      <p>{caseItem.location || 'Not specified'}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-between items-center">
                    <div className="text-xs text-muted-foreground">
                      Created: {new Date(caseItem.created_at).toLocaleDateString()}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/cases/${caseItem.id}`);
                        }}
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </PermissionGuard>
  );
};

export default Cases;
