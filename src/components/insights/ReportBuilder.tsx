
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useInsights } from '@/hooks/useInsights';
import { RelationalFieldSelector } from './RelationalFieldSelector';
import { FilterBuilder } from './FilterBuilder';
import { ChartSelector } from './ChartSelector';
import { ReportPreview } from './ReportPreview';
import { DataSource, InsightFilter, ChartConfig } from '@/types/insights';
import { Save, Play, ArrowLeft, Edit } from 'lucide-react';

export const ReportBuilder = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { dataSources, executeReport, createReport, updateReport, reports, setSelectedReportId } = useInsights();
  
  const reportId = searchParams.get('id');
  const mode = searchParams.get('mode') || 'create'; // create, edit, view
  
  const [selectedDataSource, setSelectedDataSource] = useState<DataSource | null>(null);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [filters, setFilters] = useState<InsightFilter[]>([]);
  const [chartConfig, setChartConfig] = useState<ChartConfig>({ type: 'table' });
  const [reportName, setReportName] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [previewData, setPreviewData] = useState<any>(null);

  // Load existing report if reportId is provided
  useEffect(() => {
    if (reportId) {
      setSelectedReportId(reportId);
      const report = reports?.find(r => r.id === reportId);
      if (report) {
        setReportName(report.name);
        setReportDescription(report.description || '');
        setSelectedFields(Array.isArray(report.selected_fields) ? report.selected_fields : []);
        setFilters(Array.isArray(report.filters) ? report.filters : []);
        setChartConfig(report.chart_config || { type: 'table' });
        
        // Find and set the data source
        const dataSource = dataSources?.find(ds => ds.id === report.data_source_id);
        if (dataSource) {
          setSelectedDataSource(dataSource);
        }
      }
    }
  }, [reportId, reports, dataSources, setSelectedReportId]);

  const handleRunReport = async () => {
    if (!selectedDataSource || selectedFields.length === 0) {
      return;
    }

    const fieldsForQuery = selectedFields.map(fieldName => {
      const field = selectedDataSource.fields.find(f => f.name === fieldName);
      return { name: fieldName, label: field?.label || fieldName };
    });

    try {
      const result = await executeReport.mutateAsync({
        dataSourceName: selectedDataSource.name,
        selectedFields: fieldsForQuery,
        filters,
        groupBy: [],
        aggregations: []
      });
      setPreviewData(result);
    } catch (error) {
      console.error('Error running report:', error);
    }
  };

  const handleSaveReport = async () => {
    if (!selectedDataSource || !reportName || selectedFields.length === 0) {
      return;
    }

    try {
      if (reportId && mode === 'edit') {
        await updateReport.mutateAsync({
          id: reportId,
          name: reportName,
          description: reportDescription,
          data_source_id: selectedDataSource.id,
          selected_fields: selectedFields,
          calculated_fields: [],
          filters,
          group_by: [],
          aggregations: [],
          chart_config: chartConfig,
          is_template: false,
          is_public: false,
          tags: []
        });
      } else {
        await createReport.mutateAsync({
          name: reportName,
          description: reportDescription,
          data_source_id: selectedDataSource.id,
          selected_fields: selectedFields,
          calculated_fields: [],
          filters,
          group_by: [],
          aggregations: [],
          chart_config: chartConfig,
          is_template: false,
          is_public: false,
          tags: [],
          created_by: '' // This will be set in the hook
        });
      }
      
      navigate('/insights');
    } catch (error) {
      console.error('Error saving report:', error);
    }
  };

  const isViewMode = mode === 'view';
  const canRunReport = selectedDataSource && selectedFields.length > 0;
  const canSaveReport = canRunReport && reportName.trim() !== '';

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/insights')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Insights
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {mode === 'create' ? 'Create Report' : mode === 'edit' ? 'Edit Report' : 'View Report'}
            </h1>
            <p className="text-muted-foreground">
              {isViewMode ? 'View and analyze your report' : 'Create custom reports with relational data'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {isViewMode && (
            <Button 
              onClick={() => navigate(`/insights/report-builder?id=${reportId}&mode=edit`)}
              variant="outline"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Report
            </Button>
          )}
          <Button 
            onClick={handleRunReport} 
            disabled={!canRunReport || executeReport.isPending}
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            {executeReport.isPending ? 'Running...' : 'Run Report'}
          </Button>
          {!isViewMode && (
            <Button 
              onClick={handleSaveReport} 
              disabled={!canSaveReport || createReport.isPending || updateReport.isPending}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {createReport.isPending || updateReport.isPending ? 'Saving...' : 'Save Report'}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Configuration */}
        {!isViewMode && (
          <div className="space-y-6">
            <RelationalFieldSelector
              dataSources={dataSources || []}
              selectedDataSource={selectedDataSource}
              selectedFields={selectedFields}
              onDataSourceChange={setSelectedDataSource}
              onFieldsChange={setSelectedFields}
            />
            
            <FilterBuilder
              dataSource={selectedDataSource}
              filters={filters}
              onFiltersChange={setFilters}
            />
            
            <ChartSelector
              chartConfig={chartConfig}
              onChartConfigChange={setChartConfig}
              availableFields={selectedFields}
              dataSource={selectedDataSource}
            />
          </div>
        )}

        {/* Middle Panel - Report Details */}
        {!isViewMode && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Report Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Report Name</label>
                  <Input
                    placeholder="Enter report name"
                    value={reportName}
                    onChange={(e) => setReportName(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    placeholder="Enter report description"
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <Separator />

                <div>
                  <h4 className="text-sm font-medium mb-2">Configuration Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Data Source:</strong> {selectedDataSource?.name || 'None selected'}
                    </div>
                    <div>
                      <strong>Fields:</strong> {selectedFields.length} selected
                    </div>
                    <div>
                      <strong>Filters:</strong> {filters.length} applied
                    </div>
                    <div>
                      <strong>Chart Type:</strong> {chartConfig.type}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Right Panel - Preview */}
        <div className={isViewMode ? 'lg:col-span-3' : ''}>
          <ReportPreview
            data={previewData}
            chartConfig={chartConfig}
            isLoading={executeReport.isPending}
          />
        </div>
      </div>
    </div>
  );
};
