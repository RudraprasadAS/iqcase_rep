
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CalendarView from '@/components/dashboard/CalendarView';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { FileText, Clock, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DashboardStats {
  totalCases: number;
  openCases: number;
  inProgressCases: number;
  resolvedCases: number;
  overdueCases: number;
}

interface PriorityDistribution {
  name: string;
  value: number;
  color: string;
}

interface MonthlyTrend {
  month: string;
  cases: number;
}

const Dashboard = () => {
  console.log('🏠 [Dashboard] Rendering dashboard page');
  
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [stats, setStats] = useState<DashboardStats>({
    totalCases: 0,
    openCases: 0,
    inProgressCases: 0,
    resolvedCases: 0,
    overdueCases: 0
  });
  
  const [priorityData, setPriorityData] = useState<PriorityDistribution[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyTrend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      console.log('📊 [Dashboard] Fetching dashboard data...');

      // Fetch case statistics
      const { data: casesData, error: casesError } = await supabase
        .from('cases')
        .select('id, status, priority, created_at, sla_due_at');

      if (casesError) {
        console.error('📊 [Dashboard] Cases fetch error:', casesError);
        throw casesError;
      }

      console.log('📊 [Dashboard] Cases data fetched:', casesData?.length || 0, 'cases');

      const totalCases = casesData?.length || 0;
      const openCases = casesData?.filter(c => c.status === 'open').length || 0;
      const inProgressCases = casesData?.filter(c => c.status === 'in_progress').length || 0;
      const resolvedCases = casesData?.filter(c => c.status === 'resolved' || c.status === 'closed').length || 0;
      
      // Calculate overdue cases
      const now = new Date();
      const overdueCases = casesData?.filter(c => 
        c.sla_due_at && new Date(c.sla_due_at) < now && c.status !== 'resolved' && c.status !== 'closed'
      ).length || 0;

      setStats({
        totalCases,
        openCases,
        inProgressCases,
        resolvedCases,
        overdueCases
      });

      // Calculate priority distribution for open cases
      const openCasesData = casesData?.filter(c => c.status === 'open') || [];
      const priorityCounts = openCasesData.reduce((acc, case_) => {
        const priority = case_.priority || 'medium';
        acc[priority] = (acc[priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const priorityColors = {
        low: '#10B981',
        medium: '#F59E0B',
        high: '#EF4444',
        urgent: '#DC2626'
      };

      const priorityDistribution = Object.entries(priorityCounts).map(([priority, count]) => ({
        name: priority,
        value: count,
        color: priorityColors[priority as keyof typeof priorityColors] || '#6B7280'
      }));

      setPriorityData(priorityDistribution);

      // Calculate monthly trend (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const monthlyData = casesData?.filter(c => 
        new Date(c.created_at) >= sixMonthsAgo
      ).reduce((acc, case_) => {
        const month = new Date(case_.created_at).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short' 
        });
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const trendData = Object.entries(monthlyData)
        .map(([month, cases]) => ({ month, cases }))
        .sort((a, b) => new Date(a.month + ' 1').getTime() - new Date(b.month + ' 1').getTime());

      setMonthlyTrend(trendData);

    } catch (error) {
      console.error('📊 [Dashboard] Error fetching dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's an overview of your case management system.</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <PermissionGuard elementKey="dashboard" permissionType="view">
            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
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
                  <Clock className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{stats.openCases}</div>
                  <p className="text-xs text-muted-foreground">Needs attention</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                  <TrendingUp className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{stats.inProgressCases}</div>
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
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Case Priority Distribution
                  </CardTitle>
                  <CardDescription>Current open cases by priority level</CardDescription>
                </CardHeader>
                <CardContent>
                  {priorityData.length > 0 ? (
                    <ChartContainer config={{}} className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={priorityData}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey="value"
                            label={({ name, value, percent }) => 
                              `${name} ${value} (${(percent * 100).toFixed(0)}%)`
                            }
                          >
                            {priorityData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <ChartTooltip content={<ChartTooltipContent />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No data available
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Monthly Case Trend
                  </CardTitle>
                  <CardDescription>Cases created over the last 6 months</CardDescription>
                </CardHeader>
                <CardContent>
                  {monthlyTrend.length > 0 ? (
                    <ChartContainer config={{}} className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={monthlyTrend}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Line 
                            type="monotone" 
                            dataKey="cases" 
                            stroke="#3B82F6" 
                            strokeWidth={2}
                            dot={{ fill: '#3B82F6' }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Frequently used actions to help you manage cases efficiently</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button variant="outline" className="h-20 flex-col" onClick={() => window.location.href = '/cases/new'}>
                    <FileText className="h-6 w-6 mb-2 text-blue-500" />
                    Create Case
                  </Button>
                  <Button variant="outline" className="h-20 flex-col" onClick={() => window.location.href = '/cases'}>
                    <Clock className="h-6 w-6 mb-2 text-green-500" />
                    View Cases
                  </Button>
                  <Button variant="outline" className="h-20 flex-col" onClick={() => window.location.href = '/reports'}>
                    <TrendingUp className="h-6 w-6 mb-2 text-purple-500" />
                    Reports
                  </Button>
                  <Button variant="outline" className="h-20 flex-col" onClick={() => window.location.href = '/insights'}>
                    <AlertCircle className="h-6 w-6 mb-2 text-orange-500" />
                    Insights
                  </Button>
                </div>
              </CardContent>
            </Card>
          </PermissionGuard>
        </TabsContent>

        <TabsContent value="calendar">
          <PermissionGuard elementKey="dashboard" permissionType="view">
            <CalendarView />
          </PermissionGuard>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
