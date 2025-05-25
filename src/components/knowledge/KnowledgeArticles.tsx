
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Calendar, User, Search } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  created_at: string;
  created_by: string;
  views: number;
}

const KnowledgeArticles = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Mock data - this would come from Supabase
  const articles: Article[] = [
    {
      id: '1',
      title: 'Case Priority Guidelines',
      content: 'Understanding how to properly assign priority levels to cases based on business impact and urgency. High priority cases include system outages, security breaches, and issues affecting multiple users...',
      category: 'Case Management',
      tags: ['priority', 'guidelines', 'sla'],
      created_at: '2024-01-15',
      created_by: 'Admin Team',
      views: 245
    },
    {
      id: '2',
      title: 'Troubleshooting Login Issues',
      content: 'Step-by-step guide to diagnose and resolve common authentication problems. Start by verifying user credentials, check account status, review recent security changes...',
      category: 'Authentication',
      tags: ['login', 'troubleshooting', 'auth', 'security'],
      created_at: '2024-01-10',
      created_by: 'Tech Support',
      views: 189
    },
    {
      id: '3',
      title: 'SLA Response Time Requirements',
      content: 'Service Level Agreement requirements for response times based on case priority. Critical issues require 1-hour response, high priority 4 hours, medium 24 hours...',
      category: 'SLA Management',
      tags: ['sla', 'response-time', 'requirements'],
      created_at: '2024-01-08',
      created_by: 'Operations',
      views: 156
    },
    {
      id: '4',
      title: 'Customer Communication Best Practices',
      content: 'Guidelines for professional and effective communication with customers during case resolution. Use empathetic language, provide clear updates, set realistic expectations...',
      category: 'Communication',
      tags: ['communication', 'customer-service', 'best-practices'],
      created_at: '2024-01-05',
      created_by: 'Customer Success',
      views: 203
    }
  ];

  const categories = ['all', 'Case Management', 'Authentication', 'SLA Management', 'Communication'];

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search articles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category === 'all' ? 'All Categories' : category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {filteredArticles.map((article) => (
          <Card key={article.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {article.title}
                  </CardTitle>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline">{article.category}</Badge>
                    {article.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {article.views} views
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4 line-clamp-2">
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

        {filteredArticles.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No articles found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search terms or category filter.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default KnowledgeArticles;
