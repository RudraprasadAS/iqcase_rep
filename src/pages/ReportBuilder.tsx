
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useReports } from '@/hooks/useReports';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, Play, Save, FileSpreadsheet } from 'lucide-react';
import { FilterBuilder } from '@/components/reports/FilterBuilder';
import { ReportPreview } from '@/components/reports/ReportPreview';
import { ReportFilter } from '@/types/reports';

const ReportBuilder = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { 
    tables, 
    isLoadingTables,
    selectedReport,
    updateReport, 
    runReport, 
    setSelectedReportId
  } = useReports();
  
  const [reportName, setReportName] = useState('');
  const [description, setDescription] = useState('');
  const [baseTable, setBaseTable] = useState('');
  const [availableFields, setAvailableFields] = useState<string[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [filters, setFilters] = useState<ReportFilter[]>([]);
  const [chartType, setChartType] = useState<'table' | 'bar' | 'line' | 'pie'>('table');
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState('fields');
  
  // Load report if ID is provided
  useEffect(() => {
    if (!id) return;
    setSelectedReportId(id);
  }, [id, setSelectedReportId]);
  
  // When selected report changes, update form
  useEffect(() => {
    if (!selectedReport) return;
    
    setReportName(selectedReport.name);
    setDescription(selectedReport.description || '');
    setBaseTable(selectedReport.base_table || selectedReport.module || '');
    setChartType(selectedReport.chart_type || 'table');
    
    if (Array.isArray(selectedReport.fields)) {
      setSelectedFields(selectedReport.fields);
    } else if (Array.isArray(selectedReport.selected_fields)) {
      setSelectedFields(selectedReport.selected_fields as string[]);
    }
    
    if (Array.isArray(selectedReport.filters)) {
      setFilters(selectedReport.filters);
    }
  }, [selectedReport]);
  
  // When base table changes, fetch fields
  useEffect(() => {
    if (!baseTable) {
      setAvailableFields([]);
      return;
    }
    
    const loadFields = async () => {
      if (!tables) return;
      
      const tableInfo = tables.find(table => table.name === baseTable);
      if (tableInfo && Array.isArray(tableInfo.fields)) {
        setAvailableFields(tableInfo.fields);
      }
    };
    
    loadFields();
  }, [baseTable, tables]);
  
  const handleBaseTableChange = (value: string) => {
    if (value === baseTable) return;
    
    setBaseTable(value);
    setSelectedFields([]);
    setFilters([]);
  };
  
  const handleFieldToggle = (field: string) => {
    if (selectedFields.includes(field)) {
      setSelectedFields(selectedFields.filter(f => f !== field));
    } else {
      setSelectedFields([...selectedFields, field]);
    }
  };

  const handleAddFilter = () => {
    if (selectedFields.length === 0) return;
    
    setFilters([
      ...filters, 
      { 
        field: selectedFields[0], 
        operator: 'eq', 
        value: '' 
      }
    ]);
  };
  
  const handleRemoveFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };
  
  const handleUpdateFilter = (index: number, key: keyof ReportFilter, value: any) => {
    const updatedFilters = [...filters];
    updatedFilters[index] = {
      ...updatedFilters[index],
      [key]: value
    };
    setFilters(updatedFilters);
  };
  
  const handleSaveReport = async () => {
    if (!id || !reportName || !baseTable) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please complete all required fields'
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      await updateReport.mutateAsync({
        id,
        name: reportName,
        description: description,
        module: baseTable,
        base_table: baseTable,
        selected_fields: selectedFields,
        fields: selectedFields,
        filters: filters,
        is_public: selectedReport?.is_public || false,
        chart_type: chartType
      });
      
      toast({
        title: 'Report saved',
        description: 'Your report configuration has been saved'
      });
    } catch (error) {
      console.error('Error saving report:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRunReport = async () => {
    if (!id || selectedFields.length === 0) {
      toast({
        variant: 'destructive', 
        title: 'Error',
        description: 'Please select at least one field before running the report'
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // First save the report
      await handleSaveReport();
      
      // Then run it
      const result = await runReport.mutateAsync(id);
      setReportData(result);
      
      toast({
        title: 'Report executed',
        description: `Found ${result.rows.length} results`
      });

      // Auto-switch to preview tab
      setCurrentTab('preview');
    } catch (error) {
      console.error('Error running report:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to run report'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCsv = () => {
    if (!reportData || !reportData.rows || reportData.rows.length === 0) {
      return;
    }
    
    const columns = reportData.columns;
    const rows = reportData.rows;
    
    // Create CSV header
    let csvContent = columns.join(',') + '\n';
    
    // Add data rows
    rows.forEach(row => {
      const rowValues = columns.map(col => {
        const value = row[col];
        // Handle different value types
        if (value === null || value === undefined) {
          return '';
        } else if (typeof value === 'string') {
          // Escape quotes and wrap in quotes
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csvContent += rowValues.join(',') + '\n';
    });
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${reportName || 'report'}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <>
      <Helmet>
        <title>Report Builder | Case Management</title>
      </Helmet>
      
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => navigate('/reports')} size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Reports
            </Button>
            <div className="h-6 border-l border-gray-300" />
            <h1 className="text-2xl font-bold tracking-tight">
              {id ? 'Edit Report' : 'Create Report'}
            </h1>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleExportCsv}
              disabled={isLoading || !reportData}
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            
            <Button
              variant="outline"
              onClick={handleRunReport}
              disabled={isLoading || !selectedFields.length}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Run Report
            </Button>
            
            <Button onClick={handleSaveReport} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Report Settings Card */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Report Settings</CardTitle>
              <CardDescription>Configure your report details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Report Name</Label>
                <Input 
                  id="name" 
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  placeholder="Enter a name for your report"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="baseTable">Base Table</Label>
                <Select
                  value={baseTable}
                  onValueChange={handleBaseTableChange}
                  disabled={!!id} // Cannot change base table after creation
                >
                  <SelectTrigger id="baseTable">
                    <SelectValue placeholder="Select a table" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingTables ? (
                      <div className="flex justify-center p-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : (
                      tables?.map((table) => (
                        <SelectItem key={table.name} value={table.name}>
                          {table.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="chartType">Visualization Type</Label>
                <Select
                  value={chartType}
                  onValueChange={(value) => setChartType(value as 'table' | 'bar' | 'line' | 'pie')}
                >
                  <SelectTrigger id="chartType">
                    <SelectValue placeholder="Select visualization type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="table">Table</SelectItem>
                    <SelectItem value="bar">Bar Chart</SelectItem>
                    <SelectItem value="line">Line Chart</SelectItem>
                    <SelectItem value="pie">Pie Chart</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          
          {/* Configuration and Preview Tabs */}
          <Card className="lg:col-span-2">
            <Tabs value={currentTab} onValueChange={setCurrentTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="fields">Fields & Filters</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
              
              <TabsContent value="fields" className="p-4 space-y-6">
                {/* Field Selector */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Available Fields</h3>
                  {!baseTable ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border rounded-md">
                      <p className="mb-4">No fields to display.</p>
                      <p>Please select a base table first.</p>
                    </div>
                  ) : availableFields.length === 0 ? (
                    <div className="flex justify-center py-8 border rounded-md">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 border rounded-md p-4">
                      {availableFields.map((field) => (
                        <div key={field} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`field-${field}`}
                            checked={selectedFields.includes(field)}
                            onCheckedChange={() => handleFieldToggle(field)}
                          />
                          <Label 
                            htmlFor={`field-${field}`}
                            className="text-sm font-medium cursor-pointer"
                          >
                            {field}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center mt-2">
                    <div className="text-sm text-muted-foreground">
                      {selectedFields.length} field{selectedFields.length !== 1 ? 's' : ''} selected
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedFields([])}
                      disabled={selectedFields.length === 0}
                    >
                      Clear All
                    </Button>
                  </div>
                </div>
                
                {/* Filter Builder */}
                <FilterBuilder
                  selectedFields={selectedFields}
                  filters={filters}
                  onAddFilter={handleAddFilter}
                  onRemoveFilter={handleRemoveFilter}
                  onUpdateFilter={handleUpdateFilter}
                />
              </TabsContent>
              
              <TabsContent value="preview" className="p-4">
                <ReportPreview
                  reportData={reportData}
                  visualizationType={chartType}
                  isRunning={isLoading}
                  onRunReport={handleRunReport}
                  onExportCsv={handleExportCsv}
                />
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </>
  );
};

export default ReportBuilder;
