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
import { VisualizationSelector } from '@/components/reports/VisualizationSelector';
import { ReportPreview } from '@/components/reports/ReportPreview';
import { useReports } from '@/hooks/useReports';
import { Report, ReportFilter } from '@/types/reports';
import { useForm } from 'react-hook-form';
import { Loader2, Save } from 'lucide-react';

const TableReportBuilder = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('data');
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [filters, setFilters] = useState<ReportFilter[]>([]);
  const [chartType, setChartType] = useState<Report['chart_type']>('table');
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
  }, [selectedTable]);

  // Get available fields for the selected table
  const getAvailableFields = () => {
    if (!selectedTable || !tables) return [];
    
    const tableInfo = tables.find(t => t.name === selectedTable);
    return tableInfo?.fields || [];
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
        filters: filters
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
        created_by: '', // This will be set by the backend using the authenticated user
        module: selectedTable,
        base_table: selectedTable,
        selected_fields: selectedFields,
        fields: selectedFields,
        filters: filters,
        chart_type: chartType,
        is_public: values.is_public
      });
      
      navigate('/reports');
    } catch (error) {
      console.error("Error saving report:", error);
    }
  };

  const availableFields = getAvailableFields();

  return (
    <>
      <Helmet>
        <title>Table Report Builder | Case Management</title>
      </Helmet>
      
      <div className="container mx-auto py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Table Report Builder</h1>
            <p className="text-muted-foreground">Create a report from any table in your database</p>
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
              Preview Report
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Report Details</CardTitle>
              <CardDescription>Provide basic information about your report</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Report Name</label>
                <Input
                  placeholder="My Custom Report"
                  {...form.register('name', { required: true })}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Description (Optional)</label>
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
                  Make this report public
                </label>
              </div>
            </CardContent>
          </Card>
          
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Report Configuration</CardTitle>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-3">
                  <TabsTrigger value="data">Select Data</TabsTrigger>
                  <TabsTrigger value="visualization">Visualization</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            
            <CardContent>
              <TabsContent value="data" className="space-y-6 mt-0">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Fields & Filters</h3>
                  
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
              
              <TabsContent value="visualization" className="mt-0">
                <VisualizationSelector
                  selectedType={chartType || 'table'}
                  onTypeChange={(type) => setChartType(type as Report['chart_type'])}
                  selectedFields={selectedFields}
                />
              </TabsContent>
              
              <TabsContent value="preview" className="mt-0">
                <ReportPreview
                  data={previewData}
                  columns={selectedFields}
                  chartType={chartType || 'table'}
                  isLoading={previewLoading}
                  onRunReport={handlePreview}
                  onExportCsv={() => {
                    // Simple CSV export function
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
