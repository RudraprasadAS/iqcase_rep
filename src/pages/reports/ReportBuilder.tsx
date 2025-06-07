
import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Save, Play, Plus, X, Database, BarChart3, Table, PieChart, LineChart } from 'lucide-react';
import { useReportBuilder } from '@/hooks/useReportBuilder';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import type { ReportConfig, SelectedField, ReportFilter, AggregationConfig } from '@/types/reports';

const ReportBuilder = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const { toast } = useToast();
  
  const { 
    dataSources, 
    tableMetadata, 
    reportTemplates,
    createReport, 
    updateReport,
    executeReport,
    isLoadingDataSources 
  } = useReportBuilder();

  // Form state
  const [reportName, setReportName] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [baseTable, setBaseTable] = useState('');
  const [selectedFields, setSelectedFields] = useState<SelectedField[]>([]);
  const [filters, setFilters] = useState<ReportFilter[]>([]);
  const [aggregations, setAggregations] = useState<AggregationConfig[]>([]);
  const [chartType, setChartType] = useState<'table' | 'bar' | 'line' | 'pie' | 'donut'>('table');
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);

  // Load existing report for editing
  useEffect(() => {
    if (editId && reportTemplates) {
      const existingReport = reportTemplates.find(r => r.id === editId);
      if (existingReport) {
        setReportName(existingReport.name);
        setReportDescription(existingReport.description || '');
        setBaseTable(existingReport.base_table);
        setSelectedFields(existingReport.config.selected_fields || []);
        setFilters(existingReport.config.filters || []);
        setAggregations(existingReport.config.aggregations || []);
        setChartType(existingReport.config.chart_type || 'table');
      }
    }
  }, [editId, reportTemplates]);

  const getAvailableFields = () => {
    if (!baseTable || !tableMetadata) return [];
    return tableMetadata.filter((field: any) => field.table_name === baseTable);
  };

  const addField = (fieldName: string) => {
    const field: SelectedField = {
      table: baseTable,
      field: fieldName,
      label: fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    };
    
    if (!selectedFields.find(f => f.field === fieldName && f.table === baseTable)) {
      setSelectedFields([...selectedFields, field]);
    }
  };

  const removeField = (index: number) => {
    setSelectedFields(selectedFields.filter((_, i) => i !== index));
  };

  const addFilter = () => {
    const availableFields = getAvailableFields();
    if (availableFields.length === 0) return;
    
    const newFilter: ReportFilter = {
      field: availableFields[0].column_name,
      operator: 'eq',
      value: '',
      table: baseTable
    };
    setFilters([...filters, newFilter]);
  };

  const updateFilter = (index: number, updates: Partial<ReportFilter>) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], ...updates };
    setFilters(newFilters);
  };

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const addAggregation = () => {
    const availableFields = getAvailableFields();
    const numericFields = availableFields.filter((f: any) => 
      ['integer', 'numeric', 'bigint', 'decimal'].includes(f.data_type)
    );
    
    if (numericFields.length === 0) return;
    
    const newAgg: AggregationConfig = {
      function: 'COUNT',
      field: numericFields[0].column_name,
      alias: `count_${numericFields[0].column_name}`,
      table: baseTable
    };
    setAggregations([...aggregations, newAgg]);
  };

  const updateAggregation = (index: number, updates: Partial<AggregationConfig>) => {
    const newAggs = [...aggregations];
    newAggs[index] = { ...newAggs[index], ...updates };
    setAggregations(newAggs);
  };

  const removeAggregation = (index: number) => {
    setAggregations(aggregations.filter((_, i) => i !== index));
  };

  const previewReport = async () => {
    if (!baseTable || selectedFields.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select a base table and at least one field',
        variant: 'destructive'
      });
      return;
    }

    setIsExecuting(true);
    try {
      const config: ReportConfig = {
        selected_fields: selectedFields,
        filters: filters.filter(f => f.value.trim() !== ''),
        grouping: [],
        aggregations,
        joins: [],
        chart_type: chartType
      };

      const result = await executeReport.mutateAsync(config);
      setPreviewData(result.data || []);
    } catch (error) {
      console.error('Preview error:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const saveReport = async () => {
    if (!reportName.trim() || !baseTable || selectedFields.length === 0) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    const config: ReportConfig = {
      selected_fields: selectedFields,
      filters: filters.filter(f => f.value.trim() !== ''),
      grouping: [],
      aggregations,
      joins: [],
      chart_type: chartType
    };

    try {
      if (editId) {
        await updateReport.mutateAsync({
          id: editId,
          name: reportName,
          description: reportDescription,
          config
        });
      } else {
        await createReport.mutateAsync({
          name: reportName,
          description: reportDescription,
          base_table: baseTable,
          config,
          is_public: false,
          is_active: true
        });
      }
      navigate('/reports');
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  if (isLoadingDataSources) {
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
        <title>{editId ? 'Edit Report' : 'Report Builder'} | Case Management</title>
      </Helmet>
      
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/reports')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Reports
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{editId ? 'Edit Report' : 'Report Builder'}</h1>
              <p className="text-muted-foreground">Create dynamic reports with drag-and-drop simplicity</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={previewReport} disabled={isExecuting}>
              <Play className="h-4 w-4 mr-2" />
              {isExecuting ? 'Running...' : 'Preview'}
            </Button>
            <Button onClick={saveReport}>
              <Save className="h-4 w-4 mr-2" />
              Save Report
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Report Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="reportName">Report Name *</Label>
                  <Input
                    id="reportName"
                    value={reportName}
                    onChange={(e) => setReportName(e.target.value)}
                    placeholder="Enter report name"
                  />
                </div>
                <div>
                  <Label htmlFor="reportDescription">Description</Label>
                  <Textarea
                    id="reportDescription"
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    placeholder="Enter report description"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Data Source */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Data Source
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label>Base Table *</Label>
                  <Select value={baseTable} onValueChange={setBaseTable}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a table" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cases">Cases</SelectItem>
                      <SelectItem value="users">Users</SelectItem>
                      <SelectItem value="case_activities">Case Activities</SelectItem>
                      <SelectItem value="case_messages">Case Messages</SelectItem>
                      <SelectItem value="case_feedback">Case Feedback</SelectItem>
                      <SelectItem value="notifications">Notifications</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Fields Selection */}
            {baseTable && (
              <Card>
                <CardHeader>
                  <CardTitle>Fields</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Available Fields</Label>
                    <div className="border rounded p-2 max-h-32 overflow-y-auto">
                      {getAvailableFields().map((field: any) => (
                        <Button
                          key={field.column_name}
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start h-8"
                          onClick={() => addField(field.column_name)}
                        >
                          <Plus className="h-3 w-3 mr-2" />
                          {field.column_name}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  {selectedFields.length > 0 && (
                    <div>
                      <Label>Selected Fields</Label>
                      <div className="space-y-1">
                        {selectedFields.map((field, index) => (
                          <div key={index} className="flex items-center justify-between bg-muted rounded p-2">
                            <span className="text-sm">{field.label}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeField(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Chart Type */}
            <Card>
              <CardHeader>
                <CardTitle>Visualization</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label>Chart Type</Label>
                  <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="table">
                        <div className="flex items-center gap-2">
                          <Table className="h-4 w-4" />
                          Table
                        </div>
                      </SelectItem>
                      <SelectItem value="bar">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          Bar Chart
                        </div>
                      </SelectItem>
                      <SelectItem value="line">
                        <div className="flex items-center gap-2">
                          <LineChart className="h-4 w-4" />
                          Line Chart
                        </div>
                      </SelectItem>
                      <SelectItem value="pie">
                        <div className="flex items-center gap-2">
                          <PieChart className="h-4 w-4" />
                          Pie Chart
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview Panel */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Preview</CardTitle>
              </CardHeader>
              <CardContent>
                {previewData.length > 0 ? (
                  <div className="overflow-auto max-h-96">
                    <table className="w-full border-collapse border border-gray-200">
                      <thead>
                        <tr className="bg-gray-50">
                          {Object.keys(previewData[0]).map((key) => (
                            <th key={key} className="border border-gray-200 p-2 text-left">
                              {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.slice(0, 10).map((row, index) => (
                          <tr key={index}>
                            {Object.values(row).map((value: any, cellIndex) => (
                              <td key={cellIndex} className="border border-gray-200 p-2">
                                {value?.toString() || '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {previewData.length > 10 && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Showing first 10 of {previewData.length} records
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-48 text-muted-foreground">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                      <p>Click "Preview" to see your report data</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default ReportBuilder;
