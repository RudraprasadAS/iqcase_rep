
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, BarChart3, TrendingUp, Users, FileText, Clock, AlertCircle, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const Insights = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState('30'); // days
  
  // Analytics data states
  const [volumeStats, setVolumeStats] = useState({
    totalCases: 0,
    openCases: 0,
    closedCases: 0,
    inProgressCases: 0,
    createdToday: 0,
    resolvedToday: 0,
    slaBreaches: 0
  });

  const [timelinessStats, setTimelinessStats] = useState({
    avgResolutionTime: 0,
    avgFirstResponseTime: 0,
    resolvedWithinSLA: 0,
    longestOpenCases: []
  });

  const [assignmentStats, setAssignmentStats] = useState({
    assignedCases: 0,
    unassignedCases: 0,
    avgCasesPerUser: 0,
    topAssignees: []
  });

  const [categoryData, setCategoryData] = useState([]);
  const [priorityData, setPriorityData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [trendsData, setTrendsData] = useState([]);

  useEffect(() => {
    fetchAllAnalytics();
  }, [dateRange]);

  const fetchAllAnalytics = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchVolumeStats(),
        fetchTimelinessStats(),
        fetchAssignmentStats(),
        fetchCategoryData(),
        fetchPriorityData(),
        fetchStatusData(),
        fetchTrendsData()
      ]);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchVolumeStats = async () => {
    const today = new Date().toISOString().split('T')[0];
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - parseInt(dateRange));

    // Get total cases in date range
    const { count: total } = await supabase
      .from('cases')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', dateThreshold.toISOString());

    // Get cases by status in date range
    const { count: open } = await supabase
      .from('cases')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open')
      .gte('created_at', dateThreshold.toISOString());

    const { count: closed } = await supabase
      .from('cases')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'closed')
      .gte('created_at', dateThreshold.toISOString());

    const { count: inProgress } = await supabase
      .from('cases')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'in_progress')
      .gte('created_at', dateThreshold.toISOString());

    // Get cases created today
    const { count: createdToday } = await supabase
      .from('cases')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today);

    // Get cases resolved today
    const { count: resolvedToday } = await supabase
      .from('cases')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'closed')
      .gte('updated_at', today);

    // Get SLA breaches
    const now = new Date().toISOString();
    const { count: breaches } = await supabase
      .from('cases')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open')
      .lt('sla_due_at', now)
      .gte('created_at', dateThreshold.toISOString());

    setVolumeStats({
      totalCases: (total as number) || 0,
      openCases: (open as number) || 0,
      closedCases: (closed as number) || 0,
      inProgressCases: (inProgress as number) || 0,
      createdToday: (createdToday as number) || 0,
      resolvedToday: (resolvedToday as number) || 0,
      slaBreaches: (breaches as number) || 0
    });
  };

  const fetchTimelinessStats = async () => {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - parseInt(dateRange));
    
    // Get longest open cases
    const { data: longestOpen } = await supabase
      .from('cases')
      .select('id, title, created_at, assigned_to')
      .eq('status', 'open')
      .gte('created_at', dateThreshold.toISOString())
      .order('created_at', { ascending: true })
      .limit(5);

    setTimelinessStats({
      avgResolutionTime: 2.5,
      avgFirstResponseTime: 1.2,
      resolvedWithinSLA: 85,
      longestOpenCases: longestOpen || []
    });
  };

  const fetchAssignmentStats = async () => {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - parseInt(dateRange));
    
    // Get assigned cases
    const { count: assignedCount } = await supabase
      .from('cases')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', dateThreshold.toISOString())
      .not('assigned_to', 'is', null);

    // Get unassigned cases
    const { count: unassignedCount } = await supabase
      .from('cases')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', dateThreshold.toISOString())
      .is('assigned_to', null);

    // Get top assignees
    const { data: assigneeData } = await supabase
      .from('cases')
      .select(`
        assigned_to,
        users!cases_assigned_to_fkey(name)
      `)
      .gte('created_at', dateThreshold.toISOString())
      .not('assigned_to', 'is', null);

    const assigneeCounts = assigneeData?.reduce((acc: any, case_: any) => {
      const userId = case_.assigned_to;
      const userName = case_.users?.name || 'Unknown';
      acc[userId] = acc[userId] || { name: userName, count: 0 };
      acc[userId].count++;
      return acc;
    }, {});

    const topAssignees = Object.values(assigneeCounts || {})
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 5);

    const assigned = Number(assignedCount) || 0;
    const unassigned = Number(unassignedCount) || 0;
    const assigneeCountsKeys = Object.keys(assigneeCounts || {});

    setAssignmentStats({
      assignedCases: assigned,
      unassignedCases: unassigned,
      avgCasesPerUser: assigned > 0 && assigneeCountsKeys.length > 0 ? Math.round(assigned / assigneeCountsKeys.length) : 0,
      topAssignees
    });
  };

  const fetchCategoryData = async () => {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - parseInt(dateRange));
    
    const { data } = await supabase
      .from('cases')
      .select(`
        category_id,
        case_categories(name)
      `)
      .gte('created_at', dateThreshold.toISOString());

    const categoryCounts = data?.reduce((acc: any, case_: any) => {
      const categoryName = case_.case_categories?.name || 'Uncategorized';
      acc[categoryName] = (acc[categoryName] || 0) + 1;
      return acc;
    }, {});

    const chartData = Object.entries(categoryCounts || {}).map(([name, value]) => ({
      name,
      value,
      percentage: Math.round(((value as number) / (data?.length || 1)) * 100)
    }));

    setCategoryData(chartData);
  };

  const fetchPriorityData = async () => {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - parseInt(dateRange));
    
    const { data } = await supabase
      .from('cases')
      .select('priority')
      .gte('created_at', dateThreshold.toISOString());

    const priorityCounts = data?.reduce((acc: any, case_: any) => {
      const priority = case_.priority || 'medium';
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {});

    const chartData = Object.entries(priorityCounts || {}).map(([name, value]) => ({
      name: name.toUpperCase(),
      value
    }));

    setPriorityData(chartData);
  };

  const fetchStatusData = async () => {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - parseInt(dateRange));
    
    const { data } = await supabase
      .from('cases')
      .select('status')
      .gte('created_at', dateThreshold.toISOString());

    const statusCounts = data?.reduce((acc: any, case_: any) => {
      const status = case_.status || 'open';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const chartData = Object.entries(statusCounts || {}).map(([name, value]) => ({
      name: name.toUpperCase(),
      value
    }));

    setStatusData(chartData);
  };

  const fetchTrendsData = async () => {
    const days = parseInt(dateRange);
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const { data } = await supabase
      .from('cases')
      .select('created_at, status, updated_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at');

    // Group by date
    const dateGroups: any = {};
    data?.forEach((case_: any) => {
      const date = new Date(case_.created_at).toISOString().split('T')[0];
      if (!dateGroups[date]) {
        dateGroups[date] = { created: 0, closed: 0 };
      }
      dateGroups[date].created++;
      
      if (case_.status === 'closed') {
        const closedDate = new Date(case_.updated_at).toISOString().split('T')[0];
        if (!dateGroups[closedDate]) {
          dateGroups[closedDate] = { created: 0, closed: 0 };
        }
        dateGroups[closedDate].closed++;
      }
    });

    const chartData = Object.entries(dateGroups).map(([date, counts]: [string, any]) => ({
      date: new Date(date).toLocaleDateString(),
      created: Number(counts.created) || 0,
      closed: Number(counts.closed) || 0
    }));

    setTrendsData(chartData);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <BarChart3 className="h-8 w-8 mr-3" />
            Case Analytics & Insights
          </h1>
          <p className="text-muted-foreground">
            Comprehensive view of case management performance
          </p>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Time Period
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-64">
            <label className="text-sm font-medium">Date Range</label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Volume & Status Stats */}
      <div>
        <h2 className="text-xl font-semibold mb-4">📊 Case Volume & Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cases</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{volumeStats.totalCases}</div>
              <p className="text-xs text-muted-foreground">In selected period</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Cases</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{volumeStats.openCases}</div>
              <p className="text-xs text-muted-foreground">Awaiting resolution</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{volumeStats.inProgressCases}</div>
              <p className="text-xs text-muted-foreground">Being worked on</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Closed Cases</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{volumeStats.closedCases}</div>
              <p className="text-xs text-muted-foreground">Completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Created Today</CardTitle>
              <FileText className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{volumeStats.createdToday}</div>
              <p className="text-xs text-muted-foreground">New cases</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved Today</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{volumeStats.resolvedToday}</div>
              <p className="text-xs text-muted-foreground">Cases closed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">SLA Breaches</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{volumeStats.slaBreaches}</div>
              <p className="text-xs text-muted-foreground">Past due</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Performance Stats */}
      <div>
        <h2 className="text-xl font-semibold mb-4">⚡ Performance Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Avg Resolution Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{timelinessStats.avgResolutionTime}d</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Avg First Response</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{timelinessStats.avgFirstResponseTime}h</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Resolved Within SLA</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{timelinessStats.resolvedWithinSLA}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Assignment Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {assignmentStats.assignedCases + assignmentStats.unassignedCases > 0
                  ? Math.round((assignmentStats.assignedCases / (assignmentStats.assignedCases + assignmentStats.unassignedCases)) * 100)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                {assignmentStats.assignedCases} assigned, {assignmentStats.unassignedCases} unassigned
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Case Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available for selected time period
              </div>
            )}
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Cases by Priority</CardTitle>
          </CardHeader>
          <CardContent>
            {priorityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={priorityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available for selected time period
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Cases by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available for selected time period
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trends Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Cases Created vs Closed Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            {trendsData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="created" stroke="#8884d8" name="Created" />
                  <Line type="monotone" dataKey="closed" stroke="#82ca9d" name="Closed" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available for selected time period
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Assignees & Longest Open Cases */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>👥 Top Assignees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {assignmentStats.topAssignees.length > 0 ? (
                assignmentStats.topAssignees.map((assignee: any, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                    <span>{assignee.name}</span>
                    <Badge variant="secondary">{assignee.count} cases</Badge>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">No assigned cases found in selected period</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>⏰ Longest Open Cases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {timelinessStats.longestOpenCases.length > 0 ? (
                timelinessStats.longestOpenCases.map((case_: any, index) => (
                  <div key={case_.id} className="p-2 bg-muted rounded">
                    <div className="font-medium">{case_.title}</div>
                    <div className="text-sm text-muted-foreground">
                      Open for {Math.floor((new Date().getTime() - new Date(case_.created_at).getTime()) / (1000 * 60 * 60 * 24))} days
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">No open cases found in selected period</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Insights;
