import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useModulePermission } from '@/hooks/useModulePermissions';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import {
  FileText,
  Plus,
  Search,
  Clock,
  AlertCircle,
  CheckCircle,
  Calendar,
  MapPin,
  User
} from 'lucide-react';

interface Case {
  id: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  sla_due_at: string | null;
  location: string | null;
  description: string;
  assigned_to?: string;
  submitted_by?: string;
  assigned_to_user?: { name: string };
  submitted_by_user?: { name: string };
  category?: { name: string };
}

const Cases = () => {
  const { toast } = useToast();
  const { hasViewPermission, hasEditPermission } = useModulePermission('cases');
  const { isAdmin, userInfo } = useRoleAccess();
  
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState<Case[]>([]);
  const [filteredCases, setFilteredCases] = useState<Case[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  useEffect(() => {
    // Admin or users with view permission can see cases
    if (isAdmin || hasViewPermission) {
      fetchCases();
    } else {
      setLoading(false);
    }
  }, [isAdmin, hasViewPermission]);

  useEffect(() => {
    filterCases();
  }, [cases, searchTerm, statusFilter, priorityFilter]);

  const fetchCases = async () => {
    try {
      setLoading(true);
      
      console.log('Fetching cases with RLS protection');
      console.log('User info:', userInfo);

      // RLS policies will automatically filter cases based on user access
      const { data, error } = await supabase
        .from('cases')
        .select(`
          *,
          assigned_to_user:users!cases_assigned_to_fkey(name),
          submitted_by_user:users!cases_submitted_by_fkey(name),
          category:case_categories!cases_category_id_fkey(name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Cases fetch error:', error);
        throw error;
      }

      console.log('Cases fetched successfully:', data?.length || 0, 'cases');
      setCases(data || []);

    } catch (error) {
      console.error('Error fetching cases:', error);
      toast({
        title: 'Error',
        description: 'Failed to load cases. Please check your permissions.',
        variant: 'destructive'
      });
      setCases([]);
    } finally {
      setLoading(false);
    }
  };

  const filterCases = () => {
    let filtered = cases;

    if (searchTerm) {
      filtered = filtered.filter(case_ =>
        case_.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        case_.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(case_ => case_.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(case_ => case_.priority === priorityFilter);
    }

    setFilteredCases(filtered);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'closed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-red-100 text-red-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'closed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isOverdue = (slaDueAt: string | null) => {
    if (!slaDueAt) return false;
    return new Date(slaDueAt) < new Date();
  };

  if (!isAdmin && !hasViewPermission) {
    return (
      <>
        <Helmet>
          <title>Access Denied - Cases</title>
        </Helmet>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-500">You don't have permission to view cases.</p>
          </div>
        </div>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Helmet>
          <title>Loading Cases...</title>
        </Helmet>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Cases - Case Management System</title>
      </Helmet>

      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Cases</h1>
            <p className="text-gray-600">Manage and track all cases</p>
          </div>
          {(isAdmin || hasEditPermission) && (
            <Link to="/cases/new">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                New Case
              </Button>
            </Link>
          )}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search cases..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Cases List */}
        {filteredCases.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {cases.length === 0 ? 'No cases accessible' : 'No cases match your filters'}
              </h3>
              <p className="text-gray-500 mb-4">
                {cases.length === 0 
                  ? 'You currently have access to no cases. Contact your administrator if this seems incorrect.'
                  : 'Try adjusting your search or filter criteria'
                }
              </p>
              {(isAdmin || hasEditPermission) && cases.length === 0 && (
                <Link to="/cases/new">
                  <Button>Create New Case</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredCases.map((case_) => (
              <Card key={case_.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {getStatusIcon(case_.status)}
                        <h3 className="text-lg font-semibold">{case_.title}</h3>
                        {case_.sla_due_at && isOverdue(case_.sla_due_at) && (
                          <Badge variant="destructive">Overdue</Badge>
                        )}
                      </div>
                      
                      <p className="text-gray-600 mb-3 line-clamp-2">{case_.description}</p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Created {formatDate(case_.created_at)}
                        </div>
                        {case_.location && (
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {case_.location}
                          </div>
                        )}
                        {case_.assigned_to_user && (
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            {case_.assigned_to_user.name}
                          </div>
                        )}
                        {case_.sla_due_at && (
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            Due {formatDate(case_.sla_due_at)}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end space-y-2">
                      <div className="flex space-x-2">
                        <Badge className={getPriorityColor(case_.priority)}>
                          {case_.priority}
                        </Badge>
                        <Badge className={getStatusColor(case_.status)}>
                          {case_.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <Link to={`/cases/${case_.id}`}>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Cases;
