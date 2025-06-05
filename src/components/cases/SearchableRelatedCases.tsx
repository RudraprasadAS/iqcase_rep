import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Link2, Plus, Trash2, ExternalLink, Search, Check, ChevronsUpDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

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
  description?: string;
  created_at: string;
}

interface SearchableRelatedCasesProps {
  caseId: string;
}

const SearchableRelatedCases = ({ caseId }: SearchableRelatedCasesProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [relatedCases, setRelatedCases] = useState<RelatedCase[]>([]);
  const [availableCases, setAvailableCases] = useState<AvailableCase[]>([]);
  const [filteredCases, setFilteredCases] = useState<AvailableCase[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [selectedRelationType, setSelectedRelationType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
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

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = availableCases.filter(case_ => {
        const searchLower = searchTerm.toLowerCase();
        const caseNumber = generateCaseNumber(case_.id, case_.created_at);
        return (
          case_.title.toLowerCase().includes(searchLower) ||
          case_.description?.toLowerCase().includes(searchLower) ||
          caseNumber.toLowerCase().includes(searchLower) ||
          case_.status.toLowerCase().includes(searchLower)
        );
      });
      setFilteredCases(filtered);
    } else {
      setFilteredCases(availableCases.slice(0, 10)); // Show first 10 by default
    }
  }, [searchTerm, availableCases]);

  const generateCaseNumber = (id: string, createdAt: string) => {
    const year = new Date(createdAt).getFullYear();
    const shortId = id.slice(-6).toUpperCase();
    return `#${year}-${shortId}`;
  };

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
        .select('id, title, status, description, created_at')
        .neq('id', caseId)
        .order('created_at', { ascending: false })
        .limit(100);

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

      setSelectedCaseId('');
      setSelectedRelationType('');
      setSearchTerm('');
      setIsSearchOpen(false);
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

  const selectedCase = availableCases.find(c => c.id === selectedCaseId);

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
          <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={isSearchOpen}
                className="flex-1 justify-between"
              >
                {selectedCase ? (
                  <span className="truncate">
                    {generateCaseNumber(selectedCase.id, selectedCase.created_at)} - {selectedCase.title}
                  </span>
                ) : (
                  "Search cases..."
                )}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0">
              <Command shouldFilter={false}>
                <CommandInput 
                  placeholder="Search by case number, title, or description..." 
                  value={searchTerm}
                  onValueChange={setSearchTerm}
                />
                <CommandList>
                  <CommandEmpty>No cases found.</CommandEmpty>
                  <CommandGroup>
                    {filteredCases.map((case_) => (
                      <CommandItem
                        key={case_.id}
                        value={case_.id}
                        onSelect={() => {
                          setSelectedCaseId(case_.id === selectedCaseId ? "" : case_.id);
                          setIsSearchOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedCaseId === case_.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col gap-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {generateCaseNumber(case_.id, case_.created_at)}
                            </span>
                            <Badge className={`text-xs ${getStatusColor(case_.status)}`}>
                              {case_.status}
                            </Badge>
                          </div>
                          <span className="text-sm text-muted-foreground truncate">
                            {case_.title}
                          </span>
                          {case_.description && (
                            <span className="text-xs text-muted-foreground truncate">
                              {case_.description}
                            </span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          
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

export default SearchableRelatedCases;
