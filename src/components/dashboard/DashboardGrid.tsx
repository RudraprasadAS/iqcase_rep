
import { useState, useEffect } from "react";
import { useDashboard } from "@/hooks/useDashboard";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, Trash2, RefreshCw, Maximize } from "lucide-react";
import ReportChart from "@/components/reports/ReportChart";
import { useReports } from "@/hooks/useReports";
import { DashboardWidget } from "@/types/reports";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

interface DashboardGridProps {
  dashboardId?: string;
}

export const DashboardGrid = ({ dashboardId }: DashboardGridProps) => {
  const { currentDashboard, widgets, isLoading, deleteWidget } = useDashboard(dashboardId);
  const { executeReport } = useReports();
  const [widgetData, setWidgetData] = useState<Record<string, any[]>>({});
  const [refreshing, setRefreshing] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadWidgetData = async () => {
      if (!widgets || widgets.length === 0) return;
      
      for (const widget of widgets) {
        if (!widget.report) continue;
        
        try {
          setRefreshing(prev => ({ ...prev, [widget.id]: true }));
          const data = await executeReport(widget.report);
          setWidgetData(prev => ({ ...prev, [widget.id]: data }));
        } catch (error) {
          console.error(`Error loading data for widget ${widget.id}:`, error);
        } finally {
          setRefreshing(prev => ({ ...prev, [widget.id]: false }));
        }
      }
    };

    loadWidgetData();
  }, [widgets, executeReport]);

  const handleRefreshWidget = async (widget: DashboardWidget) => {
    if (!widget.report) return;
    
    try {
      setRefreshing(prev => ({ ...prev, [widget.id]: true }));
      const data = await executeReport(widget.report);
      setWidgetData(prev => ({ ...prev, [widget.id]: data }));
    } catch (error) {
      console.error(`Error refreshing data for widget ${widget.id}:`, error);
    } finally {
      setRefreshing(prev => ({ ...prev, [widget.id]: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="shadow-md">
            <CardHeader className="pb-2">
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!currentDashboard) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <h3 className="text-xl font-medium mb-2">No dashboard selected</h3>
        <p className="text-muted-foreground mb-4">
          Please select or create a dashboard to view widgets
        </p>
      </div>
    );
  }

  if (!widgets || widgets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <h3 className="text-xl font-medium mb-2">No widgets found</h3>
        <p className="text-muted-foreground mb-4">
          This dashboard doesn't have any widgets yet
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
      {widgets.map((widget) => (
        <Card key={widget.id} className="shadow-md overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base">{widget.report?.name || "Unnamed Widget"}</CardTitle>
              <div className="flex space-x-1">
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8"
                  onClick={() => handleRefreshWidget(widget)}
                  disabled={refreshing[widget.id]}
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing[widget.id] ? 'animate-spin' : ''}`} />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8" 
                  onClick={() => deleteWidget.mutate(widget.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {refreshing[widget.id] && !widgetData[widget.id] ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <div className="h-40">
                <ReportChart 
                  type={widget.chart_type || widget.report?.chart_type || "table"}
                  data={widgetData[widget.id] || []}
                  fields={widget.report?.selected_fields || []}
                />
              </div>
            )}
          </CardContent>
          <CardFooter className="pt-0 text-xs text-muted-foreground">
            Last updated: {new Date().toLocaleTimeString()}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};
