
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckCircle, MessageSquare, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';

interface Notification {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  case_id?: string;
  is_read: boolean;
  created_at: string;
}

interface CaseNotificationsProps {
  caseId: string;
}

const CaseNotifications = ({ caseId }: CaseNotificationsProps) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [internalUserId, setInternalUserId] = useState<string | null>(null);

  useEffect(() => {
    const getInternalUserId = async () => {
      if (!user) return;

      try {
        const { data: userData, error } = await supabase
          .from('users')
          .select('id')
          .eq('auth_user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching internal user:', error);
          return;
        }

        setInternalUserId(userData.id);
      } catch (error) {
        console.error('Exception fetching internal user:', error);
      }
    };

    getInternalUserId();
  }, [user]);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!internalUserId) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', internalUserId)
          .eq('case_id', caseId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching case notifications:', error);
          return;
        }

        setNotifications(data || []);
      } catch (error) {
        console.error('Exception fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    if (internalUserId) {
      fetchNotifications();
    }
  }, [internalUserId, caseId]);

  // Set up real-time subscription for new notifications
  useEffect(() => {
    if (!internalUserId) return;

    const channel = supabase
      .channel(`case_notifications_${caseId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${internalUserId} AND case_id=eq.${caseId}`
        },
        (payload) => {
          console.log('New case notification received:', payload);
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [internalUserId, caseId]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'case_status_change':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'new_message':
        return <MessageSquare className="h-4 w-4 text-green-500" />;
      case 'case_closed':
        return <CheckCircle className="h-4 w-4 text-purple-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-center text-gray-500">Loading notifications...</div>
        </CardContent>
      </Card>
    );
  }

  if (notifications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Case Updates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-4">
            No updates for this case yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Case Updates ({notifications.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-3 rounded-lg border ${
              !notification.is_read ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-start gap-3">
              {getNotificationIcon(notification.notification_type)}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">{notification.title}</h4>
                  {!notification.is_read && (
                    <Badge variant="secondary" className="text-xs">
                      New
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default CaseNotifications;
