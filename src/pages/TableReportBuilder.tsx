
import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { TableSelector } from '@/components/reports/TableSelector';
import { FieldSelector } from '@/components/reports/FieldSelector';
import { FilterBuilder } from '@/components/reports/FilterBuilder';
import { ChartConfiguration } from '@/components/reports/ChartConfiguration';
import { ReportPreview } from '@/components/reports/ReportPreview';
import { useReports } from '@/hooks/useReports';
import { Report, ReportFilter, ChartConfig, ColumnDefinition } from '@/types/reports';
import { useForm } from 'react-hook-form';
import { Loader2, Save, Eye } from 'lucide-react';

const TableReportBuilder = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('data');
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [filters, setFilters] = useState<ReportFilter[]>([]);
  const [chartConfig, setChartConfig] = useState<ChartConfig>({
    type: 'table'
  });
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);

  const { 
    tables, 
    isLoadingTables, 
    createReport,
    runReportWithJoins
  } = useReports();

  const form = useForm({
    defaultValues: {
      name: '',
      description: '',
      is_public: false
    }
  });

  // Reset selections when table changes
  useEffect(() => {
    setSelectedFields([]);
    setFilters([]);
    setChartConfig({ type: 'table' });
  }, [selectedTable]);

  // Get available fields for the selected table
  const getAvailableFields = () => {
    if (!selectedTable || !tables) return [];
    
    const tableInfo = tables.find(t => t.name === selectedTable);
    return tableInfo?.fields || [];
  };

  // Get column definitions for chart configuration
  const getColumnDefinitions = (): ColumnDefinition[] => {
    const availableFields = getAvailableFields();
    return availableFields.map(field => ({
      key: field,
      label: field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      table: selectedTable || ''
    }));
  };

  const handleAddFilter = () => {
    const availableFields = getAvailableFields();
    if (availableFields.length === 0) return;

    const newFilter: ReportFilter = {
      field: availableFields[0],
      operator: 'eq',
      value: ''
    };
    
    setFilters([...filters, newFilter]);
  };
  
  const handleRemoveFilter = (index: number) => {
    const newFilters = [...filters];
    newFilters.splice(index, 1);
    setFilters(newFilters);
  };
  
  const handleUpdateFilter = (index: number, key: keyof ReportFilter, value: any) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], [key]: value };
    setFilters(newFilters);
  };

  const handleFieldToggle = (field: string) => {
    if (selectedFields.includes(field)) {
      setSelectedFields(selectedFields.filter(f => f !== field));
    } else {
      setSelectedFields([...selectedFields, field]);
    }
  };

  const handlePreview = async () => {
    if (!selectedTable || selectedFields.length === 0) return;
    
    setPreviewLoading(true);
    
    try {
      const result = await runReportWithJoins.mutateAsync({
        baseTable: selectedTable,
        selectedColumns: selectedFields,
        filters: filters,
        chartConfig: chartConfig
      });
      
      setPreviewData(result.rows);
      setActiveTab('preview');
    } catch (error) {
      console.error("Preview error:", error);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSaveReport = async () => {
    if (!selectedTable || selectedFields.length === 0) return;
    
    const values = form.getValues();
    
    try {
      await createReport.mutateAsync({
        name: values.name,
        description: values.description,
        created_by: '',
        module: selectedTable,
        base_table: selectedTable,
        selected_fields: selectedFields,
        fields: selectedFields,
        filters: filters,
        chart_type: chartConfig.type,
        aggregation: chartConfig.aggregation,
        group_by: chartConfig.xAxis,
        is_public: values.is_public
      });
      
      navigate('/reports');
    } catch (error) {
      console.error("Error saving report:", error);
    }
  };

  const availableFields = getAvailableFields();
  const columnDefinitions = getColumnDefinitions();

  return (
    <>
      <Helmet>
        <title>Report Builder | Case Management</title>
      </Helmet>
      
      <div className="container mx-auto py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Report Builder</h1>
            <p className="text-muted-foreground">Create custom reports with charts and visualizations</p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate('/reports')}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePreview}
              disabled={!selectedTable || selectedFields.length === 0 || previewLoading}
            >
              {previewLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Report Configuration</CardTitle>
              <CardDescription>Set up your report details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Report Name *</label>
                <Input
                  placeholder="My Custom Report"
                  {...form.register('name', { required: true })}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Describe what this report shows..."
                  className="resize-none"
                  {...form.register('description')}
                />
              </div>
              
              <TableSelector
                tables={tables || []}
                selectedTable={selectedTable}
                onTableSelect={setSelectedTable}
                isLoading={isLoadingTables}
              />
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_public"
                  className="rounded border-gray-300"
                  {...form.register('is_public')}
                />
                <label htmlFor="is_public" className="text-sm font-medium">
                  Make public
                </label>
              </div>
            </CardContent>
          </Card>
          
          <Card className="lg:col-span-3">
            <CardHeader>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-4">
                  <TabsTrigger value="data">Data</TabsTrigger>
                  <TabsTrigger value="chart">Chart</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                  <TabsTrigger value="save">Save</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            
            <CardContent>
              <TabsContent value="data" className="space-y-6 mt-0">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Select Fields & Filters</h3>
                  
                  <FieldSelector
                    availableFields={availableFields}
                    selectedFields={selectedFields}
                    onFieldToggle={handleFieldToggle}
                  />
                  
                  <div className="pt-4 border-t">
                    <FilterBuilder
                      selectedFields={availableFields}
                      filters={filters}
                      onAddFilter={handleAddFilter}
                      onRemoveFilter={handleRemoveFilter}
                      onUpdateFilter={handleUpdateFilter}
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="chart" className="mt-0">
                <ChartConfiguration
                  availableColumns={columnDefinitions}
                  selectedFields={selectedFields}
                  chartConfig={chartConfig}
                  onChartConfigChange={setChartConfig}
                />
              </TabsContent>
              
              <TabsContent value="preview" className="mt-0">
                <ReportPreview
                  data={previewData}
                  columns={selectedFields}
                  chartType={chartConfig.type}
                  chartConfig={chartConfig}
                  isLoading={previewLoading}
                  onRunReport={handlePreview}
                  onExportCsv={() => {
                    if (previewData.length === 0) return;
                    
                    const csvContent = [
                      selectedFields.join(','),
                      ...previewData.map(row => 
                        selectedFields.map(field => 
                          row[field] !== null && row[field] !== undefined ? `"${row[field]}"` : '""'
                        ).join(',')
                      )
                    ].join('\n');
                    
                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                    const link = document.createElement('a');
                    const url = URL.createObjectURL(blob);
                    link.href = url;
                    link.setAttribute('download', `report-${new Date().toISOString().split('T')[0]}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                />
              </TabsContent>

              <TabsContent value="save" className="mt-0">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Ready to Save</h3>
                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Report Summary:</h4>
                    <ul className="space-y-1 text-sm">
                      <li><strong>Table:</strong> {selectedTable}</li>
                      <li><strong>Fields:</strong> {selectedFields.length} selected</li>
                      <li><strong>Filters:</strong> {filters.length} applied</li>
                      <li><strong>Chart Type:</strong> {chartConfig.type}</li>
                      {chartConfig.xAxis && <li><strong>X-Axis:</strong> {chartConfig.xAxis}</li>}
                      {chartConfig.yAxis && <li><strong>Y-Axis:</strong> {chartConfig.yAxis}</li>}
                      {chartConfig.aggregation && <li><strong>Aggregation:</strong> {chartConfig.aggregation}</li>}
                    </ul>
                  </div>
                </div>
              </TabsContent>
            </CardContent>
            
            <CardFooter className="flex justify-end border-t pt-4">
              <Button 
                onClick={handleSaveReport}
                disabled={!selectedTable || selectedFields.length === 0 || !form.watch('name')}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Report
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  );
};

export default TableReportBuilder;
