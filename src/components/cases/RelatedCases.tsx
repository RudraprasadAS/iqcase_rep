
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Link, GitBranch, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface RelatedCase {
  id: string;
  related_case_id: string;
  relationship_type: string;
  created_at: string;
  cases: {
    id: string;
    title: string;
    status: string;
    priority: string;
  };
}

interface RelatedCasesProps {
  caseId: string;
}

const RelatedCases = ({ caseId }: RelatedCasesProps) => {
  const [relatedCases, setRelatedCases] = useState<RelatedCase[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newRelatedCaseId, setNewRelatedCaseId] = useState('');
  const [relationshipType, setRelationshipType] = useState('related');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchRelatedCases();
  }, [caseId]);

  const fetchRelatedCases = async () => {
    try {
      const { data, error } = await supabase
        .from('related_cases')
        .select(`
          *,
          cases!related_cases_related_case_id_fkey (
            id,
            title,
            status,
            priority
          )
        `)
        .eq('case_id', caseId);

      if (error) throw error;
      setRelatedCases(data || []);
    } catch (error) {
      console.error('Error fetching related cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const addRelatedCase = async () => {
    if (!newRelatedCaseId.trim() || !user) return;

    try {
      const { error } = await supabase
        .from('related_cases')
        .insert({
          case_id: caseId,
          related_case_id: newRelatedCaseId.trim(),
          relationship_type: relationshipType,
          created_by: user.id
        });

      if (error) throw error;

      await fetchRelatedCases();
      setIsAddDialogOpen(false);
      setNewRelatedCaseId('');
      setRelationshipType('related');
      
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
    try {
      const { error } = await supabase
        .from('related_cases')
        .delete()
        .eq('id', relationId);

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

  const getRelationshipColor = (type: string) => {
    switch (type) {
      case 'duplicate': return 'bg-red-100 text-red-800';
      case 'follow-up': return 'bg-blue-100 text-blue-800';
      case 'sub-case': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div>Loading related cases...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center">
          <GitBranch className="h-5 w-5 mr-2" />
          Related Cases ({relatedCases.length})
        </CardTitle>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Related
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Related Case</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Case ID</label>
                <Input
                  value={newRelatedCaseId}
                  onChange={(e) => setNewRelatedCaseId(e.target.value)}
                  placeholder="Enter case ID"
                />
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
                    <SelectItem value="follow-up">Follow-up</SelectItem>
                    <SelectItem value="sub-case">Sub-case</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={addRelatedCase}>
                  Add Relation
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
              <div className="flex items-center space-x-3">
                <Link className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">
                    Case {relation.cases.id.slice(-6).toUpperCase()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {relation.cases.title}
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="outline" className={getRelationshipColor(relation.relationship_type)}>
                      {relation.relationship_type}
                    </Badge>
                    <Badge variant="outline">
                      {relation.cases.status}
                    </Badge>
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeRelatedCase(relation.id)}
              >
                Remove
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default RelatedCases;
