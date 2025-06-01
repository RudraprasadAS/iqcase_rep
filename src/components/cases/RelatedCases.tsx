
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Link2, Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface RelatedCase {
  id: string;
  relationship_type: string;
  related_case_id: string;
  created_at: string;
  cases: {
    id: string;
    title: string;
    status: string;
  };
}

interface CaseOption {
  id: string;
  title: string;
  status: string;
}

interface RelatedCasesProps {
  caseId: string;
}

const RelatedCases = ({ caseId }: RelatedCasesProps) => {
  const [relatedCases, setRelatedCases] = useState<RelatedCase[]>([]);
  const [availableCases, setAvailableCases] = useState<CaseOption[]>([]);
  const [filteredCases, setFilteredCases] = useState<CaseOption[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [relationshipType, setRelationshipType] = useState('related');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [internalUserId, setInternalUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchInternalUserId();
    }
  }, [user]);

  useEffect(() => {
    if (internalUserId) {
      fetchRelatedCases();
      fetchAvailableCases();
    }
  }, [caseId, internalUserId]);

  useEffect(() => {
    // Filter cases based on search term
    if (searchTerm.trim()) {
      const filtered = availableCases.filter(case_ => {
        const searchLower = searchTerm.toLowerCase();
        return (
          case_.title.toLowerCase().includes(searchLower) ||
          case_.id.toLowerCase().includes(searchLower) ||
          case_.id.slice(0, 8).toLowerCase().includes(searchLower)
        );
      });
      setFilteredCases(filtered);
    } else {
      setFilteredCases(availableCases);
    }
  }, [searchTerm, availableCases]);

  const fetchInternalUserId = async () => {
    if (!user) return;

    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (userError) {
        console.error('User lookup error:', userError);
        return;
      }

      if (userData) {
        setInternalUserId(userData.id);
      }
    } catch (error) {
      console.error('Error fetching internal user ID:', error);
    }
  };

  const fetchRelatedCases = async () => {
    try {
      const { data, error } = await supabase
        .from('related_cases')
        .select(`
          *,
          cases!related_cases_related_case_id_fkey (
            id,
            title,
            status
          )
        `)
        .eq('case_id', caseId);

      if (error) {
        console.error('Related cases fetch error:', error);
        throw error;
      }

      console.log('Related cases fetched:', data);
      setRelatedCases(data || []);
    } catch (error) {
      console.error('Error fetching related cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableCases = async () => {
    try {
      const { data, error } = await supabase
        .from('cases')
        .select('id, title, status')
        .neq('id', caseId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Cases fetch error:', error);
        throw error;
      }

      console.log('Available cases fetched:', data?.length || 0);
      setAvailableCases(data || []);
      setFilteredCases(data || []);
    } catch (error) {
      console.error('Error fetching available cases:', error);
    }
  };

  const addRelatedCase = async () => {
    if (!selectedCaseId || !internalUserId) {
      toast({
        title: "Error",
        description: "Please select a case",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('related_cases')
        .insert({
          case_id: caseId,
          related_case_id: selectedCaseId,
          relationship_type: relationshipType,
          created_by: internalUserId
        });

      if (error) {
        console.error('Related case insert error:', error);
        throw error;
      }

      // Log activity
      await supabase
        .from('case_activities')
        .insert({
          case_id: caseId,
          activity_type: 'related_case_added',
          description: `Related case added with relationship: ${relationshipType}`,
          performed_by: internalUserId
        });

      await fetchRelatedCases();
      setIsAddDialogOpen(false);
      setSelectedCaseId('');
      setRelationshipType('related');
      setSearchTerm('');
      
      toast({
        title: "Success",
        description: "Related case added successfully"
      });
    } catch (error) {
      console.error('Error adding related case:', error);
      toast({
        title: "Error",
        description: "Failed to add related case",
        variant: "destructive"
      });
    }
  };

  const removeRelatedCase = async (relationId: string) => {
    if (!internalUserId) return;

    try {
      const { error } = await supabase
        .from('related_cases')
        .delete()
        .eq('id', relationId);

      if (error) {
        console.error('Related case delete error:', error);
        throw error;
      }

      // Log activity
      await supabase
        .from('case_activities')
        .insert({
          case_id: caseId,
          activity_type: 'related_case_removed',
          description: 'Related case removed',
          performed_by: internalUserId
        });
      
      await fetchRelatedCases();
      toast({
        title: "Success",
        description: "Related case removed successfully"
      });
    } catch (error) {
      console.error('Error removing related case:', error);
      toast({
        title: "Error",
        description: "Failed to remove related case",
        variant: "destructive"
      });
    }
  };

  const getRelationshipTypeColor = (type: string) => {
    switch (type) {
      case 'duplicate': return 'bg-red-100 text-red-800';
      case 'blocked_by': return 'bg-orange-100 text-orange-800';
      case 'blocks': return 'bg-yellow-100 text-yellow-800';
      case 'parent': return 'bg-blue-100 text-blue-800';
      case 'child': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-green-600';
      case 'in_progress': return 'text-blue-600';
      case 'resolved': return 'text-purple-600';
      case 'closed': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return <div>Loading related cases...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center">
          <Link2 className="h-5 w-5 mr-2" />
          Related Cases ({relatedCases.length})
        </CardTitle>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Related Case
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Related Case</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Search Case</label>
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by title or case ID..."
                />
              </div>
              <div>
                <label className="text-sm font-medium">Select Case</label>
                <Select value={selectedCaseId} onValueChange={setSelectedCaseId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a case" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {filteredCases.length === 0 ? (
                      <div className="p-2 text-sm text-gray-500">
                        {searchTerm ? 'No cases found matching your search' : 'No cases available'}
                      </div>
                    ) : (
                      filteredCases.map((case_) => (
                        <SelectItem key={case_.id} value={case_.id}>
                          <div className="flex flex-col w-full">
                            <span className="font-medium truncate">{case_.title}</span>
                            <span className="text-xs text-muted-foreground">
                              ID: {case_.id.slice(0, 8)}... | Status: {case_.status}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Relationship Type</label>
                <Select value={relationshipType} onValueChange={setRelationshipType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="related">Related</SelectItem>
                    <SelectItem value="duplicate">Duplicate</SelectItem>
                    <SelectItem value="blocked_by">Blocked By</SelectItem>
                    <SelectItem value="blocks">Blocks</SelectItem>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="child">Child</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={addRelatedCase} disabled={!selectedCaseId}>
                  Add Relationship
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-3">
        {relatedCases.length === 0 ? (
          <div className="text-center text-muted-foreground py-4">
            No related cases
          </div>
        ) : (
          relatedCases.map((relation) => (
            <div key={relation.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRelationshipTypeColor(relation.relationship_type)}`}>
                    {relation.relationship_type.replace('_', ' ')}
                  </span>
                </div>
                <Link 
                  to={`/citizen/cases/${relation.related_case_id}`}
                  className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {relation.cases.title}
                </Link>
                <div className="text-sm text-muted-foreground">
                  <span className={`${getStatusColor(relation.cases.status)}`}>
                    {relation.cases.status.replace('_', ' ')}
                  </span>
                  <span className="mx-2">•</span>
                  ID: {relation.related_case_id.slice(0, 8)}...
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeRelatedCase(relation.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default RelatedCases;
