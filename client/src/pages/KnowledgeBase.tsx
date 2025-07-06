
import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, MessageSquare, BookOpen, Plus } from 'lucide-react';
import KnowledgeSearch from '@/components/knowledge/KnowledgeSearch';
import AIAssistant from '@/components/knowledge/AIAssistant';
import KnowledgeArticles from '@/components/knowledge/KnowledgeArticles';

const KnowledgeBase = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <>
      <Helmet>
        <title>Knowledge Base - IQCase</title>
      </Helmet>

      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Knowledge Base</h1>
            <p className="text-muted-foreground mt-2">
              Search our internal knowledge base or get AI assistance for case-related questions
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Article
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Tabs defaultValue="search" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="search" className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Search Knowledge Base
                </TabsTrigger>
                <TabsTrigger value="articles" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Browse Articles
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="search" className="space-y-4">
                <KnowledgeSearch searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
              </TabsContent>
              
              <TabsContent value="articles" className="space-y-4">
                <KnowledgeArticles />
              </TabsContent>
            </Tabs>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  AI Assistant
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AIAssistant />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default KnowledgeBase;
