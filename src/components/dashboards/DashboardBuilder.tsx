
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, X, BarChart3, PieChart, TrendingUp, Calculator } from 'lucide-react';
import { useReports } from '@/hooks/useReports';
import { useToast } from '@/hooks/use-toast';

interface DashboardItem {
  id: string;
  type: 'report' | 'metric' | 'chart';
  title: string;
  reportId?: string;
  metric?: {
    table: string;
    field: string;
    aggregation: 'count' | 'sum' | 'avg' | 'min' | 'max';
  };
  position: { x: number; y: number; width: number; height: number };
}

interface DashboardLayoutProps {
  onSave?: (dashboardName: string, items: DashboardItem[]) => void;
}

export const DashboardBuilder = ({ onSave }: DashboardLayoutProps) => {
  const { reports, tables, isLoadingReports, isLoadingTables } = useReports();
  const { toast } = useToast();
  const [dashboardItems, setDashboardItems] = useState<DashboardItem[]>([]);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [dashboardName, setDashboardName] = useState('');

  // Quick metric configuration
  const [selectedTable, setSelectedTable] = useState('');
  const [selectedField, setSelectedField] = useState('');
  const [selectedAggregation, setSelectedAggregation] = useState<'count' | 'sum' | 'avg' | 'min' | 'max'>('count');

  const addReport = (reportId: string) => {
    const report = reports?.find(r => r.id === reportId);
    if (!report) return;

    const newItem: DashboardItem = {
      id: `report-${Date.now()}`,
      type: 'report',
      title: report.name,
      reportId: reportId,
      position: { x: 0, y: dashboardItems.length * 300, width: 500, height: 300 }
    };

    setDashboardItems([...dashboardItems, newItem]);
    setShowAddMenu(false);
    toast({
      title: 'Report added',
      description: `${report.name} has been added to the dashboard`
    });
  };

  const addMetric = () => {
    if (!selectedTable || !selectedAggregation) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a table and aggregation type'
      });
      return;
    }

    const tableInfo = tables?.find(t => t.name === selectedTable);
    const fieldLabel = selectedField || 'records';
    const metricTitle = `${selectedAggregation.toUpperCase()} of ${fieldLabel} from ${tableInfo?.name || selectedTable}`;

    const newItem: DashboardItem = {
      id: `metric-${Date.now()}`,
      type: 'metric',
      title: metricTitle,
      metric: {
        table: selectedTable,
        field: selectedField || '*',
        aggregation: selectedAggregation
      },
      position: { x: 0, y: dashboardItems.length * 150, width: 300, height: 150 }
    };

    setDashboardItems([...dashboardItems, newItem]);
    setShowAddMenu(false);
    
    // Reset form
    setSelectedTable('');
    setSelectedField('');
    setSelectedAggregation('count');

    toast({
      title: 'Metric added',
      description: `${metricTitle} has been added to the dashboard`
    });
  };

  const removeItem = (itemId: string) => {
    setDashboardItems(dashboardItems.filter(item => item.id !== itemId));
    toast({
      title: 'Item removed',
      description: 'Dashboard item has been removed'
    });
  };

  const handleSave = () => {
    if (!dashboardName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter a dashboard name'
      });
      return;
    }

    if (dashboardItems.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please add at least one item to the dashboard'
      });
      return;
    }

    if (onSave) {
      onSave(dashboardName, dashboardItems);
    }

    toast({
      title: 'Dashboard saved',
      description: `Dashboard "${dashboardName}" has been saved successfully`
    });
  };

  const getAvailableFields = () => {
    if (!selectedTable || !tables) return [];
    const tableInfo = tables.find(t => t.name === selectedTable);
    return tableInfo?.fields || [];
  };

  const renderDashboardItem = (item: DashboardItem) => {
    return (
      <Card key={item.id} className="relative group">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeItem(item.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-20 bg-muted rounded">
            {item.type === 'report' && <BarChart3 className="h-8 w-8 text-muted-foreground" />}
            {item.type === 'metric' && <Calculator className="h-8 w-8 text-muted-foreground" />}
            {item.type === 'chart' && <PieChart className="h-8 w-8 text-muted-foreground" />}
          </div>
          <div className="mt-2 text-center">
            <Badge variant="outline" className="text-xs">
              {item.type.toUpperCase()}
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Dashboard Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Dashboard Name</label>
            <Input
              value={dashboardName}
              onChange={(e) => setDashboardName(e.target.value)}
              placeholder="Enter dashboard name..."
              className="mt-1"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={() => setShowAddMenu(!showAddMenu)}
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
            
            <Button
              onClick={handleSave}
              disabled={!dashboardName.trim() || dashboardItems.length === 0}
            >
              Save Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Add Item Menu */}
      {showAddMenu && (
        <Card>
          <CardHeader>
            <CardTitle>Add Dashboard Item</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Add Reports */}
            <div>
              <h4 className="font-medium mb-3">Add Existing Reports</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {isLoadingReports ? (
                  <p className="text-sm text-muted-foreground">Loading reports...</p>
                ) : reports && reports.length > 0 ? (
                  reports.map((report) => (
                    <Button
                      key={report.id}
                      variant="outline"
                      size="sm"
                      onClick={() => addReport(report.id)}
                      className="justify-start"
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      {report.name}
                    </Button>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No reports available</p>
                )}
              </div>
            </div>

            {/* Add Quick Metrics */}
            <div>
              <h4 className="font-medium mb-3">Add Quick Metrics</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Table</label>
                  <Select value={selectedTable} onValueChange={setSelectedTable}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select table" />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingTables ? (
                        <div className="p-2 text-sm">Loading...</div>
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
                
                <div>
                  <label className="text-sm font-medium">Field (Optional)</label>
                  <Select value={selectedField} onValueChange={setSelectedField}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select field" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Count all records</SelectItem>
                      {getAvailableFields().map((field) => (
                        <SelectItem key={field} value={field}>
                          {field}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Aggregation</label>
                  <Select value={selectedAggregation} onValueChange={(value: any) => setSelectedAggregation(value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="count">Count</SelectItem>
                      <SelectItem value="sum">Sum</SelectItem>
                      <SelectItem value="avg">Average</SelectItem>
                      <SelectItem value="min">Minimum</SelectItem>
                      <SelectItem value="max">Maximum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button
                onClick={addMetric}
                variant="outline"
                size="sm"
                className="mt-3"
                disabled={!selectedTable}
              >
                <Calculator className="h-4 w-4 mr-2" />
                Add Metric
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dashboard Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Dashboard Preview</CardTitle>
        </CardHeader>
        <CardContent>
          {dashboardItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No items added to dashboard yet.</p>
              <p className="text-sm">Add reports or metrics to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboardItems.map(renderDashboardItem)}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
