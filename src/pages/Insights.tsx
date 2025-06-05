
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, BarChart3, TrendingUp, Users, FileText, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

interface DataSource {
  id: string;
  name: string;
  table_name: string;
  description: string;
  fields: any[];
  relationships: any[];
}

interface InsightData {
  name: string;
  value: number;
  label?: string;
}

const Insights = () => {
  const { toast } = useToast();
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [selectedDataSource, setSelectedDataSource] = useState<string>('');
  const [insightData, setInsightData] = useState<InsightData[]>([]);
  const [loading, setLoading] = useState(false);
  const [quickStats, setQuickStats] = useState({
    totalCases: 0,
    openCases: 0,
    resolvedToday: 0,
    avgResolutionTime: 0
  });

  useEffect(() => {
    fetchDataSources();
    fetchQuickStats();
  }, []);

  const fetchDataSources = async () => {
    try {
      const { data, error } = await supabase
        .from('data_sources')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      setDataSources(data || []);
      
      // Default to Cases data source
      const casesSource = data?.find(ds => ds.name === 'Cases');
      if (casesSource) {
        setSelectedDataSource(casesSource.id);
        fetchInsightData(casesSource.name);
      }
    } catch (error) {
      console.error('Error fetching data sources:', error);
      toast({
        title: "Error",
        description: "Failed to load data sources",
        variant: "destructive"
      });
    }
  };

  const fetchQuickStats = async () => {
    try {
      // Total cases
      const { count: totalCount } = await supabase
        .from('cases')
        .select('*', { count: 'exact', head: true });

      // Open cases
      const { count: openCount } = await supabase
        .from('cases')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open');

      // Cases resolved today
      const today = new Date().toISOString().split('T')[0];
      const { count: resolvedToday } = await supabase
        .from('cases')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'closed')
        .gte('updated_at', today);

      setQuickStats({
        totalCases: totalCount || 0,
        openCases: openCount || 0,
        resolvedToday: resolvedToday || 0,
        avgResolutionTime: 2.5 // Placeholder - would need more complex query
      });
    } catch (error) {
      console.error('Error fetching quick stats:', error);
    }
  };

  const fetchInsightData = async (dataSourceName: string) => {
    setLoading(true);
    try {
      // Get case status distribution
      const { data: statusData, error } = await supabase
        .from('cases')
        .select('status')
        .order('status');

      if (error) throw error;

      // Count cases by status
      const statusCounts = statusData?.reduce((acc: Record<string, number>, case_) => {
        acc[case_.status] = (acc[case_.status] || 0) + 1;
        return acc;
      }, {}) || {};

      const chartData = Object.entries(statusCounts).map(([status, count]) => ({
        name: status.replace('_', ' ').toUpperCase(),
        value: count,
        label: `${status}: ${count}`
      }));

      setInsightData(chartData);
    } catch (error) {
      console.error('Error fetching insight data:', error);
      toast({
        title: "Error",
        description: "Failed to load insight data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDataSourceChange = (dataSourceId: string) => {
    setSelectedDataSource(dataSourceId);
    const dataSource = dataSources.find(ds => ds.id === dataSourceId);
    if (dataSource) {
      fetchInsightData(dataSource.name);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <BarChart3 className="h-8 w-8 mr-3" />
            Insights & Analytics
          </h1>
          <p className="text-muted-foreground">
            Data-driven insights to improve case management
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cases</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quickStats.totalCases}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Cases</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quickStats.openCases}</div>
            <p className="text-xs text-muted-foreground">Awaiting resolution</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved Today</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quickStats.resolvedToday}</div>
            <p className="text-xs text-muted-foreground">Cases closed today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Resolution</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quickStats.avgResolutionTime}d</div>
            <p className="text-xs text-muted-foreground">Average days</p>
          </CardContent>
        </Card>
      </div>

      {/* Data Source Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Data Analysis</CardTitle>
          <div className="flex items-center gap-4">
            <Select value={selectedDataSource} onValueChange={handleDataSourceChange}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select data source" />
              </SelectTrigger>
              <SelectContent>
                {dataSources.map((ds) => (
                  <SelectItem key={ds.id} value={ds.id}>
                    {ds.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge variant="outline">
              {dataSources.find(ds => ds.id === selectedDataSource)?.description}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading insights...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bar Chart */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Case Status Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={insightData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Pie Chart */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Case Status Breakdown</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={insightData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {insightData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Key Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold">Most Common Status</h4>
              <p className="text-sm text-muted-foreground">
                {insightData.length > 0 
                  ? `${insightData.reduce((max, item) => item.value > max.value ? item : max, insightData[0])?.name || 'N/A'}`
                  : 'No data available'
                }
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold">Total Records</h4>
              <p className="text-sm text-muted-foreground">
                {insightData.reduce((sum, item) => sum + item.value, 0)} cases analyzed
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Insights;
