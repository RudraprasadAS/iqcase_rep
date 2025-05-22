
import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Download, Filter, Search, SortAsc, SortDesc, Users, FileText, Calendar, MessageSquare, Activity } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { PostgrestQueryBuilder } from '@supabase/postgrest-js';

// Define allowed table names as a type for type safety
type AllowedTableName = 'cases' | 'users' | 'case_activities' | 'case_messages';

const StandardReports = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AllowedTableName>('cases');
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['standardReport', activeTab, sortField, sortDirection, search],
    queryFn: async () => {
      // Cast the query to PostgrestQueryBuilder to make TypeScript happy
      let query = supabase.from(activeTab) as PostgrestQueryBuilder<any, any, any>;
      
      // Add search filter if provided
      if (search) {
        if (activeTab === 'cases') {
          query = query.ilike('title', `%${search}%`);
        } else if (activeTab === 'users') {
          query = query.ilike('name', `%${search}%`);
        } else if (activeTab === 'case_activities') {
          query = query.ilike('description', `%${search}%`);
        } else if (activeTab === 'case_messages') {
          query = query.ilike('message', `%${search}%`);
        }
      }
      
      // Add sorting
      query = query.order(sortField, { ascending: sortDirection === 'asc' });
      
      // Limit to 50 rows for performance
      const { data, error } = await query.limit(50);
      
      if (error) throw error;
      return data || [];
    },
    placeholderData: [],
  });
  
  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  const downloadCsv = () => {
    if (!data || data.length === 0) return;
    
    // Get headers
    const headers = Object.keys(data[0]);
    
    // Create CSV content
    let csvContent = headers.join(',') + '\n';
    
    // Add data rows
    data.forEach((row) => {
      const values = headers.map(header => {
        const value = row[header];
        // Handle different data types and ensure proper CSV formatting
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return JSON.stringify(value).replace(/,/g, ';').replace(/"/g, '""');
        return String(value).replace(/,/g, ';').replace(/"/g, '""');
      });
      csvContent += values.join(',') + '\n';
    });
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${activeTab}_report.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Define column mappings for each table
  const columnMappings: Record<AllowedTableName, { label: string, key: string }[]> = {
    cases: [
      { label: 'Title', key: 'title' },
      { label: 'Status', key: 'status' },
      { label: 'Priority', key: 'priority' },
      { label: 'Location', key: 'location' },
      { label: 'Created', key: 'created_at' }
    ],
    users: [
      { label: 'Name', key: 'name' },
      { label: 'Email', key: 'email' },
      { label: 'Type', key: 'user_type' },
      { label: 'Active', key: 'is_active' },
      { label: 'Created', key: 'created_at' }
    ],
    case_activities: [
      { label: 'Type', key: 'activity_type' },
      { label: 'Description', key: 'description' },
      { label: 'Duration', key: 'duration_minutes' },
      { label: 'Created', key: 'created_at' }
    ],
    case_messages: [
      { label: 'Message', key: 'message' },
      { label: 'Internal', key: 'is_internal' },
      { label: 'Pinned', key: 'is_pinned' },
      { label: 'Created', key: 'created_at' }
    ]
  };
  
  return (
    <>
      <Helmet>
        <title>Standard Reports | Case Management</title>
      </Helmet>
      
      <div className="container mx-auto py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Standard Reports</h1>
            <p className="text-muted-foreground">View pre-configured reports for your data</p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => navigate('/reports')}
            >
              Back to Reports
            </Button>
            
            <Button 
              variant="outline" 
              onClick={downloadCsv}
              disabled={!data || data.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as AllowedTableName)} className="space-y-4">
          <div className="flex justify-between">
            <TabsList>
              <TabsTrigger value="cases" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Cases
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Users
              </TabsTrigger>
              <TabsTrigger value="case_activities" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Activities
              </TabsTrigger>
              <TabsTrigger value="case_messages" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Messages
              </TabsTrigger>
            </TabsList>
          </div>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
            >
              {sortDirection === 'asc' ? (
                <SortAsc className="h-4 w-4" />
              ) : (
                <SortDesc className="h-4 w-4" />
              )}
              Sort
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="w-8 h-8 border-4 border-gray-300 border-t-caseMgmt-primary rounded-full animate-spin"></div>
                </div>
              ) : error ? (
                <div className="text-center p-8 text-red-500">
                  Error loading data. Please try again.
                </div>
              ) : data && data.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columnMappings[activeTab]?.map((col) => (
                        <TableHead 
                          key={col.key} 
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => toggleSort(col.key)}
                        >
                          <div className="flex items-center gap-2">
                            {col.label}
                            {sortField === col.key && (
                              sortDirection === 'asc' ? 
                                <SortAsc className="h-3 w-3" /> : 
                                <SortDesc className="h-3 w-3" />
                            )}
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((row, index) => (
                      <TableRow key={index}>
                        {columnMappings[activeTab]?.map((col) => (
                          <TableCell key={col.key}>
                            {renderTableCell(row[col.key], col.key)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center p-8 text-muted-foreground">
                  No data available for this report.
                </div>
              )}
            </CardContent>
          </Card>
        </Tabs>
      </div>
    </>
  );
};

// Helper function to render table cell content based on data type
function renderTableCell(value: any, key: string) {
  if (value === null || value === undefined) {
    return '-';
  }
  
  // Format dates
  if ((key.includes('_at') || key.includes('date')) && typeof value === 'string') {
    return new Date(value).toLocaleDateString();
  }
  
  // Format booleans
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  
  // Format arrays
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  
  // Format objects
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  
  return String(value);
}

export default StandardReports;
