
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Loader2, Play, Save } from 'lucide-react';

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
  const [isLoading, setIsLoading] = useState(false);
  
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
    
    if (Array.isArray(selectedReport.fields)) {
      setSelectedFields(selectedReport.fields);
    } else if (Array.isArray(selectedReport.selected_fields)) {
      setSelectedFields(selectedReport.selected_fields as string[]);
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
  };
  
  const handleFieldToggle = (field: string) => {
    if (selectedFields.includes(field)) {
      setSelectedFields(selectedFields.filter(f => f !== field));
    } else {
      setSelectedFields([...selectedFields, field]);
    }
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
        filters: selectedReport?.filters || [],
        is_public: selectedReport?.is_public || false,
        chart_type: 'table'
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
      console.log('Report results:', result);
      
      toast({
        title: 'Report executed',
        description: `Found ${result.rows.length} results`
      });
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
            </CardContent>
          </Card>
          
          {/* Field Selector Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Select Fields</CardTitle>
              <CardDescription>
                Choose which fields to include in your report
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!baseTable ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <p className="mb-4">No fields to display.</p>
                  <p>Please select a base table first.</p>
                </div>
              ) : availableFields.length === 0 ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            </CardContent>
            <CardFooter>
              <div className="flex justify-between items-center w-full">
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
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  );
};

export default ReportBuilder;
