
import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Download, Filter, Search, SortAsc, SortDesc, Users, FileText, Calendar, MessageSquare, Activity, X } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FilterBuilder } from '@/components/reports/FilterBuilder';
import { ReportFilter } from '@/types/reports';
import { Form, FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { useForm } from 'react-hook-form';

// Define allowed table names as a type for type safety
type AllowedTableName = 'cases' | 'users' | 'case_activities' | 'case_messages';

const StandardReports = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AllowedTableName>('cases');
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState<ReportFilter[]>([]);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['standardReport', activeTab, sortField, sortDirection, search, filters],
    queryFn: async () => {
      try {
        console.log(`Fetching data from ${activeTab} table with sort: ${sortField} ${sortDirection}, search: ${search}`);
        console.log('Applied filters:', filters);
        
        // Start building the query - get the table
        let query = supabase.from(activeTab);
        
        // Build a select query
        let selectQuery = query.select('*');
        
        // Add search filter if provided
        if (search) {
          if (activeTab === 'cases') {
            selectQuery = selectQuery.ilike('title', `%${search}%`);
          } else if (activeTab === 'users') {
            selectQuery = selectQuery.ilike('name', `%${search}%`);
          } else if (activeTab === 'case_activities') {
            selectQuery = selectQuery.ilike('description', `%${search}%`);
          } else if (activeTab === 'case_messages') {
            selectQuery = selectQuery.ilike('message', `%${search}%`);
          }
        }
        
        // Apply custom filters
        if (filters.length > 0) {
          filters.forEach((filter) => {
            const { field, operator, value } = filter;
            
            switch (operator) {
              case 'eq':
                selectQuery = selectQuery.eq(field, value);
                break;
              case 'neq':
                selectQuery = selectQuery.neq(field, value);
                break;
              case 'gt':
                selectQuery = selectQuery.gt(field, value);
                break;
              case 'gte':
                selectQuery = selectQuery.gte(field, value);
                break;
              case 'lt':
                selectQuery = selectQuery.lt(field, value);
                break;
              case 'lte':
                selectQuery = selectQuery.lte(field, value);
                break;
              case 'like':
                selectQuery = selectQuery.like(field, `%${value}%`);
                break;
              case 'ilike':
                selectQuery = selectQuery.ilike(field, `%${value}%`);
                break;
              case 'is':
                selectQuery = selectQuery.is(field, value);
                break;
              default:
                break;
            }
          });
        }
        
        // Add sorting - make sure to use selectQuery for chaining
        selectQuery = selectQuery.order(sortField, { ascending: sortDirection === 'asc' });
        
        // Limit to 50 rows for performance
        const { data, error } = await selectQuery.limit(50);
        
        if (error) {
          console.error('Error fetching data:', error);
          throw error;
        }
        
        console.log('Data fetched successfully:', data);
        return data || [];
      } catch (err) {
        console.error('Error in query function:', err);
        throw err;
      }
    },
    placeholderData: [],
  });
  
  // Get field names from first row of data for the active table
  const getFieldNames = (): string[] => {
    if (data && data.length > 0) {
      return Object.keys(data[0]);
    }
    
    // Provide default fields based on table if no data is available
    switch (activeTab) {
      case 'cases':
        return ['title', 'status', 'priority', 'location', 'created_at'];
      case 'users':
        return ['name', 'email', 'user_type', 'is_active', 'created_at'];
      case 'case_activities':
        return ['activity_type', 'description', 'duration_minutes', 'created_at'];
      case 'case_messages':
        return ['message', 'is_internal', 'is_pinned', 'created_at'];
      default:
        return [];
    }
  };
  
  const addFilter = () => {
    const newFilter: ReportFilter = {
      field: getFieldNames()[0] || '',
      operator: 'eq',
      value: ''
    };
    setFilters([...filters, newFilter]);
  };
  
  const removeFilter = (index: number) => {
    const updatedFilters = [...filters];
    updatedFilters.splice(index, 1);
    setFilters(updatedFilters);
  };
  
  const updateFilter = (index: number, key: keyof ReportFilter, value: any) => {
    const updatedFilters = [...filters];
    updatedFilters[index] = { ...updatedFilters[index], [key]: value };
    setFilters(updatedFilters);
  };
  
  const clearFilters = () => {
    setFilters([]);
    setFilterDialogOpen(false);
  };
  
  const applyFilters = () => {
    // Close dialog and let the query re-run
    setFilterDialogOpen(false);
  };
  
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
            
            <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filter {filters.length > 0 && `(${filters.length})`}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Filter Data</DialogTitle>
                  <DialogDescription>
                    Create filters to narrow down your results.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="py-4">
                  <FilterBuilder
                    selectedFields={getFieldNames()}
                    filters={filters}
                    onAddFilter={addFilter}
                    onRemoveFilter={removeFilter}
                    onUpdateFilter={updateFilter}
                  />
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={clearFilters}>
                    Clear All
                  </Button>
                  <Button onClick={applyFilters}>
                    Apply Filters
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
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
          
          {filters.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {filters.map((filter, index) => (
                <div key={index} className="flex items-center gap-2 bg-muted px-3 py-1 rounded-md text-sm">
                  <span>{filter.field} {getOperatorLabel(filter.operator)} {filter.value}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-5 w-5"
                    onClick={() => removeFilter(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <Button 
                variant="ghost" 
                size="sm"
                className="text-xs"
                onClick={clearFilters}
              >
                Clear all
              </Button>
            </div>
          )}
          
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="w-8 h-8 border-4 border-gray-300 border-t-caseMgmt-primary rounded-full animate-spin"></div>
                </div>
              ) : error ? (
                <div className="text-center p-8 text-red-500">
                  Error loading data. Please try again. {error instanceof Error ? error.message : 'Unknown error'}
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

// Helper function to get operator label
function getOperatorLabel(operator: string): string {
  switch (operator) {
    case 'eq': return '=';
    case 'neq': return '≠';
    case 'gt': return '>';
    case 'gte': return '≥';
    case 'lt': return '<';
    case 'lte': return '≤';
    case 'like': return 'contains';
    case 'ilike': return 'contains (i)';
    case 'is': return 'is';
    default: return operator;
  }
}

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
