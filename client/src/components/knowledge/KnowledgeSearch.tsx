
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, FileText, Calendar, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  created_at: string;
  created_by: string;
  updated_at: string;
}

interface KnowledgeSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const KnowledgeSearch = ({ searchQuery, setSearchQuery }: KnowledgeSearchProps) => {
  const [results, setResults] = useState<KnowledgeArticle[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      // For now, we'll simulate search results since we haven't created the knowledge_articles table yet
      // This would be replaced with actual Supabase search once the table is created
      const mockResults: KnowledgeArticle[] = [
        {
          id: '1',
          title: 'How to Handle Login Issues',
          content: 'When users report login issues, first check if they are using the correct credentials...',
          category: 'Authentication',
          tags: ['login', 'troubleshooting', 'auth'],
          created_at: new Date().toISOString(),
          created_by: 'Admin',
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          title: 'Case Priority Guidelines',
          content: 'Priority levels should be assigned based on impact and urgency...',
          category: 'Case Management',
          tags: ['priority', 'guidelines', 'sla'],
          created_at: new Date().toISOString(),
          created_by: 'Admin',
          updated_at: new Date().toISOString()
        }
      ];

      // Filter results based on search query
      const filteredResults = mockResults.filter(article => 
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );

      setResults(filteredResults);
    } catch (error) {
      console.error('Error searching knowledge base:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchQuery) {
      const debounceTimer = setTimeout(() => {
        handleSearch();
      }, 300);
      return () => clearTimeout(debounceTimer);
    } else {
      setResults([]);
    }
  }, [searchQuery]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search knowledge base..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={handleSearch} disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </Button>
      </div>

      <div className="space-y-4">
        {results.length > 0 && (
          <div className="text-sm text-muted-foreground">
            Found {results.length} result{results.length !== 1 ? 's' : ''}
          </div>
        )}

        {results.map((article) => (
          <Card key={article.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {article.title}
                  </CardTitle>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline">{article.category}</Badge>
                    {article.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4 line-clamp-3">
                {article.content}
              </p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {article.created_by}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(article.created_at)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {searchQuery && results.length === 0 && !loading && (
          <Card>
            <CardContent className="py-8 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No results found</h3>
              <p className="text-muted-foreground">
                Try different keywords or browse our articles instead.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default KnowledgeSearch;
