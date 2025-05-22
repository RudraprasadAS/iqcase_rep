
import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Filter, Search, SortAsc, SortDesc, Users, FileText, Calendar, MessageSquare, Activity, X, Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FilterBuilder } from '@/components/reports/FilterBuilder';
import { ColumnDefinition, ReportFilter, TableJoin } from '@/types/reports';
import { ColumnSelector } from '@/components/reports/ColumnSelector';
import { useForm } from 'react-hook-form';
import { useReports } from '@/hooks/useReports';

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
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [availableColumns, setAvailableColumns] = useState<ColumnDefinition[]>([]);
  const [saveViewDialogOpen, setSaveViewDialogOpen] = useState(false);
  const [joins, setJoins] = useState<TableJoin[]>([]);
  const [relatedTables, setRelatedTables] = useState<{ name: string; columns: ColumnDefinition[] }[]>([]);
  
  const { 
    tables, 
    isLoadingTables, 
    saveCustomView, 
    getRelatedTables,
    savedViews,
    runReportWithJoins
  } = useReports();

  const saveViewForm = useForm({
    defaultValues: {
      name: '',
      description: ''
    }
  });
  
  // Effect to reset selected columns when tab changes
  useEffect(() => {
    // Reset columns when changing tables
    setSelectedColumns([]);
    setFilters([]);
    setJoins([]);
    
    // Get table structure from Supabase
    if (tables) {
      // Find the table that matches the active tab
      const tableInfo = tables.find(table => table.name === activeTab);
      if (tableInfo && tableInfo.fields) {
        // Create column definitions for the main table
        const mainTableColumns: ColumnDefinition[] = tableInfo.fields.map(field => ({
          key: field,
          label: formatFieldName(field),
          table: activeTab
        }));
        
        setAvailableColumns(mainTableColumns);
        
        // Set default columns based on column mappings
        setSelectedColumns(columnMappings[activeTab].map(col => col.key));
        
        // Find related tables
        loadRelatedTables(activeTab);
      }
    }
  }, [activeTab, tables]);
  
  const loadRelatedTables = async (tableName: string) => {
    const related = getRelatedTables(tableName);
    
    if (!related.length || !tables) {
      setRelatedTables([]);
      return;
    }
    
    // For each related table, get its fields
    const relatedTablesData = await Promise.all(related.map(async (rel) => {
      const tableInfo = tables.find(t => t.name === rel.name);
      if (tableInfo && tableInfo.fields) {
        const columns: ColumnDefinition[] = tableInfo.fields.map(field => ({
          key: `${rel.name}.${field}`,
          label: formatFieldName(field),
          table: rel.name
        }));
        
        return {
          name: rel.name,
          columns,
          sourceColumn: rel.sourceColumn,
          targetColumn: rel.targetColumn
        };
      }
      return null;
    }));
    
    const filteredRelatedTables = relatedTablesData
      .filter(Boolean)
      .map(table => ({
        name: table!.name,
        columns: table!.columns,
      }));
    
    setRelatedTables(filteredRelatedTables);
    
    // Create default joins for related tables
    const defaultJoins: TableJoin[] = relatedTablesData
      .filter(Boolean)
      .map(rel => ({
        table: rel!.name,
        sourceColumn: rel!.sourceColumn,
        targetColumn: rel!.targetColumn,
        joinType: 'left'
      }));
    
    setJoins(defaultJoins);
  };
  
  const formatFieldName = (fieldName: string): string => {
    return fieldName
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  };
  
  // Fetch data with support for related tables
  const { data, isLoading, error } = useQuery({
    queryKey: ['standardReport', activeTab, sortField, sortDirection, search, filters, selectedColumns, joins],
    queryFn: async () => {
      try {
        if (joins.length > 0) {
          // Use the enhanced run report with joins function
          const result = await runReportWithJoins.mutateAsync({
            baseTable: activeTab,
            selectedColumns,
            filters,
            joins
          });
          return result.rows;
        } else {
          // Use the standard Supabase query for single table
          console.log(`Fetching data from ${activeTab} table with sort: ${sortField} ${sortDirection}, search: ${search}`);
          console.log('Applied filters:', filters);
          console.log('Selected columns:', selectedColumns);
          
          // Start building the query - get the table
          let query = supabase.from(activeTab);
          
          // Build a select query with selected columns or all columns if none selected
          const columnsToSelect = selectedColumns.length > 0 
            ? selectedColumns.join(',') 
            : '*';
            
          let selectQuery = query.select(columnsToSelect);
          
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
              
              // Use any type to avoid TypeScript errors with dynamic method calls
              const typedQuery = selectQuery as any;
              
              switch (operator) {
                case 'eq':
                  selectQuery = typedQuery.eq(field, value);
                  break;
                case 'neq':
                  selectQuery = typedQuery.neq(field, value);
                  break;
                case 'gt':
                  selectQuery = typedQuery.gt(field, value);
                  break;
                case 'gte':
                  selectQuery = typedQuery.gte(field, value);
                  break;
                case 'lt':
                  selectQuery = typedQuery.lt(field, value);
                  break;
                case 'lte':
                  selectQuery = typedQuery.lte(field, value);
                  break;
                case 'like':
                  selectQuery = typedQuery.like(field, `%${value}%`);
                  break;
                case 'ilike':
                  selectQuery = typedQuery.ilike(field, `%${value}%`);
                  break;
                case 'is':
                  // Handle 'is' operator specifically as it expects boolean values
                  const boolValue = value === 'true' ? true : 
                                   value === 'false' ? false : 
                                   value === 'null' ? null : value;
                  selectQuery = typedQuery.is(field, boolValue);
                  break;
                default:
                  break;
              }
            });
          }
          
          // Add sorting - use the casted query for type safety
          const result = await selectQuery.order(sortField, { ascending: sortDirection === 'asc' }).limit(50);
          
          if (result.error) {
            console.error('Error fetching data:', result.error);
            throw result.error;
          }
          
          console.log('Data fetched successfully:', result.data);
          return result.data || [];
        }
      } catch (err) {
        console.error('Error in query function:', err);
        throw err;
      }
    },
    placeholderData: [],
  });
  
  // Get field names from first row of data for the active table
  const getFieldNames = (): string[] => {
    if (availableColumns.length > 0) {
      return availableColumns.map(col => col.key);
    }
    
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
    
    // Get headers - use selected columns if available, otherwise use all headers from data
    const headers = selectedColumns.length > 0 
      ? selectedColumns 
      : Object.keys(data[0]);
    
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
  
  const handleSaveView = async () => {
    const values = saveViewForm.getValues();
    
    try {
      await saveCustomView.mutateAsync({
        name: values.name,
        description: values.description,
        baseReportId: activeTab,
        columns: selectedColumns,
        filters: filters
      });
      
      setSaveViewDialogOpen(false);
      saveViewForm.reset();
    } catch (error) {
      console.error("Error saving view:", error);
    }
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
            
            <Dialog open={saveViewDialogOpen} onOpenChange={setSaveViewDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  disabled={!data || data.length === 0}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save View
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Save Custom View</DialogTitle>
                  <DialogDescription>
                    Save your current filters and selected columns as a custom view
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">
                      View Name
                    </label>
                    <Input
                      id="name"
                      placeholder="My Custom View"
                      {...saveViewForm.register('name', { required: true })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="description" className="text-sm font-medium">
                      Description (optional)
                    </label>
                    <Input
                      id="description"
                      placeholder="A brief description of this view"
                      {...saveViewForm.register('description')}
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setSaveViewDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" onClick={handleSaveView}>
                    Save View
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
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
            
            {/* Add column selector component */}
            <ColumnSelector
              availableColumns={availableColumns}
              selectedColumns={selectedColumns}
              onColumnChange={setSelectedColumns}
              relatedTables={relatedTables}
            />
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
                      {selectedColumns.length > 0 ? 
                        selectedColumns.map((colKey) => {
                          // Check if it's a joined column (contains a dot)
                          const isJoinedColumn = colKey.includes('.');
                          let displayName = colKey;
                          let tableName: string | undefined;
                          
                          if (isJoinedColumn) {
                            const [table, field] = colKey.split('.');
                            displayName = formatFieldName(field);
                            tableName = table;
                          } else {
                            // Find in available columns to get proper label
                            const columnDef = availableColumns.find(col => col.key === colKey);
                            if (columnDef) {
                              displayName = columnDef.label;
                            }
                          }
                          
                          return (
                            <TableHead 
                              key={colKey} 
                              className="cursor-pointer hover:bg-gray-50"
                              onClick={() => toggleSort(colKey)}
                              table={tableName}
                              sortable
                              sorted={sortField === colKey}
                              direction={sortDirection}
                            >
                              {displayName}
                            </TableHead>
                          );
                        }) :
                        columnMappings[activeTab]?.map((col) => (
                          <TableHead 
                            key={col.key} 
                            className="cursor-pointer hover:bg-gray-50"
                            onClick={() => toggleSort(col.key)}
                            sortable
                            sorted={sortField === col.key}
                            direction={sortDirection}
                          >
                            {col.label}
                          </TableHead>
                        ))
                      }
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((row, index) => (
                      <TableRow key={index}>
                        {selectedColumns.length > 0 ? 
                          selectedColumns.map((colKey) => (
                            <TableCell key={colKey} truncate>
                              {renderTableCell(row[colKey], colKey)}
                            </TableCell>
                          )) :
                          columnMappings[activeTab]?.map((col) => (
                            <TableCell key={col.key} truncate>
                              {renderTableCell(row[col.key], col.key)}
                            </TableCell>
                          ))
                        }
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
