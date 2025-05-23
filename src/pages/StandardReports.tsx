import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Filter, Search, SortAsc, SortDesc, Users, FileText, Calendar, MessageSquare, Activity, X, Save, Plus, Settings } from 'lucide-react';
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
import { ColumnDefinition, ReportFilter, Report, TableJoin } from '@/types/reports';
import { ColumnSelector } from '@/components/reports/ColumnSelector';
import { ReportSettings } from '@/components/reports/ReportSettings';
import { VisualizationSelector } from '@/components/reports/VisualizationSelector';
import { useForm } from 'react-hook-form';
import { useReports } from '@/hooks/useReports';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// Define allowed table names as a type for type safety
type AllowedTableName = 'cases' | 'users' | 'custom_reports';

const StandardReports = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<AllowedTableName>('cases');
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState<ReportFilter[]>([]);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [availableColumns, setAvailableColumns] = useState<ColumnDefinition[]>([]);
  const [saveViewDialogOpen, setSaveViewDialogOpen] = useState(false);
  const [createReportDialogOpen, setCreateReportDialogOpen] = useState(false);
  const [joins, setJoins] = useState<TableJoin[]>([]);
  const [relatedTables, setRelatedTables] = useState<{ name: string; columns: ColumnDefinition[] }[]>([]);
  
  const { 
    tables, 
    isLoadingTables, 
    saveCustomView, 
    getRelatedTables,
    savedViews,
    runReportWithJoins,
    createReport,
    reports,
    isLoadingReports
  } = useReports();

  const saveViewForm = useForm({
    defaultValues: {
      name: '',
      description: ''
    }
  });

  const createReportForm = useForm({
    defaultValues: {
      name: '',
      description: '',
      base_table: '',
      fields: [] as string[],
      is_public: false
    }
  });

  const [selectedBaseTable, setSelectedBaseTable] = useState('');
  const [selectedReportFields, setSelectedReportFields] = useState<string[]>([]);
  const [chartType, setChartType] = useState<'table' | 'bar' | 'line' | 'pie'>('table');
  
  // Effect to reset selected columns when tab changes
  useEffect(() => {
    // Reset columns when changing tables
    setSelectedColumns([]);
    setFilters([]);
    setJoins([]);
    
    if (activeTab === 'custom_reports') {
      // For custom reports tab, we don't need to set columns from table structure
      return;
    }
    
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
        const defaultColumns = columnMappings[activeTab].map(col => col.key);
        setSelectedColumns(defaultColumns);
        
        // Find related tables
        loadRelatedTables(activeTab);
      }
    }
  }, [activeTab, tables]);

  // Update fields when base table changes in create report dialog
  useEffect(() => {
    if (selectedBaseTable && tables) {
      const tableInfo = tables.find(table => table.name === selectedBaseTable);
      if (tableInfo && tableInfo.fields) {
        // Set default fields for the selected table
        const defaultFields = tableInfo.fields.slice(0, 5); // Take first 5 fields
        setSelectedReportFields(defaultFields);
        createReportForm.setValue('fields', defaultFields);
      }
    }
  }, [selectedBaseTable, tables, createReportForm]);
  
  const loadRelatedTables = async (tableName: string) => {
    console.log("Loading related tables for:", tableName);
    const related = getRelatedTables(tableName);
    console.log("Found related tables:", related);
    
    if (!related.length || !tables) {
      setRelatedTables([]);
      return;
    }
    
    try {
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
      
      console.log("Processed related tables:", filteredRelatedTables);
      setRelatedTables(filteredRelatedTables);
      
      // Create default joins for related tables
      const defaultJoins: TableJoin[] = relatedTablesData
        .filter(Boolean)
        .map((rel) => ({
          table: rel!.name,
          alias: rel!.name, // Using table name as alias for simplicity
          sourceColumn: rel!.sourceColumn,
          targetColumn: rel!.targetColumn,
          joinType: 'left'
        }));
      
      console.log("Setting default joins:", defaultJoins);
      setJoins(defaultJoins);
    } catch (error) {
      console.error("Error loading related tables:", error);
    }
  };
  
  const formatFieldName = (fieldName: string): string => {
    return fieldName
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  };
  
  // Fetch data with support for related tables - only for standard tables
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['standardReport', activeTab, sortField, sortDirection, search, filters, selectedColumns, JSON.stringify(joins)],
    queryFn: async () => {
      if (activeTab === 'custom_reports') {
        // Return empty array for custom reports tab since we display reports differently
        return [];
      }

      try {
        console.log('Fetching data with joins:', joins.length > 0);
        console.log('Selected columns:', selectedColumns);
        
        // Only use joins if we have selected at least one column from a related table
        const hasRelatedTableColumns = selectedColumns.some(col => col.includes('.'));
        
        if (joins.length > 0 && hasRelatedTableColumns) {
          console.log('Using runReportWithJoins with joins:', joins);
          // Use the enhanced run report with joins function
          const result = await runReportWithJoins.mutateAsync({
            baseTable: activeTab,
            selectedColumns,
            filters,
            joins
          });
          console.log('Result from runReportWithJoins:', result);
          return result.rows;
        } else {
          // Use the standard Supabase query for single table
          console.log(`Fetching data from ${activeTab} table with sort: ${sortField} ${sortDirection}, search: ${search}`);
          console.log('Applied filters:', filters);
          console.log('Selected columns:', selectedColumns);
          
          // Make sure we have columns to select
          const columnsToSelect = selectedColumns.filter(col => !col.includes('.')).length > 0 
            ? selectedColumns.filter(col => !col.includes('.')).join(',') 
            : '*';
          
          console.log('Columns to select:', columnsToSelect);
          
          // Use the any type to avoid TypeScript errors with dynamic tables
          const query = supabase.from(activeTab as any).select(columnsToSelect);
          
          // Add search filter if provided
          if (search) {
            if (activeTab === 'cases') {
              query.ilike('title', `%${search}%`);
            } else if (activeTab === 'users') {
              query.ilike('name', `%${search}%`);
            }
          }
          
          // Apply custom filters
          if (filters.length > 0) {
            filters.forEach((filter) => {
              const { field, operator, value } = filter;
              
              switch (operator) {
                case 'eq':
                  query.eq(field, value);
                  break;
                case 'neq':
                  query.neq(field, value);
                  break;
                case 'gt':
                  query.gt(field, value);
                  break;
                case 'gte':
                  query.gte(field, value);
                  break;
                case 'lt':
                  query.lt(field, value);
                  break;
                case 'lte':
                  query.lte(field, value);
                  break;
                case 'like':
                  query.like(field, `%${value}%`);
                  break;
                case 'ilike':
                  query.ilike(field, `%${value}%`);
                  break;
                case 'is':
                  // Handle 'is' operator specifically as it expects boolean values
                  const boolValue = value === 'true' ? true : 
                                   value === 'false' ? false : 
                                   value === 'null' ? null : value;
                  query.is(field, boolValue);
                  break;
                default:
                  break;
              }
            });
          }
          
          // Add sorting - use the casted query for type safety
          const result = await query.order(sortField, { ascending: sortDirection === 'asc' }).limit(50);
          
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
    if (activeTab !== 'custom_reports') {
      return columnMappings[activeTab].map(col => col.key);
    }
    
    return [];
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
      toast({
        title: "View saved successfully",
        description: "You can access this view from the Reports page"
      });
    } catch (error) {
      console.error("Error saving view:", error);
      toast({
        variant: "destructive", 
        title: "Error saving view",
        description: "An unexpected error occurred. Please try again."
      });
    }
  };

  const handleCreateReport = async () => {
    const values = createReportForm.getValues();
    
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please sign in to create a report"
      });
      return;
    }

    if (!selectedBaseTable) {
      toast({
        variant: "destructive",
        title: "Base table required",
        description: "Please select a base table for the report"
      });
      return;
    }

    if (!selectedReportFields || selectedReportFields.length === 0) {
      toast({
        variant: "destructive",
        title: "Fields required",
        description: "Please select at least one field for the report"
      });
      return;
    }
    
    try {
      await createReport.mutateAsync({
        name: values.name,
        description: values.description,
        created_by: user.id,
        module: selectedBaseTable,
        base_table: selectedBaseTable,
        fields: selectedReportFields,
        selected_fields: selectedReportFields,
        filters: [],
        chart_type: chartType,
        is_public: values.is_public
      });
      
      setCreateReportDialogOpen(false);
      createReportForm.reset();
      setSelectedBaseTable('');
      setSelectedReportFields([]);
      setChartType('table');
      
      toast({
        title: "Report created successfully",
        description: "You can access this report from the Reports page"
      });

      // Navigate to reports page to see the created report
      navigate('/reports');
    } catch (error) {
      console.error("Error creating report:", error);
      toast({
        variant: "destructive",
        title: "Error creating report",
        description: "An unexpected error occurred. Please try again"
      });
    }
  };

  const handleBaseTableChange = (value: string) => {
    setSelectedBaseTable(value);
    createReportForm.setValue('base_table', value);
  };

  const handleFieldsChange = (fields: string[]) => {
    setSelectedReportFields(fields);
    createReportForm.setValue('fields', fields);
  };
  
  // Define column mappings for each table
  const columnMappings: Record<Exclude<AllowedTableName, 'custom_reports'>, { label: string, key: string }[]> = {
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
    ]
  };

  // Function to render custom reports
  const renderCustomReports = () => {
    if (isLoadingReports) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-primary rounded-full animate-spin"></div>
        </div>
      );
    }

    if (!reports || reports.length === 0) {
      return (
        <div className="text-center p-8 text-muted-foreground">
          <Settings className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">No Custom Reports</h3>
          <p>You haven't created any custom reports yet.</p>
          <Button 
            onClick={() => setCreateReportDialogOpen(true)}
            className="mt-4"
          >
            Create Your First Report
          </Button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((report) => (
          <Card key={report.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="truncate">{report.name}</span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {report.chart_type || 'table'}
                </span>
              </CardTitle>
              {report.description && (
                <p className="text-sm text-muted-foreground truncate">
                  {report.description}
                </p>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>
                  <span className="font-medium">Module:</span> {report.module}
                </div>
                <div>
                  <span className="font-medium">Fields:</span> {Array.isArray(report.selected_fields) ? report.selected_fields.length : 0} selected
                </div>
                <div>
                  <span className="font-medium">Created:</span> {new Date(report.created_at || '').toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Visibility:</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${report.is_public ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {report.is_public ? 'Public' : 'Private'}
                  </span>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button 
                  size="sm" 
                  onClick={() => navigate(`/reports/builder?id=${report.id}`)}
                  className="flex-1"
                >
                  View Report
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => navigate(`/reports/builder?id=${report.id}&edit=true`)}
                >
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
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
            <p className="text-muted-foreground">View pre-configured reports and manage custom reports</p>
            {reports && reports.length > 0 && (
              <p className="text-sm text-green-600 mt-1">
                {reports.length} custom report{reports.length > 1 ? 's' : ''} available
              </p>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => navigate('/reports')}
            >
              Back to Reports
            </Button>
            
            {/* Create Report Dialog */}
            <Dialog open={createReportDialogOpen} onOpenChange={setCreateReportDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create Report
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Report</DialogTitle>
                  <DialogDescription>
                    Configure your report settings, select a base table and choose fields
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6 py-4">
                  <ReportSettings
                    form={createReportForm}
                    tables={tables}
                    isLoadingTables={isLoadingTables}
                    isEditMode={false}
                    onBaseTableChange={handleBaseTableChange}
                  />

                  {selectedBaseTable && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Select Fields</label>
                        <ColumnSelector
                          availableColumns={
                            tables?.find(t => t.name === selectedBaseTable)?.fields?.map(field => ({
                              key: field,
                              label: formatFieldName(field),
                              table: selectedBaseTable
                            })) || []
                          }
                          selectedColumns={selectedReportFields}
                          onColumnChange={handleFieldsChange}
                          relatedTables={[]}
                        />
                      </div>

                      <VisualizationSelector
                        selectedType={chartType}
                        onTypeChange={setChartType}
                        selectedFields={selectedReportFields}
                      />
                    </div>
                  )}
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateReportDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    onClick={handleCreateReport}
                    disabled={!selectedBaseTable || selectedReportFields.length === 0}
                  >
                    Create Report
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            {/* Save View Dialog - only show for non-custom reports tabs */}
            {activeTab !== 'custom_reports' && (
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
            )}
            
            {/* Export CSV - only show for non-custom reports tabs */}
            {activeTab !== 'custom_reports' && (
              <Button 
                variant="outline" 
                onClick={downloadCsv}
                disabled={!data || data.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            )}
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
              <TabsTrigger value="custom_reports" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Custom Reports
              </TabsTrigger>
            </TabsList>
          </div>
          
          {/* Search and Filter controls - only show for non-custom reports tabs */}
          {activeTab !== 'custom_reports' && (
            <>
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
                
                <ColumnSelector
                  availableColumns={availableColumns}
                  selectedColumns={selectedColumns}
                  onColumnChange={setSelectedColumns}
                  relatedTables={relatedTables}
                />
              </div>
              
              {/* Active filters display */}
              {filters.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {filters.map((filter, index) => (
                    <div key={`filter-${index}`} className="flex items-center gap-2 bg-muted px-3 py-1 rounded-md text-sm">
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
            </>
          )}
          
          {/* Tab Content */}
          <TabsContent value="custom_reports">
            {renderCustomReports()}
          </TabsContent>
          
          <TabsContent value="cases">
            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="w-8 h-8 border-4 border-gray-300 border-t-primary rounded-full animate-spin"></div>
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
                          selectedColumns.map((colKey, index) => {
                            // Check if it's a joined column (contains a dot)
                            const isJoinedColumn = colKey.includes('.');
                            let displayName = colKey;
                            
                            if (isJoinedColumn) {
                              const [table, field] = colKey.split('.');
                              displayName = formatFieldName(field);
                            } else {
                              // Find in available columns to get proper label
                              const columnDef = availableColumns.find(col => col.key === colKey);
                              if (columnDef) {
                                displayName = columnDef.label;
                              }
                            }
                            
                            return (
                              <TableHead 
                                key={`header-${colKey}-${index}`}
                                className="cursor-pointer hover:bg-gray-50"
                                onClick={() => toggleSort(colKey)}
                              >
                                {displayName}
                                {sortField === colKey && (
                                  <span className="ml-2 inline-block">
                                    {sortDirection === 'asc' ? '↑' : '↓'}
                                  </span>
                                )}
                              </TableHead>
                            );
                          }) :
                          columnMappings[activeTab]?.map((col, index) => (
                            <TableHead 
                              key={`header-${col.key}-${index}`}
                              className="cursor-pointer hover:bg-gray-50"
                              onClick={() => toggleSort(col.key)}
                            >
                              {col.label}
                              {sortField === col.key && (
                                <span className="ml-2 inline-block">
                                  {sortDirection === 'asc' ? '↑' : '↓'}
                                </span>
                              )}
                            </TableHead>
                          ))
                        }
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.map((row, rowIndex) => (
                        <TableRow key={`row-${rowIndex}`}>
                          {selectedColumns.length > 0 ? 
                            selectedColumns.map((colKey, colIndex) => (
                              <TableCell key={`cell-${rowIndex}-${colKey}-${colIndex}`}>
                                {renderTableCell(row[colKey], colKey)}
                              </TableCell>
                            )) :
                            columnMappings[activeTab]?.map((col, colIndex) => (
                              <TableCell key={`cell-${rowIndex}-${col.key}-${colIndex}`}>
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
          </TabsContent>
          
          <TabsContent value="users">
            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="w-8 h-8 border-4 border-gray-300 border-t-primary rounded-full animate-spin"></div>
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
                          selectedColumns.map((colKey, index) => {
                            // Check if it's a joined column (contains a dot)
                            const isJoinedColumn = colKey.includes('.');
                            let displayName = colKey;
                            
                            if (isJoinedColumn) {
                              const [table, field] = colKey.split('.');
                              displayName = formatFieldName(field);
                            } else {
                              // Find in available columns to get proper label
                              const columnDef = availableColumns.find(col => col.key === colKey);
                              if (columnDef) {
                                displayName = columnDef.label;
                              }
                            }
                            
                            return (
                              <TableHead 
                                key={`header-${colKey}-${index}`}
                                className="cursor-pointer hover:bg-gray-50"
                                onClick={() => toggleSort(colKey)}
                              >
                                {displayName}
                                {sortField === colKey && (
                                  <span className="ml-2 inline-block">
                                    {sortDirection === 'asc' ? '↑' : '↓'}
                                  </span>
                                )}
                              </TableHead>
                            );
                          }) :
                          columnMappings[activeTab]?.map((col, index) => (
                            <TableHead 
                              key={`header-${col.key}-${index}`}
                              className="cursor-pointer hover:bg-gray-50"
                              onClick={() => toggleSort(col.key)}
                            >
                              {col.label}
                              {sortField === col.key && (
                                <span className="ml-2 inline-block">
                                  {sortDirection === 'asc' ? '↑' : '↓'}
                                </span>
                              )}
                            </TableHead>
                          ))
                        }
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.map((row, rowIndex) => (
                        <TableRow key={`row-${rowIndex}`}>
                          {selectedColumns.length > 0 ? 
                            selectedColumns.map((colKey, colIndex) => (
                              <TableCell key={`cell-${rowIndex}-${colKey}-${colIndex}`}>
                                {renderTableCell(row[colKey], colKey)}
                              </TableCell>
                            )) :
                            columnMappings[activeTab]?.map((col, colIndex) => (
                              <TableCell key={`cell-${rowIndex}-${col.key}-${colIndex}`}>
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
          </TabsContent>
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
