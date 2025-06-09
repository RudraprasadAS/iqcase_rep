
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Clock, CheckCircle, FileText, Search, Users, Settings, TrendingUp, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import CalendarView from '@/components/dashboard/CalendarView';

interface DashboardStats {
  totalCases: number;
  openCases: number;
  inProgressCases: number;
  resolvedCases: number;
  overdueCases: number;
}

interface ChartData {
  name: string;
  value: number;
  color?: string;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalCases: 0,
    openCases: 0,
    inProgressCases: 0,
    resolvedCases: 0,
    overdueCases: 0
  });
  const [priorityData, setPriorityData] = useState<ChartData[]>([]);
  const [monthlyData, setMonthlyData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardStats();
    fetchChartData();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Fetch total cases
      const { count: totalCases } = await supabase
        .from('cases')
        .select('*', { count: 'exact', head: true });

      // Fetch cases by status
      const { count: openCases } = await supabase
        .from('cases')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open');

      const { count: inProgressCases } = await supabase
        .from('cases')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'in_progress');

      const { count: resolvedCases } = await supabase
        .from('cases')
        .select('*', { count: 'exact', head: true })
        .in('status', ['resolved', 'closed']);

      // Fetch overdue cases
      const { count: overdueCases } = await supabase
        .from('cases')
        .select('*', { count: 'exact', head: true })
        .lt('sla_due_at', new Date().toISOString())
        .neq('status', 'closed');

      setStats({
        totalCases: totalCases || 0,
        openCases: openCases || 0,
        inProgressCases: inProgressCases || 0,
        resolvedCases: resolvedCases || 0,
        overdueCases: overdueCases || 0
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = async () => {
    try {
      // Fetch priority distribution
      const { data: priorityStats } = await supabase
        .from('cases')
        .select('priority')
        .not('status', 'eq', 'closed');

      const priorityCounts = priorityStats?.reduce((acc: Record<string, number>, case_) => {
        acc[case_.priority] = (acc[case_.priority] || 0) + 1;
        return acc;
      }, {});

      const priorityChartData = Object.entries(priorityCounts || {}).map(([priority, count]) => ({
        name: priority,
        value: count as number,
        color: priority === 'high' ? '#ef4444' : priority === 'medium' ? '#f59e0b' : '#10b981'
      }));

      setPriorityData(priorityChartData);

      // Fetch monthly case creation trend (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data: monthlyCases } = await supabase
        .from('cases')
        .select('created_at')
        .gte('created_at', sixMonthsAgo.toISOString());

      const monthlyStats = monthlyCases?.reduce((acc: Record<string, number>, case_) => {
        const month = new Date(case_.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      }, {});

      const monthlyChartData = Object.entries(monthlyStats || {}).map(([month, count]) => ({
        name: month,
        value: count as number
      }));

      setMonthlyData(monthlyChartData);
    } catch (error) {
      console.error('Error fetching chart data:', error);
    }
  };

  const quickActions = [
    {
      title: 'Create Case',
      description: 'Create a new case',
      icon: FileText,
      color: 'bg-blue-500',
      action: () => navigate('/cases/new')
    },
    {
      title: 'Search Cases',
      description: 'Find existing cases',
      icon: Search,
      color: 'bg-green-500',
      action: () => navigate('/cases')
    },
    {
      title: 'My Cases',
      description: 'View assigned cases',
      icon: Users,
      color: 'bg-purple-500',
      action: () => navigate('/cases')
    },
    {
      title: 'Admin Portal',
      description: 'System administration',
      icon: Settings,
      color: 'bg-orange-500',
      action: () => navigate('/admin/users')
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your case management system.
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Cases</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCases}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Open Cases</CardTitle>
                <AlertCircle className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.openCases}</div>
                <p className="text-xs text-muted-foreground">Needs attention</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.inProgressCases}</div>
                <p className="text-xs text-muted-foreground">Being worked on</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Resolved</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.resolvedCases}</div>
                <p className="text-xs text-muted-foreground">Completed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.overdueCases}</div>
                <p className="text-xs text-muted-foreground">Past SLA</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Case Priority Distribution
                </CardTitle>
                <CardDescription>Current open cases by priority level</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={priorityData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {priorityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Monthly Case Trend
                </CardTitle>
                <CardDescription>Cases created over the last 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Frequently used actions to help you manage cases efficiently
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center space-y-2 hover:shadow-md transition-shadow"
                    onClick={action.action}
                  >
                    <div className={`p-2 rounded-full ${action.color}`}>
                      <action.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-center">
                      <div className="font-medium">{action.title}</div>
                      <div className="text-xs text-muted-foreground">{action.description}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest updates and activities across all cases
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                Recent activity feed will be displayed here
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6">
          <CalendarView />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
