import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, Save, Download, Settings, Eye, Edit } from 'lucide-react';
import { ReportSettings } from '@/components/reports/ReportSettings';
import { ColumnSelector } from '@/components/reports/ColumnSelector';
import { FilterBuilder } from '@/components/reports/FilterBuilder';
import { ChartConfiguration } from '@/components/reports/ChartConfiguration';
import { ReportPreview } from '@/components/reports/ReportPreview';
import { useReports } from '@/hooks/useReports';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { ReportFilter, ColumnDefinition, ChartConfig } from '@/types/reports';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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
    runReportWithJoins,
    reports,
    isLoadingReports
  } = useReports();

  const form = useForm({
    defaultValues: {
      name: '',
      description: '',
      base_table: '',
      fields: [] as string[],
      is_public: false
    }
  });

  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [filters, setFilters] = useState<ReportFilter[]>([]);
  const [chartConfig, setChartConfig] = useState<ChartConfig>({ type: 'table' });
  const [availableColumns, setAvailableColumns] = useState<ColumnDefinition[]>([]);
  const [reportData, setReportData] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [currentReport, setCurrentReport] = useState<any>(null);
  const [showConfiguration, setShowConfiguration] = useState(false);

  // Load existing report if reportId is provided
  useEffect(() => {
    if (reportId && reports && reports.length > 0) {
      const report = reports.find(r => r.id === reportId);
      if (report) {
        console.log('Loading existing report:', report);
        console.log('Report date_grouping from database:', report.date_grouping);
        setCurrentReport(report);
        
        // Populate form
        form.setValue('name', report.name);
        form.setValue('description', report.description || '');
        form.setValue('base_table', report.base_table);
        form.setValue('is_public', report.is_public);
        
        // Set other fields
        const fieldsArray = Array.isArray(report.selected_fields) 
          ? report.selected_fields.map(field => String(field))
          : [];
        setSelectedFields(fieldsArray);
        form.setValue('fields', fieldsArray);
        setFilters(Array.isArray(report.filters) ? report.filters : []);
        
        // CRITICAL FIX: Properly load ALL chart configuration including date_grouping
        let loadedChartConfig: ChartConfig = {
          type: report.chart_type || 'table'
        };

        // Load aggregation
        if (report.aggregation) {
          loadedChartConfig.aggregation = report.aggregation as ChartConfig['aggregation'];
        }
        
        // Load X-axis (group_by)
        if (report.group_by) {
          loadedChartConfig.xAxis = report.group_by;
        }

        // CRITICAL: Load date_grouping field specifically from database
        if (report.date_grouping) {
          loadedChartConfig.dateGrouping = report.date_grouping as ChartConfig['dateGrouping'];
          console.log('✅ Successfully loaded date_grouping from database:', report.date_grouping);
        }

        console.log('Final loaded chart config with date grouping:', loadedChartConfig);
        setChartConfig(loadedChartConfig);

        // Auto-run report in view mode
        if (isViewMode && fieldsArray.length > 0 && report.base_table) {
          setTimeout(() => {
            handleRunReportWithConfig(report.base_table, fieldsArray, Array.isArray(report.filters) ? report.filters : []);
          }, 500);
        }
      }
    }
  }, [reportId, reports, form, isViewMode]);

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

  const handleRunReportWithConfig = async (baseTable?: string, fields?: string[], reportFilters?: ReportFilter[]) => {
    const tableToUse = baseTable || form.getValues('base_table');
    const fieldsToUse = fields || selectedFields;
    const filtersToUse = reportFilters || filters;
    
    if (!tableToUse || fieldsToUse.length === 0) {
      toast({
        variant: "destructive",
        title: "Cannot run report",
        description: "Please select a table and at least one field"
      });
      return;
    }

    setIsLoadingData(true);
    try {
      const result = await runReportWithJoins.mutateAsync({
        baseTable: tableToUse,
        selectedColumns: fieldsToUse,
        filters: filtersToUse
      });
      
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
      setReportData([]);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleRunReport = () => {
    handleRunReportWithConfig();
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
    
    if (!formValues.name || !formValues.base_table || selectedFields.length === 0) {
      toast({
        variant: "destructive",
        title: "Missing required fields",
        description: "Please provide a name, select a table, and choose at least one field"
      });
      return;
    }
    
    try {
      // CRITICAL FIX: Ensure ALL chart config is saved including date_grouping
      const reportData = {
        name: formValues.name,
        description: formValues.description,
        module: formValues.base_table,
        base_table: formValues.base_table,
        selected_fields: selectedFields,
        filters: filters,
        chart_type: chartConfig.type,
        aggregation: chartConfig.aggregation,
        group_by: chartConfig.xAxis,
        date_grouping: chartConfig.dateGrouping, // CRITICAL: Save date_grouping
        is_public: formValues.is_public
      };

      console.log('💾 Saving report with COMPLETE chart config:', chartConfig);
      console.log('💾 Date grouping being saved:', chartConfig.dateGrouping);

      if (reportId && isEditMode) {
        await updateReport.mutateAsync({
          id: reportId,
          ...reportData
        });
        
        setCurrentReport({
          ...currentReport,
          ...reportData,
          id: reportId
        });
        
        toast({
          title: "Report updated successfully"
        });
      } else {
        const newReport = await createReport.mutateAsync({
          ...reportData,
          created_by: user.id,
          fields: selectedFields
        });
        
        setCurrentReport(newReport);
        
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

  function getRelatedTables() {
    const baseTable = form.watch('base_table');
    
    if (!baseTable || !tables) return [];
    
    // Define relationships for the cases table
    if (baseTable === 'cases') {
      const relatedTables = [
        {
          name: 'users_submitted',
          columns: tables.find(t => t.name === 'users')?.fields.map(field => ({
            key: `users_submitted.${field}`,
            label: `Submitted By: ${formatFieldName(field)}`,
            table: 'users'
          })) || []
        },
        {
          name: 'users_assigned',
          columns: tables.find(t => t.name === 'users')?.fields.map(field => ({
            key: `users_assigned.${field}`,
            label: `Assigned To: ${formatFieldName(field)}`,
            table: 'users'
          })) || []
        },
        {
          name: 'case_categories',
          columns: tables.find(t => t.name === 'case_categories')?.fields.map(field => ({
            key: `case_categories.${field}`,
            label: `Category: ${formatFieldName(field)}`,
            table: 'case_categories'
          })) || []
        },
        {
          name: 'case_attachments',
          columns: tables.find(t => t.name === 'case_attachments')?.fields.map(field => ({
            key: `case_attachments.${field}`,
            label: `Attachments: ${formatFieldName(field)}`,
            table: 'case_attachments'
          })) || []
        },
        {
          name: 'case_activities',
          columns: tables.find(t => t.name === 'case_activities')?.fields.map(field => ({
            key: `case_activities.${field}`,
            label: `Activities: ${formatFieldName(field)}`,
            table: 'case_activities'
          })) || []
        }
      ];
      
      return relatedTables.filter(table => table.columns.length > 0);
    }
    
    return [];
  }

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
        <title>{reportId ? (isEditMode ? 'Edit Report' : currentReport?.name || 'View Report') : 'Create Report'} | Case Management</title>
      </Helmet>
      
      <div className="container mx-auto py-6 px-4 max-w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/reports')}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reports
          </Button>
          
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold truncate">
              {currentReport?.name || (reportId ? 'Report' : 'Create New Report')}
            </h1>
            {currentReport?.description && (
              <p className="text-muted-foreground text-sm sm:text-base truncate">{currentReport.description}</p>
            )}
          </div>

          {isViewMode && (
            <div className="flex flex-col sm:flex-row gap-2 shrink-0">
              <Button
                onClick={() => navigate(`/reports/builder?id=${reportId}&edit=true`)}
                className="gap-2 text-sm"
                size="sm"
              >
                <Edit className="h-4 w-4" />
                <span className="hidden sm:inline">Edit Report</span>
                <span className="sm:hidden">Edit</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfiguration(!showConfiguration)}
                className="text-sm"
              >
                <Settings className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{showConfiguration ? 'Hide' : 'Show'} Configuration</span>
                <span className="sm:hidden">{showConfiguration ? 'Hide' : 'Show'}</span>
              </Button>
            </div>
          )}
        </div>

        {isViewMode ? (
          // View Mode: Report Display First
          <div className="space-y-6">
            {/* Main Report Display */}
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <span className="text-lg sm:text-xl">Report Results</span>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportToCsv}
                      disabled={!reportData || reportData.length === 0}
                      className="text-sm"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export CSV
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleRunReport}
                      disabled={isLoadingData}
                      className="text-sm"
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Refresh
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <ReportPreview
                  data={reportData}
                  columns={selectedFields}
                  chartType={chartConfig.type}
                  isLoading={isLoadingData}
                  onRunReport={handleRunReport}
                  onExportCsv={exportToCsv}
                  chartConfig={chartConfig}
                  hideActions={true}
                />
              </CardContent>
            </Card>

            {/* Configuration - Collapsible */}
            <Collapsible open={showConfiguration} onOpenChange={setShowConfiguration}>
              <CollapsibleContent>
                <Card className="w-full">
                  <CardHeader>
                    <CardTitle>Report Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 p-4 sm:p-6">
                    <ReportSettings
                      form={form}
                      tables={tables}
                      isLoadingTables={isLoadingTables}
                      isEditMode={!!reportId}
                      onBaseTableChange={(value) => {
                        form.setValue('base_table', value);
                        setSelectedFields([]);
                        setChartConfig({ type: 'table' });
                      }}
                    />

                    <ColumnSelector
                      availableColumns={availableColumns}
                      selectedColumns={selectedFields}
                      onColumnChange={(fields) => {
                        setSelectedFields(fields);
                        form.setValue('fields', fields);
                      }}
                      relatedTables={getRelatedTables()}
                    />

                    <ChartConfiguration
                      availableColumns={availableColumns}
                      selectedFields={selectedFields}
                      chartConfig={chartConfig}
                      onChartConfigChange={setChartConfig}
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
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>
          </div>
        ) : (
          // Edit/Create Mode: Side by side layout on larger screens, stacked on mobile
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Configuration Panel */}
            <div className="space-y-6">
              <Card className="w-full">
                <CardHeader>
                  <CardTitle>Report Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 p-4 sm:p-6">
                  <ReportSettings
                    form={form}
                    tables={tables}
                    isLoadingTables={isLoadingTables}
                    isEditMode={!!reportId}
                    onBaseTableChange={(value) => {
                      form.setValue('base_table', value);
                      setSelectedFields([]);
                      setChartConfig({ type: 'table' });
                    }}
                  />

                  <ColumnSelector
                    availableColumns={availableColumns}
                    selectedColumns={selectedFields}
                    onColumnChange={(fields) => {
                      setSelectedFields(fields);
                      form.setValue('fields', fields);
                    }}
                    relatedTables={getRelatedTables()}
                  />

                  <ChartConfiguration
                    availableColumns={availableColumns}
                    selectedFields={selectedFields}
                    chartConfig={chartConfig}
                    onChartConfigChange={setChartConfig}
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

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button 
                      onClick={handleSaveReport}
                      disabled={!form.watch('name') || !form.watch('base_table') || selectedFields.length === 0}
                      className="text-sm"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {reportId && isEditMode ? 'Update Report' : 'Save Report'}
                    </Button>
                    
                    <Button 
                      variant="outline"
                      onClick={handleRunReport}
                      disabled={!form.watch('base_table') || selectedFields.length === 0}
                      className="text-sm"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Run Report
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Preview Panel */}
            <div className="w-full">
              <Card className="w-full">
                <CardHeader>
                  <CardTitle>Report Preview</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <ReportPreview
                    data={reportData}
                    columns={selectedFields}
                    chartType={chartConfig.type}
                    isLoading={isLoadingData}
                    onRunReport={handleRunReport}
                    onExportCsv={exportToCsv}
                    chartConfig={chartConfig}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ReportBuilder;
