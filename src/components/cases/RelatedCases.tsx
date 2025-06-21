import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Link2, Plus, Trash2, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { triggerRelatedCaseNotification } from '@/utils/notificationTriggers';

interface RelatedCase {
  id: string;
  relationship_type: string;
  related_case_id: string;
  related_case?: {
    id: string;
    title: string;
    status: string;
    priority: string;
  };
}

interface AvailableCase {
  id: string;
  title: string;
  status: string;
}

interface RelatedCasesProps {
  caseId: string;
}

const RelatedCases = ({ caseId }: RelatedCasesProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [relatedCases, setRelatedCases] = useState<RelatedCase[]>([]);
  const [availableCases, setAvailableCases] = useState<AvailableCase[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [selectedRelationType, setSelectedRelationType] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [internalUserId, setInternalUserId] = useState<string | null>(null);

  const relationshipTypes = [
    { value: 'duplicate', label: 'Duplicate' },
    { value: 'related', label: 'Related' },
    { value: 'blocks', label: 'Blocks' },
    { value: 'blocked_by', label: 'Blocked By' },
    { value: 'parent', label: 'Parent' },
    { value: 'child', label: 'Child' }
  ];

  useEffect(() => {
    if (user) {
      fetchInternalUserId();
    }
  }, [user]);

  useEffect(() => {
    if (caseId) {
      fetchRelatedCases();
      fetchAvailableCases();
    }
  }, [caseId]);

  const fetchInternalUserId = async () => {
    if (!user) return;

    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (userError) {
        console.error('User lookup error:', userError);
        return;
      }

      setInternalUserId(userData.id);
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
          related_case:cases!related_cases_related_case_id_fkey(id, title, status, priority)
        `)
        .eq('case_id', caseId);

      if (error) {
        console.error('Error fetching related cases:', error);
        throw error;
      }

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
        .limit(50);

      if (error) throw error;
      setAvailableCases(data || []);
    } catch (error) {
      console.error('Error fetching available cases:', error);
    }
  };

  const addRelatedCase = async () => {
    if (!selectedCaseId || !selectedRelationType || !internalUserId) {
      toast({
        title: "Error",
        description: "Please select both a case and relationship type",
        variant: "destructive"
      });
      return;
    }

    setAdding(true);
    try {
      const { error } = await supabase
        .from('related_cases')
        .insert({
          case_id: caseId,
          related_case_id: selectedCaseId,
          relationship_type: selectedRelationType,
          created_by: internalUserId
        });

      if (error) {
        console.error('Error adding related case:', error);
        throw error;
      }

      // Get case details for notification
      const { data: caseData } = await supabase
        .from('cases')
        .select('title')
        .eq('id', caseId)
        .single();

      // Trigger notifications
      if (caseData) {
        await triggerRelatedCaseNotification(
          caseId,
          caseData.title,
          selectedCaseId,
          internalUserId
        );
      }

      setSelectedCaseId('');
      setSelectedRelationType('');
      await fetchRelatedCases();
      
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
    } finally {
      setAdding(false);
    }
  };

  const removeRelatedCase = async (relationshipId: string) => {
    try {
      const { error } = await supabase
        .from('related_cases')
        .delete()
        .eq('id', relationshipId);

      if (error) throw error;
      
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

  const getRelationshipLabel = (type: string) => {
    const relation = relationshipTypes.find(r => r.value === type);
    return relation?.label || type;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Link2 className="h-5 w-5 mr-2" />
            Related Cases
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading related cases...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Link2 className="h-5 w-5 mr-2" />
          Related Cases ({relatedCases.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Select value={selectedCaseId} onValueChange={setSelectedCaseId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select case..." />
            </SelectTrigger>
            <SelectContent>
              {availableCases.map((case_) => (
                <SelectItem key={case_.id} value={case_.id}>
                  {case_.title} ({case_.status})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedRelationType} onValueChange={setSelectedRelationType}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Type..." />
            </SelectTrigger>
            <SelectContent>
              {relationshipTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            onClick={addRelatedCase} 
            size="sm" 
            disabled={adding || !selectedCaseId || !selectedRelationType}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2">
          {relatedCases.map((relatedCase) => (
            <div key={relatedCase.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3 flex-1">
                <Badge variant="outline">
                  {getRelationshipLabel(relatedCase.relationship_type)}
                </Badge>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {relatedCase.related_case?.title || 'Unknown Case'}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={`text-xs ${getStatusColor(relatedCase.related_case?.status || '')}`}>
                      {relatedCase.related_case?.status || 'Unknown'}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {relatedCase.related_case?.priority || 'Unknown'}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/cases/${relatedCase.related_case_id}`)}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRelatedCase(relatedCase.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {relatedCases.length === 0 && (
            <div className="text-center text-muted-foreground py-4">
              No related cases
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RelatedCases;
