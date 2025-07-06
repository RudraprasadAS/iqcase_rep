
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Plus, FileText, Clock, CheckCircle, AlertCircle, MessageCircle } from 'lucide-react';
import StatusBadge from '@/components/cases/StatusBadge';
import PriorityBadge from '@/components/cases/PriorityBadge';
import { formatDistanceToNow } from 'date-fns';
import NotificationCenter from '@/components/notifications/NotificationCenter';

interface DashboardStats {
  totalCases: number;
  openCases: number;
  inProgressCases: number;
  closedCases: number;
  unreadMessages: number;
  unreadNotifications: number;
}

interface RecentCase {
  id: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

const CitizenDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [stats, setStats] = useState<DashboardStats>({
    totalCases: 0,
    openCases: 0,
    inProgressCases: 0,
    closedCases: 0,
    unreadMessages: 0,
    unreadNotifications: 0
  });
  const [recentCases, setRecentCases] = useState<RecentCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [internalUserId, setInternalUserId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchInternalUserId();
    }
  }, [user]);

  useEffect(() => {
    if (internalUserId) {
      fetchDashboardData();
    }
  }, [internalUserId]);

  const fetchInternalUserId = async () => {
    if (!user) return;

    try {
      console.log('Fetching internal user ID for auth user:', user.id);
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (userError) {
        console.error('User lookup error:', userError);
        throw userError;
      }

      if (!userData) {
        console.log('No internal user found for auth user:', user.id);
        toast({
          title: 'User Setup Required',
          description: 'Please contact support to set up your account.',
          variant: 'destructive'
        });
        return;
      }

      console.log('Internal user ID found:', userData.id);
      setInternalUserId(userData.id);
    } catch (error) {
      console.error('Error fetching internal user ID:', error);
      toast({
        title: 'Error',
        description: 'Failed to load user information',
        variant: 'destructive'
      });
    }
  };

  const fetchDashboardData = async () => {
    if (!internalUserId) return;

    try {
      console.log('Fetching dashboard data for internal user:', internalUserId);

      // Fetch case statistics
      const { data: casesData, error: casesError } = await supabase
        .from('cases')
        .select('id, status, title, priority, created_at, updated_at')
        .eq('submitted_by', internalUserId)
        .order('updated_at', { ascending: false });

      if (casesError) {
        console.error('Cases fetch error:', casesError);
        throw casesError;
      }

      console.log('Cases data fetched:', casesData?.length || 0, 'cases');
      console.log('Cases data details:', casesData);

      const totalCases = casesData?.length || 0;
      const openCases = casesData?.filter(c => c.status === 'open').length || 0;
      const inProgressCases = casesData?.filter(c => c.status === 'in_progress').length || 0;
      // Include both 'resolved' and 'closed' statuses for closed cases count
      const closedCases = casesData?.filter(c => c.status === 'resolved' || c.status === 'closed').length || 0;

      console.log('Cases breakdown:', {
        totalCases,
        openCases,
        inProgressCases,
        closedCases,
        statusBreakdown: casesData?.reduce((acc, c) => {
          acc[c.status] = (acc[c.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      });

      // Fetch unread messages count
      const { count: unreadMessagesCount, error: messagesError } = await supabase
        .from('case_messages')
        .select('*', { count: 'exact', head: true })
        .in('case_id', casesData?.map(c => c.id) || [])
        .eq('is_internal', false)
        .neq('sender_id', internalUserId);

      if (messagesError) {
        console.error('Messages count error:', messagesError);
      }

      // Fetch unread notifications count
      const { count: unreadNotificationsCount, error: notificationsError } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', internalUserId)
        .eq('is_read', false);

      if (notificationsError) {
        console.error('Notifications count error:', notificationsError);
      }

      setStats({
        totalCases,
        openCases,
        inProgressCases,
        closedCases,
        unreadMessages: unreadMessagesCount || 0,
        unreadNotifications: unreadNotificationsCount || 0
      });

      setRecentCases(casesData?.slice(0, 5) || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's an overview of your cases.</p>
        </div>
        <Button onClick={() => navigate('/citizen/cases/new')} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          New Case
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cases</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCases}</div>
            <p className="text-xs text-muted-foreground">All submitted cases</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Cases</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.openCases}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgressCases}</div>
            <p className="text-xs text-muted-foreground">Being worked on</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.closedCases}</div>
            <p className="text-xs text-muted-foreground">Completed cases</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Cases */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Cases</CardTitle>
            <CardDescription>Your latest case submissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentCases.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No cases submitted yet</p>
              ) : (
                recentCases.map((case_) => (
                  <div
                    key={case_.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/citizen/cases/${case_.id}`)}
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{case_.title}</h4>
                      <p className="text-xs text-gray-500">
                        Updated {formatDistanceToNow(new Date(case_.updated_at), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={case_.status} />
                      <PriorityBadge priority={case_.priority} />
                    </div>
                  </div>
                ))
              )}
            </div>
            {recentCases.length > 0 && (
              <div className="mt-4">
                <Button variant="outline" onClick={() => navigate('/citizen/cases')} className="w-full">
                  View All Cases
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notifications */}
        <NotificationCenter />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex-col"
              onClick={() => navigate('/citizen/cases/new')}
            >
              <Plus className="h-6 w-6 mb-2" />
              Submit New Case
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col"
              onClick={() => navigate('/citizen/cases')}
            >
              <FileText className="h-6 w-6 mb-2" />
              View My Cases
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col"
              onClick={() => navigate('/knowledge')}
            >
              <MessageCircle className="h-6 w-6 mb-2" />
              Knowledge Base
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CitizenDashboard;
