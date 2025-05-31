
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter, FileText } from 'lucide-react';
import StatusBadge from '@/components/cases/StatusBadge';
import PriorityBadge from '@/components/cases/PriorityBadge';
import SLABadge from '@/components/cases/SLABadge';

interface Case {
  id: string;
  title: string;
  status: string;
  priority: string;
  submitted_by: string;
  assigned_to?: string;
  created_at: string;
  sla_due_at?: string;
  location?: string;
}

const Cases = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [filteredCases, setFilteredCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  useEffect(() => {
    fetchCases();
  }, []);

  useEffect(() => {
    filterCases();
  }, [cases, searchTerm, statusFilter, priorityFilter]);

  const fetchCases = async () => {
    try {
      const { data, error } = await supabase
        .from('cases')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCases(data || []);
    } catch (error) {
      console.error('Error fetching cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCases = () => {
    let filtered = cases;

    if (searchTerm) {
      filtered = filtered.filter(case_ => 
        case_.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        case_.submitted_by.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (case_.location && case_.location.toLowerCase().includes(searchTerm.toLowerCase()))
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

  const generateCaseNumber = (id: string, createdAt: string) => {
    const year = new Date(createdAt).getFullYear();
    const shortId = id.slice(-6).toUpperCase();
    return `#${year}-${shortId}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading cases...</div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Cases - IQCase</title>
      </Helmet>

      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Cases</h1>
            <p className="text-muted-foreground mt-1">
              Manage and track all support cases
            </p>
          </div>
          <Link to="/cases/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Case
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cases</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cases.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Cases</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {cases.filter(c => c.status === 'open').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {cases.filter(c => c.status === 'in_progress').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {cases.filter(c => c.status === 'resolved').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search cases..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Cases List */}
        <Card>
          <CardHeader>
            <CardTitle>Cases ({filteredCases.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredCases.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No cases found</h3>
                <p className="text-muted-foreground mb-4">
                  {cases.length === 0 
                    ? "Get started by creating your first case." 
                    : "Try adjusting your search criteria."
                  }
                </p>
                <Link to="/cases/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Case
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCases.map((case_) => (
                  <Link
                    key={case_.id}
                    to={`/cases/${case_.id}`}
                    className="block p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-medium">
                            {generateCaseNumber(case_.id, case_.created_at)}
                          </h3>
                          <StatusBadge status={case_.status} />
                          <PriorityBadge priority={case_.priority} />
                          <SLABadge sla_due_at={case_.sla_due_at} status={case_.status} />
                        </div>
                        <p className="text-sm font-medium mb-1">{case_.title}</p>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>Submitted by: {case_.submitted_by}</span>
                          <span>Created: {formatDate(case_.created_at)}</span>
                          {case_.location && <span>Location: {case_.location}</span>}
                          {case_.assigned_to && <span>Assigned to: {case_.assigned_to}</span>}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Cases;
