import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, ArrowUp, ArrowDown, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import CaseEditDialog from '@/components/cases/CaseEditDialog';
import SLABadge from '@/components/cases/SLABadge';
import StatusBadge from '@/components/cases/StatusBadge';
import PriorityBadge from '@/components/cases/PriorityBadge';

interface Case {
  id: string;
  title: string;
  status: string;
  priority: string;
  category_id?: string;
  submitted_by: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  description?: string;
  sla_due_at?: string;
}

interface SortConfig {
  key: keyof Case;
  direction: 'asc' | 'desc';
}

const Cases = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [slaFilter, setSlaFilter] = useState<string>('all');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'created_at', direction: 'desc' });
  const [editingCase, setEditingCase] = useState<Case | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchCases();
  }, [sortConfig]);

  const fetchCases = async () => {
    try {
      let query = supabase
        .from('cases')
        .select(`
          id,
          title,
          status,
          priority,
          category_id,
          submitted_by,
          assigned_to,
          created_at,
          updated_at,
          description,
          sla_due_at
        `);

      query = query.order(sortConfig.key, { ascending: sortConfig.direction === 'asc' });

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setCases(data || []);
    } catch (error) {
      console.error('Error fetching cases:', error);
      toast({
        title: "Error",
        description: "Failed to fetch cases",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key: keyof Case) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (key: keyof Case) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? 
      <ArrowUp className="h-4 w-4 ml-1" /> : 
      <ArrowDown className="h-4 w-4 ml-1" />;
  };

  const getSLAStatus = (case_: Case) => {
    if (!case_.sla_due_at || case_.status === 'closed' || case_.status === 'resolved') {
      return 'none';
    }
    
    const dueDate = new Date(case_.sla_due_at);
    const now = new Date();
    const timeDiff = dueDate.getTime() - now.getTime();
    const hoursRemaining = timeDiff / (1000 * 60 * 60);

    if (hoursRemaining < 0) return 'breached';
    if (hoursRemaining < 2) return 'critical';
    if (hoursRemaining < 24) return 'warning';
    return 'on_track';
  };

  const filteredCases = cases.filter(case_ => {
    const matchesSearch = case_.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      case_.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      case_.priority.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || case_.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || case_.priority === priorityFilter;
    
    const slaStatus = getSLAStatus(case_);
    const matchesSLA = slaFilter === 'all' || slaStatus === slaFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesSLA;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const generateCaseNumber = (id: string, createdAt: string) => {
    const year = new Date(createdAt).getFullYear();
    const shortId = id.slice(-6).toUpperCase();
    return `#${year}-${shortId}`;
  };

  const handleRowClick = (caseId: string) => {
    navigate(`/cases/${caseId}`);
  };

  const handleEditClick = (event: React.MouseEvent, case_: Case) => {
    event.stopPropagation();
    setEditingCase(case_);
    setIsEditDialogOpen(true);
  };

  const handleCaseUpdate = (updatedCase: Case) => {
    setCases(prevCases => 
      prevCases.map(case_ => 
        case_.id === updatedCase.id ? updatedCase : case_
      )
    );
    setIsEditDialogOpen(false);
    setEditingCase(null);
    toast({
      title: "Success",
      description: "Case updated successfully"
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
          <h1 className="text-3xl font-bold">Cases</h1>
          <Button onClick={() => navigate('/cases/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Case
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Cases</CardTitle>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search cases..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
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
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={slaFilter} onValueChange={setSlaFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="SLA" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All SLA</SelectItem>
                    <SelectItem value="breached">Breached</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="on_track">On Track</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/30"
                    onClick={() => handleSort('id')}
                  >
                    <div className="flex items-center">
                      Case Number
                      {getSortIcon('id')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/30"
                    onClick={() => handleSort('title')}
                  >
                    <div className="flex items-center">
                      Title
                      {getSortIcon('title')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/30"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center">
                      Status
                      {getSortIcon('status')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/30"
                    onClick={() => handleSort('priority')}
                  >
                    <div className="flex items-center">
                      Priority
                      {getSortIcon('priority')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/30"
                    onClick={() => handleSort('sla_due_at')}
                  >
                    <div className="flex items-center">
                      SLA Status
                      {getSortIcon('sla_due_at')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/30"
                    onClick={() => handleSort('created_at')}
                  >
                    <div className="flex items-center">
                      Created
                      {getSortIcon('created_at')}
                    </div>
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCases.map((case_) => (
                  <TableRow 
                    key={case_.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleRowClick(case_.id)}
                  >
                    <TableCell className="font-medium">
                      {generateCaseNumber(case_.id, case_.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate">{case_.title}</div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={case_.status} />
                    </TableCell>
                    <TableCell>
                      <PriorityBadge priority={case_.priority} />
                    </TableCell>
                    <TableCell>
                      <SLABadge sla_due_at={case_.sla_due_at} status={case_.status} />
                    </TableCell>
                    <TableCell>{formatDate(case_.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/cases/${case_.id}`)}
                        >
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => handleEditClick(e, case_)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {filteredCases.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || slaFilter !== 'all' ? 'No cases found matching your filters.' : 'No cases found.'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <CaseEditDialog
        case={editingCase}
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setEditingCase(null);
        }}
        onCaseUpdate={handleCaseUpdate}
      />
    </>
  );
};

export default Cases;
