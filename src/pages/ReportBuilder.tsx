
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save } from 'lucide-react';
import { useSimpleReports } from '@/hooks/useSimpleReports';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

const ReportBuilder = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const reportId = searchParams.get('id');
  const isEditMode = searchParams.get('edit') === 'true';
  
  const { reports, tables, isLoadingTables, createReport, updateReport } = useSimpleReports();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    base_table: '',
    selected_fields: [] as string[],
    chart_type: 'table',
    is_public: false
  });

  const [availableFields, setAvailableFields] = useState<string[]>([]);

  // Load existing report if in edit mode
  useEffect(() => {
    if (reportId && reports && Array.isArray(reports) && reports.length > 0) {
      const report = reports.find(r => r.id === reportId);
      if (report) {
        setFormData({
          name: report.name,
          description: report.description || '',
          base_table: report.base_table,
          selected_fields: Array.isArray(report.selected_fields) ? report.selected_fields : [],
          chart_type: report.chart_type || 'table',
          is_public: report.is_public
        });
      }
    }
  }, [reportId, reports]);

  // Update available fields when base table changes
  useEffect(() => {
    if (formData.base_table && tables && Array.isArray(tables)) {
      const tableInfo = tables.find(table => table.name === formData.base_table);
      if (tableInfo && Array.isArray(tableInfo.fields)) {
        setAvailableFields(tableInfo.fields);
      }
    }
  }, [formData.base_table, tables]);

  const handleFieldToggle = (field: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        selected_fields: [...prev.selected_fields, field]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        selected_fields: prev.selected_fields.filter(f => f !== field)
      }));
    }
  };

  const handleSaveReport = async () => {
    if (!formData.name || !formData.base_table || formData.selected_fields.length === 0) {
      toast({
        variant: "destructive",
        title: "Missing required fields",
        description: "Please provide a name, select a table, and choose at least one field"
      });
      return;
    }
    
    try {
      const reportData = {
        name: formData.name,
        description: formData.description,
        module: formData.base_table,
        base_table: formData.base_table,
        selected_fields: formData.selected_fields,
        filters: [],
        chart_type: formData.chart_type,
        is_public: formData.is_public,
        created_by: '' // This will be set by the hook
      };

      if (reportId && isEditMode) {
        await updateReport.mutateAsync({
          id: reportId,
          ...reportData
        });
        toast({
          title: "Report updated successfully"
        });
      } else {
        await createReport.mutateAsync(reportData);
        toast({
          title: "Report created successfully"
        });
      }
      
      navigate('/reports');
    } catch (error) {
      console.error('Error saving report:', error);
      toast({
        variant: "destructive",
        title: "Error saving report",
        description: "Failed to save report. Please try again."
      });
    }
  };

  if (isLoadingTables) {
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
        <title>{reportId ? 'Edit Report' : 'Create Report'} | Case Management</title>
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
          
          <div className="flex-1">
            <h1 className="text-2xl font-bold">
              {reportId ? 'Edit Report' : 'Create New Report'}
            </h1>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Report Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Report Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter report name"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter report description"
                />
              </div>
            </div>

            {/* Table Selection */}
            <div>
              <Label>Data Source *</Label>
              <Select 
                value={formData.base_table} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, base_table: value, selected_fields: [] }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a table" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(tables) && tables.map((table) => (
                    <SelectItem key={table.name} value={table.name}>
                      {table.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Field Selection */}
            {availableFields.length > 0 && (
              <div>
                <Label>Fields to Include *</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 max-h-60 overflow-y-auto border rounded p-4">
                  {availableFields.map((field) => (
                    <div key={field} className="flex items-center space-x-2">
                      <Checkbox
                        id={field}
                        checked={formData.selected_fields.includes(field)}
                        onCheckedChange={(checked) => handleFieldToggle(field, checked as boolean)}
                      />
                      <Label htmlFor={field} className="text-sm">
                        {field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Chart Type */}
            <div>
              <Label>Chart Type</Label>
              <Select 
                value={formData.chart_type} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, chart_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="table">Table</SelectItem>
                  <SelectItem value="bar">Bar Chart</SelectItem>
                  <SelectItem value="line">Line Chart</SelectItem>
                  <SelectItem value="pie">Pie Chart</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Public/Private */}
            <div className="flex items-center space-x-2">
              <Switch
                id="is_public"
                checked={formData.is_public}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_public: checked }))}
              />
              <Label htmlFor="is_public">Make this report public</Label>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button 
                onClick={handleSaveReport}
                disabled={!formData.name || !formData.base_table || formData.selected_fields.length === 0}
              >
                <Save className="h-4 w-4 mr-2" />
                {reportId && isEditMode ? 'Update Report' : 'Save Report'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ReportBuilder;
