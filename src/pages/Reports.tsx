
import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useReports } from "@/hooks/useReports";
import { useDashboard } from "@/hooks/useDashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartType, Report, AggregationType } from "@/types/reports";
import ReportChart from "@/components/reports/ReportChart";
import { CheckSquare, PlusCircle, Table2, BarChart3, PieChart, LineChart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Reports = () => {
  const { reports, tables, createReport, executeReport } = useReports();
  const { dashboards, addWidget } = useDashboard();
  const { toast } = useToast();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [reportResults, setReportResults] = useState<any[] | null>(null);
  const [addToDashboardOpen, setAddToDashboardOpen] = useState(false);
  const [selectedDashboardId, setSelectedDashboardId] = useState<string>("");
  
  // New report form state
  const [reportName, setReportName] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [selectedModule, setSelectedModule] = useState("");
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [availableFields, setAvailableFields] = useState<string[]>([]);
  const [chartType, setChartType] = useState<ChartType>("table");
  const [groupByField, setGroupByField] = useState<string>("");
  const [aggregation, setAggregation] = useState<AggregationType | "">("");

  const handleModuleChange = (module: string) => {
    setSelectedModule(module);
    const moduleFields = tables?.find(t => t.name === module)?.fields || [];
    setAvailableFields(moduleFields);
    setSelectedFields([]);
    setGroupByField("");
    setAggregation("");
  };

  const handleFieldSelection = (field: string) => {
    setSelectedFields(current => {
      if (current.includes(field)) {
        return current.filter(f => f !== field);
      } else {
        return [...current, field];
      }
    });
  };

  const handleCreateReport = async () => {
    if (!reportName || !selectedModule || selectedFields.length === 0) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) {
      toast({
        title: "Authentication error",
        description: "You must be logged in to create reports",
        variant: "destructive"
      });
      return;
    }

    createReport.mutate({
      name: reportName,
      description: reportDescription,
      created_by: userId,
      module: selectedModule,
      selected_fields: selectedFields,
      filters: [],
      group_by: groupByField || null,
      aggregation: aggregation as AggregationType || null,
      chart_type: chartType,
      is_public: false,
    }, {
      onSuccess: () => {
        setCreateDialogOpen(false);
        resetForm();
      }
    });
  };

  const resetForm = () => {
    setReportName("");
    setReportDescription("");
    setSelectedModule("");
    setSelectedFields([]);
    setAvailableFields([]);
    setChartType("table");
    setGroupByField("");
    setAggregation("");
  };

  const handleRunReport = async (report: Report) => {
    try {
      setSelectedReport(report);
      const data = await executeReport(report);
      setReportResults(data);
    } catch (error) {
      console.error("Error running report:", error);
      toast({
        title: "Error running report",
        description: "Failed to execute the report. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleAddToDashboard = () => {
    if (!selectedReport || !selectedDashboardId) return;
    
    addWidget.mutate({
      dashboard_id: selectedDashboardId,
      report_id: selectedReport.id,
      position: { x: 0, y: 0, w: 6, h: 4 },
      refresh_rate: null,
      chart_type: null
    }, {
      onSuccess: () => {
        setAddToDashboardOpen(false);
        setSelectedDashboardId("");
        toast({
          title: "Widget added",
          description: `Report "${selectedReport.name}" added to dashboard successfully.`,
        });
      }
    });
  };

  return (
    <>
      <Helmet>
        <title>Reports | Case Management</title>
      </Helmet>

      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
            <p className="text-muted-foreground">
              Create and manage custom reports
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Report
          </Button>
        </div>

        {/* Reports List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {reports?.map((report) => (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle>{report.name}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {report.description || "No description provided"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-1">
                  <span className="font-medium">Module:</span> {report.module}
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Fields:</span> {report.selected_fields.slice(0, 3).join(", ")}
                  {report.selected_fields.length > 3 && "..."}
                </p>
              </CardContent>
              <CardFooter className="flex justify-between pt-0">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleRunReport(report)}
                >
                  Run Report
                </Button>
                {dashboards && dashboards.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setSelectedReport(report);
                      setAddToDashboardOpen(true);
                    }}
                  >
                    Add to Dashboard
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
          {(!reports || reports.length === 0) && (
            <Card className="col-span-full p-6">
              <div className="flex flex-col items-center justify-center text-center">
                <h3 className="text-lg font-medium">No reports found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Create a new report to get started with data analysis
                </p>
                <Button 
                  className="mt-4" 
                  variant="outline"
                  onClick={() => setCreateDialogOpen(true)}
                >
                  Create Your First Report
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Report Results */}
        {selectedReport && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Report Results: {selectedReport.name}</CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setChartType("table")}
                  className={`flex items-center gap-1 ${chartType === "table" ? "bg-muted" : ""}`}
                >
                  <Table2 className="h-4 w-4" /> Table
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setChartType("bar")}
                  className={`flex items-center gap-1 ${chartType === "bar" ? "bg-muted" : ""}`}
                >
                  <BarChart3 className="h-4 w-4" /> Bar
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setChartType("line")}
                  className={`flex items-center gap-1 ${chartType === "line" ? "bg-muted" : ""}`}
                >
                  <LineChart className="h-4 w-4" /> Line
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setChartType("pie")}
                  className={`flex items-center gap-1 ${chartType === "pie" ? "bg-muted" : ""}`}
                >
                  <PieChart className="h-4 w-4" /> Pie
                </Button>
              </div>
            </CardHeader>
            <CardContent className="h-80">
              {reportResults ? (
                <ReportChart 
                  type={chartType} 
                  data={reportResults} 
                  fields={selectedReport.selected_fields}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-muted-foreground">Loading report data...</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Report Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Report</DialogTitle>
            <DialogDescription>
              Define your report to analyze and visualize data
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Tabs defaultValue="basic">
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="basic">Basics</TabsTrigger>
                <TabsTrigger value="fields">Fields</TabsTrigger>
                <TabsTrigger value="visualization">Visualization</TabsTrigger>
              </TabsList>
              <TabsContent value="basic" className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="report-name">Report Name *</Label>
                  <Input
                    id="report-name"
                    placeholder="Enter report name"
                    value={reportName}
                    onChange={(e) => setReportName(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="report-description">Description (Optional)</Label>
                  <Textarea
                    id="report-description"
                    placeholder="Enter description"
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    className="resize-none"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="module-select">Select Module *</Label>
                  <Select
                    value={selectedModule}
                    onValueChange={handleModuleChange}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a module" />
                    </SelectTrigger>
                    <SelectContent>
                      {tables?.map((table) => (
                        <SelectItem key={table.name} value={table.name}>
                          {table.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
              <TabsContent value="fields" className="space-y-4">
                <div className="grid gap-2">
                  <Label>Select Fields *</Label>
                  <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
                    {availableFields.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Please select a module first to view available fields
                      </p>
                    ) : (
                      availableFields.map((field) => (
                        <div key={field} className="flex items-center space-x-2 mb-2">
                          <Button
                            type="button"
                            variant={selectedFields.includes(field) ? "default" : "outline"}
                            size="sm"
                            className="w-full justify-start"
                            onClick={() => handleFieldSelection(field)}
                          >
                            {selectedFields.includes(field) && <CheckSquare className="mr-2 h-4 w-4" />}
                            {field}
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                  {selectedFields.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Selected: {selectedFields.length} fields
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="group-by">Group By (Optional)</Label>
                  <Select
                    value={groupByField}
                    onValueChange={setGroupByField}
                    disabled={!selectedFields.length}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a field to group by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {selectedFields.map((field) => (
                        <SelectItem key={field} value={field}>
                          {field}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="aggregation">Aggregation (Optional)</Label>
                  <Select
                    value={aggregation}
                    onValueChange={(value) => setAggregation(value as AggregationType)}
                    disabled={!groupByField}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select aggregation method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      <SelectItem value="count">Count</SelectItem>
                      <SelectItem value="sum">Sum</SelectItem>
                      <SelectItem value="avg">Average</SelectItem>
                      <SelectItem value="min">Minimum</SelectItem>
                      <SelectItem value="max">Maximum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
              <TabsContent value="visualization" className="space-y-4">
                <div className="grid gap-2">
                  <Label>Chart Type</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={chartType === "table" ? "default" : "outline"}
                      className="flex justify-center items-center gap-2"
                      onClick={() => setChartType("table")}
                    >
                      <Table2 className="h-4 w-4" /> Table
                    </Button>
                    <Button
                      type="button"
                      variant={chartType === "bar" ? "default" : "outline"}
                      className="flex justify-center items-center gap-2"
                      onClick={() => setChartType("bar")}
                    >
                      <BarChart3 className="h-4 w-4" /> Bar Chart
                    </Button>
                    <Button
                      type="button"
                      variant={chartType === "line" ? "default" : "outline"}
                      className="flex justify-center items-center gap-2"
                      onClick={() => setChartType("line")}
                    >
                      <LineChart className="h-4 w-4" /> Line Chart
                    </Button>
                    <Button
                      type="button"
                      variant={chartType === "pie" ? "default" : "outline"}
                      className="flex justify-center items-center gap-2"
                      onClick={() => setChartType("pie")}
                    >
                      <PieChart className="h-4 w-4" /> Pie Chart
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateReport}>Create Report</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add to Dashboard Dialog */}
      <Dialog open={addToDashboardOpen} onOpenChange={setAddToDashboardOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Dashboard</DialogTitle>
            <DialogDescription>
              Select a dashboard to add this report as a widget
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="dashboard-select">Select Dashboard</Label>
              <Select
                value={selectedDashboardId}
                onValueChange={setSelectedDashboardId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a dashboard" />
                </SelectTrigger>
                <SelectContent>
                  {dashboards?.map((dashboard) => (
                    <SelectItem key={dashboard.id} value={dashboard.id}>
                      {dashboard.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddToDashboardOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddToDashboard}>Add to Dashboard</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Reports;
