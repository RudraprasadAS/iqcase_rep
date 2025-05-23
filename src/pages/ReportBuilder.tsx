
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, Save, Download } from 'lucide-react';
import { ReportSettings } from '@/components/reports/ReportSettings';
import { ColumnSelector } from '@/components/reports/ColumnSelector';
import { FilterBuilder } from '@/components/reports/FilterBuilder';
import { VisualizationSelector } from '@/components/reports/VisualizationSelector';
import { ReportPreview } from '@/components/reports/ReportPreview';
import { useReports } from '@/hooks/useReports';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { ReportFilter, ColumnDefinition } from '@/types/reports';

const ReportBuilder = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const reportId = searchParams.get('id');
  const isEditMode = searchParams.get('edit') === 'true';
  const isViewMode = searchParams.get('view') === 'true';
  
  const {
    tables,
    isLoadingTables,
    createReport,
    updateReport,
    runReport,
    reports,
    isLoadingReports
  } = useReports();

  const form = useForm({
    defaultValues: {
      name: '',
      description: '',
      base_table: '',
      is_public: false
    }
  });

  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [filters, setFilters] = useState<ReportFilter[]>([]);
  const [chartType, setChartType] = useState<'table' | 'bar' | 'line' | 'pie'>('table');
  const [availableColumns, setAvailableColumns] = useState<ColumnDefinition[]>([]);
  const [reportData, setReportData] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [currentReport, setCurrentReport] = useState<any>(null);

  // Load existing report if reportId is provided
  useEffect(() => {
    if (reportId && reports && reports.length > 0) {
      const report = reports.find(r => r.id === reportId);
      if (report) {
        console.log('Loading existing report:', report);
        setCurrentReport(report);
        
        // Populate form
        form.setValue('name', report.name);
        form.setValue('description', report.description || '');
        form.setValue('base_table', report.module);
        form.setValue('is_public', report.is_public);
        
        // Set other fields - fix type conversion for selectedFields
        const fieldsArray = Array.isArray(report.selected_fields) 
          ? report.selected_fields.map(field => String(field))
          : [];
        setSelectedFields(fieldsArray);
        setFilters(Array.isArray(report.filters) ? report.filters : []);
        setChartType(report.chart_type || 'table');
        
        // Auto-run report if in view mode
        if (isViewMode) {
          handleRunReport();
        }
      }
    }
  }, [reportId, reports, isViewMode, form]);

  // Update available columns when base table changes
  useEffect(() => {
    const baseTable = form.watch('base_table');
    if (baseTable && tables) {
      const tableInfo = tables.find(table => table.name === baseTable);
      if (tableInfo && tableInfo.fields) {
        const columns: ColumnDefinition[] = tableInfo.fields.map(field => ({
          key: field,
          label: formatFieldName(field),
          table: baseTable
        }));
        setAvailableColumns(columns);
      }
    }
  }, [form.watch('base_table'), tables]);

  const formatFieldName = (fieldName: string): string => {
    return fieldName
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  };

  const handleRunReport = async () => {
    if (!currentReport) {
      toast({
        variant: "destructive",
        title: "No report to run",
        description: "Please create or select a report first"
      });
      return;
    }

    setIsLoadingData(true);
    try {
      console.log('Running report with ID:', currentReport.id);
      const result = await runReport.mutateAsync(currentReport.id);
      
      console.log('Report result:', result);
      setReportData(result.rows || []);
      
      toast({
        title: "Report executed successfully",
        description: `Found ${result.rows?.length || 0} records`
      });
    } catch (error) {
      console.error('Error running report:', error);
      toast({
        variant: "destructive",
        title: "Error running report",
        description: "Failed to execute report. Please try again."
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleSaveReport = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please sign in to save reports"
      });
      return;
    }

    const formValues = form.getValues();
    
    try {
      if (reportId && isEditMode) {
        // Update existing report
        await updateReport.mutateAsync({
          id: reportId,
          name: formValues.name,
          description: formValues.description,
          module: formValues.base_table,
          selected_fields: selectedFields,
          filters: filters,
          chart_type: chartType,
          is_public: formValues.is_public
        });
        toast({
          title: "Report updated successfully"
        });
      } else {
        // Create new report
        const newReport = await createReport.mutateAsync({
          name: formValues.name,
          description: formValues.description,
          created_by: user.id,
          module: formValues.base_table,
          base_table: formValues.base_table,
          fields: selectedFields,
          selected_fields: selectedFields,
          filters: filters,
          chart_type: chartType,
          is_public: formValues.is_public
        });
        
        toast({
          title: "Report created successfully"
        });
        
        // Navigate to view the new report
        navigate(`/reports/builder?id=${newReport.id}&view=true`);
      }
    } catch (error) {
      console.error('Error saving report:', error);
      toast({
        variant: "destructive",
        title: "Error saving report",
        description: "Failed to save report. Please try again."
      });
    }
  };

  const exportToCsv = () => {
    if (!reportData || reportData.length === 0) return;
    
    const headers = selectedFields.length > 0 ? selectedFields : Object.keys(reportData[0]);
    let csvContent = headers.join(',') + '\n';
    
    reportData.forEach((row) => {
      const values = headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return JSON.stringify(value).replace(/,/g, ';');
        return String(value).replace(/,/g, ';');
      });
      csvContent += values.join(',') + '\n';
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${form.getValues('name') || 'report'}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const addFilter = () => {
    const newFilter: ReportFilter = {
      field: availableColumns[0]?.key || '',
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

  if (isLoadingTables || isLoadingReports) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center p-8">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-primary rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{reportId ? (isEditMode ? 'Edit Report' : 'View Report') : 'Create Report'} | Case Management</title>
      </Helmet>
      
      <div className="container mx-auto py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/reports')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reports
          </Button>
          
          <div>
            <h1 className="text-2xl font-bold">
              {reportId ? (isEditMode ? 'Edit Report' : 'View Report') : 'Create New Report'}
            </h1>
            {currentReport && (
              <p className="text-muted-foreground">{currentReport.name}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuration Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Report Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <ReportSettings
                  form={form}
                  tables={tables}
                  isLoadingTables={isLoadingTables}
                  isEditMode={!!reportId}
                />

                <ColumnSelector
                  availableColumns={availableColumns}
                  selectedColumns={selectedFields}
                  onColumnChange={setSelectedFields}
                  relatedTables={[]}
                />

                <VisualizationSelector
                  selectedType={chartType}
                  onTypeChange={setChartType}
                  selectedFields={selectedFields}
                />

                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Filters</h3>
                  <FilterBuilder
                    selectedFields={availableColumns.map(col => col.key)}
                    filters={filters}
                    onAddFilter={addFilter}
                    onRemoveFilter={removeFilter}
                    onUpdateFilter={updateFilter}
                  />
                </div>

                <div className="flex gap-2">
                  {!isViewMode && (
                    <Button 
                      onClick={handleSaveReport}
                      disabled={!form.watch('name') || !form.watch('base_table') || selectedFields.length === 0}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {reportId && isEditMode ? 'Update Report' : 'Save Report'}
                    </Button>
                  )}
                  
                  <Button 
                    variant="outline"
                    onClick={handleRunReport}
                    disabled={!form.watch('base_table') || selectedFields.length === 0}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Run Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview Panel */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Report Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <ReportPreview
                  data={reportData}
                  columns={selectedFields}
                  chartType={chartType}
                  isLoading={isLoadingData}
                  onRunReport={handleRunReport}
                  onExportCsv={exportToCsv}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default ReportBuilder;
