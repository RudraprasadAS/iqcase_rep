import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useDashboard } from "@/hooks/useDashboard";
import { useReports } from "@/hooks/useReports";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DashboardGrid } from "@/components/dashboard/DashboardGrid";
import { LayoutPanelTop, PlusCircle } from "lucide-react";
import { Report } from "@/types/reports";

const Dashboard = () => {
  const { 
    dashboards, 
    createDashboard, 
    currentDashboardId, 
    selectDashboard,
    addWidget
  } = useDashboard();
  const { reports } = useReports();
  
  const [newDashboardOpen, setNewDashboardOpen] = useState(false);
  const [addWidgetOpen, setAddWidgetOpen] = useState(false);
  const [dashboardName, setDashboardName] = useState("");
  const [dashboardDescription, setDashboardDescription] = useState("");
  const [selectedReportId, setSelectedReportId] = useState<string>("");

  const handleCreateDashboard = () => {
    if (!dashboardName) return;
    
    createDashboard.mutate({
      name: dashboardName,
      description: dashboardDescription,
      layout_config: {}
    }, {
      onSuccess: () => {
        setNewDashboardOpen(false);
        setDashboardName("");
        setDashboardDescription("");
      }
    });
  };

  const handleAddWidget = () => {
    if (!selectedReportId || !currentDashboardId) return;
    
    addWidget.mutate({
      dashboard_id: currentDashboardId,
      report_id: selectedReportId,
      position: { x: 0, y: 0, w: 6, h: 4 },
      refresh_rate: null,
      chart_type: null
    }, {
      onSuccess: () => {
        setAddWidgetOpen(false);
        setSelectedReportId("");
      }
    });
  };

  return (
    <>
      <Helmet>
        <title>Dashboard | Case Management</title>
      </Helmet>

      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              View and manage your data visualizations
            </p>
          </div>
          <div className="flex items-center gap-2">
            {currentDashboardId && (
              <Button 
                variant="outline" 
                onClick={() => setAddWidgetOpen(true)}
                className="flex items-center gap-1"
              >
                <PlusCircle className="h-4 w-4" />
                Add Widget
              </Button>
            )}
            <Button 
              onClick={() => setNewDashboardOpen(true)}
              className="flex items-center gap-1"
            >
              <LayoutPanelTop className="h-4 w-4" />
              New Dashboard
            </Button>
          </div>
        </div>

        {/* Dashboard Selector */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select Dashboard</CardTitle>
            <CardDescription>
              Choose a dashboard to view or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 flex-wrap">
              {dashboards?.map((dashboard) => (
                <Button
                  key={dashboard.id}
                  variant={currentDashboardId === dashboard.id ? "default" : "outline"}
                  onClick={() => selectDashboard(dashboard.id)}
                  className="min-w-32 justify-start"
                >
                  {dashboard.name}
                </Button>
              ))}
              {(!dashboards || dashboards.length === 0) && (
                <p className="text-muted-foreground">No dashboards found. Create one to get started.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dashboard Grid */}
        <DashboardGrid dashboardId={currentDashboardId} />
      </div>

      {/* Create Dashboard Dialog */}
      <Dialog open={newDashboardOpen} onOpenChange={setNewDashboardOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Dashboard</DialogTitle>
            <DialogDescription>
              Create a new dashboard to organize your reports and visualizations.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="dashboard-name">Name</Label>
              <Input
                id="dashboard-name"
                value={dashboardName}
                onChange={(e) => setDashboardName(e.target.value)}
                placeholder="My Dashboard"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dashboard-description">Description (Optional)</Label>
              <Input
                id="dashboard-description"
                value={dashboardDescription}
                onChange={(e) => setDashboardDescription(e.target.value)}
                placeholder="Dashboard description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewDashboardOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateDashboard}>Create Dashboard</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Widget Dialog */}
      <Dialog open={addWidgetOpen} onOpenChange={setAddWidgetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Widget to Dashboard</DialogTitle>
            <DialogDescription>
              Select a report to add as a widget to your dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="report-select">Select Report</Label>
              <Select
                value={selectedReportId}
                onValueChange={setSelectedReportId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a report" />
                </SelectTrigger>
                <SelectContent>
                  {reports?.map((report: Report) => (
                    <SelectItem key={report.id} value={report.id}>
                      {report.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddWidgetOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddWidget}>Add Widget</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Dashboard;
