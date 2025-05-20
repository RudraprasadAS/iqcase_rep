
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useReports } from '@/hooks/useReports';
import { supabase } from '@/integrations/supabase/client';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { ReportFilter, Report, ReportData } from '@/types/reports';
import { Loader2, Play, Save, ArrowLeft } from 'lucide-react';
import { FieldSelector } from '@/components/reports/FieldSelector';
import { FilterBuilder } from '@/components/reports/FilterBuilder';
import { VisualizationSelector } from '@/components/reports/VisualizationSelector';
import { ReportPreview } from '@/components/reports/ReportPreview';
import { ReportSettings } from '@/components/reports/ReportSettings';
import { Json } from '@/integrations/supabase/types';

interface ReportForm {
  name: string;
  description: string;
  base_table: string;
  fields: string[];
  is_public: boolean;
}

const ReportBuilder = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { 
    tables, 
    isLoadingTables,
    updateReport, 
    runReport, 
    setSelectedReportId
  } = useReports();
  
  const [activeTab, setActiveTab] = useState('fields');
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [availableFields, setAvailableFields] = useState<string[]>([]);
  const [filters, setFilters] = useState<ReportFilter[]>([]);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [visualizationType, setVisualizationType] = useState<'table' | 'bar' | 'line' | 'pie'>('table');

  const form = useForm<ReportForm>({
    defaultValues: {
      name: '',
      description: '',
      base_table: '',
      fields: [],
      is_public: false
    }
  });

  // Load report details
  useEffect(() => {
    if (!id) return;
    
    const fetchReport = async () => {
      setSelectedReportId(id);
      
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: `Failed to load report: ${error.message}`
        });
        return;
      }
      
      // Parse filters if they're stored as string
      const parsedFilters = typeof data.filters === 'string' 
        ? JSON.parse(data.filters) 
        : data.filters;

      // Process filters to ensure they match ReportFilter type
      const processedFilters = Array.isArray(parsedFilters) 
        ? parsedFilters.map((filter: any) => ({
            field: filter.field,
            operator: filter.operator as ReportFilter['operator'],
            value: filter.value
          })) as ReportFilter[]
        : [];
      
      // Map the DB structure to our interface
      const reportData = {
        ...data,
        fields: Array.isArray(data.selected_fields) ? data.selected_fields as string[] : [],
        selected_fields: data.selected_fields,
        base_table: data.module,
        module: data.module,
        filters: processedFilters
      } as Report;
      
      setReport(reportData);
      
      // Set form values
      form.reset({
        name: reportData.name,
        description: reportData.description || '',
        base_table: reportData.base_table || reportData.module || '',
        fields: reportData.fields || [],
        is_public: reportData.is_public || false
      });
      
      setSelectedFields(reportData.fields || []);
      
      // Handle filters if present
      if (reportData.filters && Array.isArray(reportData.filters)) {
        setFilters(reportData.filters as ReportFilter[]);
      }
      
      // Set visualization type if present
      if (reportData.chart_type) {
        setVisualizationType(reportData.chart_type as any);
      }
      
      // Load available fields for the base table
      if (reportData.base_table || reportData.module) {
        loadAvailableFields(reportData.base_table || reportData.module);
      }
    };
    
    fetchReport();
  }, [id]);

  const loadAvailableFields = (tableName: string) => {
    if (!tables) return;
    
    const tableInfo = tables.find(table => table.name === tableName);
    if (tableInfo) {
      setAvailableFields(tableInfo.fields);
    }
  };

  const handleBaseTableChange = (value: string) => {
    form.setValue('base_table', value);
    setSelectedFields([]);
    form.setValue('fields', []);
    loadAvailableFields(value);
  };

  const handleFieldToggle = (field: string) => {
    const isSelected = selectedFields.includes(field);
    let updatedFields: string[];
    
    if (isSelected) {
      updatedFields = selectedFields.filter(f => f !== field);
    } else {
      updatedFields = [...selectedFields, field];
    }
    
    setSelectedFields(updatedFields);
    form.setValue('fields', updatedFields);
  };

  const addFilter = () => {
    if (!selectedFields.length) return;
    
    setFilters([
      ...filters,
      {
        field: selectedFields[0],
        operator: 'eq',
        value: ''
      }
    ]);
  };

  const updateFilter = (index: number, key: keyof ReportFilter, value: any) => {
    const updatedFilters = [...filters];
    updatedFilters[index] = { ...updatedFilters[index], [key]: value };
    setFilters(updatedFilters);
  };

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const handleSaveReport = async () => {
    if (!id || !report) return;
    
    const formValues = form.getValues();
    
    updateReport.mutate({
      id,
      name: formValues.name,
      description: formValues.description,
      module: formValues.base_table,
      base_table: formValues.base_table,
      selected_fields: selectedFields,
      fields: selectedFields,
      filters: filters as unknown as Json,
      is_public: formValues.is_public,
      chart_type: visualizationType
    });
  };

  const handleRunReport = async () => {
    if (!id) return;
    
    setIsRunning(true);
    
    try {
      const result = await runReport.mutateAsync(id);
      setReportData(result);
      setActiveTab('results');
    } catch (error) {
      console.error('Error running report:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to run report'
      });
    } finally {
      setIsRunning(false);
    }
  };

  const exportToCsv = () => {
    if (!reportData) return;
    
    const headers = reportData.columns.join(',');
    const rows = reportData.rows.map(row => 
      reportData.columns.map(col => row[col]).join(',')
    );
    const csvContent = `${headers}\n${rows.join('\n')}`;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${report?.name || 'report'}.csv`);
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
              onClick={handleRunReport}
              disabled={isRunning || !selectedFields.length}
            >
              {isRunning ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Run Report
            </Button>
            
            <Button onClick={handleSaveReport} disabled={updateReport.isPending}>
              {updateReport.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Report Settings</CardTitle>
              <CardDescription>Configure your report details</CardDescription>
            </CardHeader>
            <CardContent>
              <ReportSettings 
                form={form} 
                tables={tables} 
                isLoadingTables={isLoadingTables} 
                isEditMode={!!id}
                onBaseTableChange={handleBaseTableChange}
              />
            </CardContent>
          </Card>
          
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Report Definition</CardTitle>
              <CardDescription>Define fields, filters, and visualization</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="fields">Fields</TabsTrigger>
                  <TabsTrigger value="filters">Filters</TabsTrigger>
                  <TabsTrigger value="results">Results</TabsTrigger>
                </TabsList>
                
                <TabsContent value="fields">
                  <div className="space-y-4">
                    <FieldSelector
                      availableFields={availableFields}
                      selectedFields={selectedFields}
                      onFieldToggle={handleFieldToggle}
                    />
                    
                    <VisualizationSelector 
                      visualizationType={visualizationType}
                      onVisualizationChange={setVisualizationType}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="filters">
                  <FilterBuilder
                    selectedFields={selectedFields}
                    filters={filters}
                    onAddFilter={addFilter}
                    onRemoveFilter={removeFilter}
                    onUpdateFilter={updateFilter}
                  />
                </TabsContent>
                
                <TabsContent value="results">
                  <ReportPreview
                    reportData={reportData}
                    visualizationType={visualizationType}
                    isRunning={isRunning}
                    onRunReport={handleRunReport}
                    onExportCsv={exportToCsv}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                variant="outline"
                onClick={handleRunReport}
                disabled={isRunning || !selectedFields.length}
              >
                {isRunning ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Run Report
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  );
};

export default ReportBuilder;
