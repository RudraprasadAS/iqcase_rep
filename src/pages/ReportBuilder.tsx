
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { ReportFilter, FilterOperator, Report, ReportData } from '@/types/reports';
import { Loader2, Play, Save, ArrowLeft, X, Plus, Download } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent 
} from '@/components/ui/chart';
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

interface ReportForm {
  name: string;
  description: string;
  base_table: string;
  fields: string[];
  is_public: boolean;
}

const FILTER_OPERATORS: { value: FilterOperator; label: string }[] = [
  { value: 'eq', label: 'Equals' },
  { value: 'neq', label: 'Not Equals' },
  { value: 'gt', label: 'Greater Than' },
  { value: 'gte', label: 'Greater Than or Equal' },
  { value: 'lt', label: 'Less Than' },
  { value: 'lte', label: 'Less Than or Equal' },
  { value: 'like', label: 'Contains' },
  { value: 'ilike', label: 'Contains (Case Insensitive)' },
  { value: 'is', label: 'Is (Null/Not Null)' }
];

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
      
      const reportData = data as Report;
      setReport(reportData);
      
      // Set form values
      form.reset({
        name: reportData.name,
        description: reportData.description || '',
        base_table: reportData.base_table,
        fields: Array.isArray(reportData.selected_fields) 
          ? reportData.selected_fields as string[] 
          : [],
        is_public: reportData.is_public || false
      });
      
      setSelectedFields(Array.isArray(reportData.selected_fields) 
        ? reportData.selected_fields as string[] 
        : []);
      
      // Handle filters if present
      if (reportData.filters && Array.isArray(reportData.filters)) {
        setFilters(reportData.filters.map((filter: any) => ({
          field: filter.field,
          operator: filter.operator,
          value: filter.value
        })));
      }
      
      // Set visualization type if present
      if (reportData.visualization && reportData.visualization.type) {
        setVisualizationType(reportData.visualization.type as any);
      }
      
      // Load available fields for the base table
      if (reportData.base_table) {
        loadAvailableFields(reportData.base_table);
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
      base_table: formValues.base_table,
      fields: selectedFields,
      filters,
      is_public: formValues.is_public,
      visualization: {
        type: visualizationType
      }
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
              <Form {...form}>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Report Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="base_table"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Base Table</FormLabel>
                        <Select
                          disabled={!!id}
                          value={field.value}
                          onValueChange={handleBaseTableChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a table" />
                            </SelectTrigger>
                          </FormControl>
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
                      </FormItem>
                    )}
                  />
                </div>
              </Form>
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
                    <div className="grid gap-2">
                      <h3 className="text-sm font-medium">Available Fields</h3>
                      <div className="border rounded-md p-2 max-h-60 overflow-y-auto">
                        {availableFields.length === 0 ? (
                          <div className="text-center py-4 text-sm text-muted-foreground">
                            No fields available
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-2">
                            {availableFields.map((field) => (
                              <Button
                                key={field}
                                variant={selectedFields.includes(field) ? "default" : "outline"}
                                size="sm"
                                className="justify-start overflow-hidden text-ellipsis"
                                onClick={() => handleFieldToggle(field)}
                              >
                                {field}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid gap-2">
                      <h3 className="text-sm font-medium">Selected Fields</h3>
                      <div className="border rounded-md p-2 min-h-20">
                        {selectedFields.length === 0 ? (
                          <div className="text-center py-4 text-sm text-muted-foreground">
                            No fields selected
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {selectedFields.map((field) => (
                              <div
                                key={field}
                                className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm flex items-center"
                              >
                                {field}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-4 w-4 p-0 ml-2 hover:bg-transparent"
                                  onClick={() => handleFieldToggle(field)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid gap-2">
                      <h3 className="text-sm font-medium">Visualization Type</h3>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant={visualizationType === 'table' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setVisualizationType('table')}
                        >
                          Table
                        </Button>
                        <Button
                          variant={visualizationType === 'bar' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setVisualizationType('bar')}
                        >
                          Bar Chart
                        </Button>
                        <Button
                          variant={visualizationType === 'line' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setVisualizationType('line')}
                        >
                          Line Chart
                        </Button>
                        <Button
                          variant={visualizationType === 'pie' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setVisualizationType('pie')}
                        >
                          Pie Chart
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="filters">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-medium">Applied Filters</h3>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={addFilter}
                        disabled={selectedFields.length === 0}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Filter
                      </Button>
                    </div>
                    
                    {filters.length === 0 ? (
                      <div className="text-center py-8 text-sm text-muted-foreground border rounded-md">
                        No filters applied
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filters.map((filter, index) => (
                          <div 
                            key={index}
                            className="grid grid-cols-12 gap-2 items-center p-2 border rounded-md"
                          >
                            <div className="col-span-4">
                              <Select
                                value={filter.field}
                                onValueChange={(value) => updateFilter(index, 'field', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Field" />
                                </SelectTrigger>
                                <SelectContent>
                                  {selectedFields.map((field) => (
                                    <SelectItem key={field} value={field}>
                                      {field}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="col-span-3">
                              <Select
                                value={filter.operator}
                                onValueChange={(value) => updateFilter(index, 'operator', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Operator" />
                                </SelectTrigger>
                                <SelectContent>
                                  {FILTER_OPERATORS.map((op) => (
                                    <SelectItem key={op.value} value={op.value}>
                                      {op.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="col-span-4">
                              <Input
                                value={filter.value as string}
                                onChange={(e) => updateFilter(index, 'value', e.target.value)}
                                placeholder="Value"
                              />
                            </div>
                            
                            <div className="col-span-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeFilter(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="results">
                  {!reportData ? (
                    <div className="text-center py-16 border rounded-md">
                      <p className="text-muted-foreground">
                        Run the report to see results
                      </p>
                      <Button
                        variant="outline"
                        className="mt-4"
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
                    </div>
                  ) : reportData.rows.length === 0 ? (
                    <div className="text-center py-16 border rounded-md">
                      <p className="text-muted-foreground">No results found</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Showing {reportData.rows.length} of {reportData.total} results
                          </p>
                        </div>
                        <div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-2" />
                                Export
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={exportToCsv}>
                                CSV
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      
                      {visualizationType === 'table' && (
                        <div className="border rounded-md overflow-auto max-h-96">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                {reportData.columns.map((column) => (
                                  <TableHead key={column}>
                                    {column}
                                  </TableHead>
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {reportData.rows.map((row, rowIndex) => (
                                <TableRow key={rowIndex}>
                                  {reportData.columns.map((column) => (
                                    <TableCell key={`${rowIndex}-${column}`}>
                                      {row[column]?.toString() || ''}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                      
                      {visualizationType === 'bar' && (
                        <div className="h-96 border rounded-md p-4">
                          <ChartContainer 
                            className="w-full"
                            config={{ 
                              data: "var(--chart-data)", 
                              grid: "var(--chart-grid)"
                            }}
                          >
                            <BarChart
                              data={reportData.rows}
                              margin={{
                                top: 20,
                                right: 30,
                                left: 20,
                                bottom: 60,
                              }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis 
                                dataKey={reportData.columns[0]}
                                angle={-45}
                                textAnchor="end"
                                height={70}
                              />
                              <YAxis />
                              <ChartTooltip
                                content={<ChartTooltipContent />}
                              />
                              {reportData.columns.slice(1).map((column, i) => (
                                <Bar
                                  key={column}
                                  dataKey={column}
                                  fill={`hsl(${i * 40}, 70%, 50%)`}
                                />
                              ))}
                              <ChartLegend content={<ChartLegendContent />} />
                            </BarChart>
                          </ChartContainer>
                        </div>
                      )}
                      
                      {visualizationType === 'line' && (
                        <div className="h-96 border rounded-md p-4">
                          <ChartContainer 
                            className="w-full"
                            config={{ 
                              data: "var(--chart-data)", 
                              grid: "var(--chart-grid)"
                            }}
                          >
                            <LineChart
                              data={reportData.rows}
                              margin={{
                                top: 20,
                                right: 30,
                                left: 20,
                                bottom: 60,
                              }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis 
                                dataKey={reportData.columns[0]}
                                angle={-45}
                                textAnchor="end"
                                height={70}
                              />
                              <YAxis />
                              <ChartTooltip
                                content={<ChartTooltipContent />}
                              />
                              {reportData.columns.slice(1).map((column, i) => (
                                <Line
                                  key={column}
                                  type="monotone"
                                  dataKey={column}
                                  stroke={`hsl(${i * 40}, 70%, 50%)`}
                                  activeDot={{ r: 8 }}
                                />
                              ))}
                              <ChartLegend content={<ChartLegendContent />} />
                            </LineChart>
                          </ChartContainer>
                        </div>
                      )}
                      
                      {visualizationType === 'pie' && (
                        <div className="h-96 border rounded-md p-4">
                          <ChartContainer 
                            className="w-full"
                            config={{ 
                              data: "var(--chart-data)", 
                              grid: "var(--chart-grid)"
                            }}
                          >
                            <PieChart>
                              <Pie
                                data={reportData.rows}
                                dataKey={reportData.columns[1]}
                                nameKey={reportData.columns[0]}
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                fill="#8884d8"
                                label
                              />
                              <ChartTooltip
                                content={<ChartTooltipContent />}
                              />
                              <ChartLegend content={<ChartLegendContent />} />
                            </PieChart>
                          </ChartContainer>
                        </div>
                      )}
                    </div>
                  )}
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
