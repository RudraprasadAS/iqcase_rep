
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Plus, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Users,
  TrendingUp,
  Calendar,
  ArrowUpRight
} from 'lucide-react';

interface DashboardStats {
  totalCases: number;
  openCases: number;
  inProgressCases: number;
  resolvedCases: number;
  overdueCases: number;
  recentCases: any[];
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalCases: 0,
    openCases: 0,
    inProgressCases: 0,
    resolvedCases: 0,
    overdueCases: 0,
    recentCases: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: cases, error } = await supabase
        .from('cases')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const now = new Date();
      
      const dashboardStats: DashboardStats = {
        totalCases: cases?.length || 0,
        openCases: cases?.filter(c => c.status === 'open').length || 0,
        inProgressCases: cases?.filter(c => c.status === 'in_progress').length || 0,
        resolvedCases: cases?.filter(c => c.status === 'resolved').length || 0,
        overdueCases: cases?.filter(c => 
          c.sla_due_at && 
          new Date(c.sla_due_at) < now && 
          !['resolved', 'closed'].includes(c.status)
        ).length || 0,
        recentCases: cases?.slice(0, 5) || []
      };

      setStats(dashboardStats);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateCaseNumber = (id: string, createdAt: string) => {
    const year = new Date(createdAt).getFullYear();
    const shortId = id.slice(-6).toUpperCase();
    return `#${year}-${shortId}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Dashboard - IQCase</title>
      </Helmet>

      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back! Here's your case management overview.
            </p>
          </div>
          <div className="flex space-x-2">
            <Link to="/cases/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Case
              </Button>
            </Link>
            <Link to="/cases">
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                View All Cases
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cases</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCases}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.openCases}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <TrendingUp className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.inProgressCases}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.resolvedCases}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.overdueCases}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Cases */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Cases</CardTitle>
              <Link to="/cases">
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowUpRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {stats.recentCases.length === 0 ? (
                <div className="text-center py-6">
                  <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No cases yet</p>
                  <Link to="/cases/new">
                    <Button className="mt-2" size="sm">
                      Create First Case
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.recentCases.map((case_) => (
                    <Link
                      key={case_.id}
                      to={`/cases/${case_.id}`}
                      className="block p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-sm">
                              {generateCaseNumber(case_.id, case_.created_at)}
                            </span>
                            <Badge variant="outline" className={getStatusColor(case_.status)}>
                              {case_.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {case_.title}
                          </p>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(case_.created_at)}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/cases/new" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Case
                </Button>
              </Link>
              <Link to="/cases" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Browse All Cases
                </Button>
              </Link>
              <Link to="/knowledge" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Knowledge Base
                </Button>
              </Link>
              <Link to="/reports" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View Reports
                </Button>
              </Link>
              <Link to="/admin/users" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Users
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
