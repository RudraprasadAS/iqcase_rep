
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Bell, Check, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
  case_id?: string;
}

const NotificationCenter = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      setLoading(true);
      console.log('🔔 NotificationCenter: Fetching notifications for user:', user.id);
      
      // Debug user mapping first
      const { data: debugData, error: debugError } = await supabase
        .rpc('debug_user_mapping');

      if (debugError) {
        console.error('🔔 NotificationCenter: Debug mapping error:', debugError);
      } else {
        console.log('🔔 NotificationCenter: User mapping result:', debugData);
      }

      // Get internal user ID
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (userError) {
        console.error('🔔 NotificationCenter: Error fetching internal user:', userError);
        return;
      }

      if (!userData) {
        console.log('🔔 NotificationCenter: No internal user found');
        return;
      }

      console.log('🔔 NotificationCenter: Internal user ID:', userData.id);

      // Fetch all notifications (RLS is disabled) and filter by user
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userData.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('🔔 NotificationCenter: Notifications fetch error:', error);
        return;
      }

      console.log('🔔 NotificationCenter: Notifications fetched:', data?.length || 0);
      setNotifications(data || []);
    } catch (error) {
      console.error('🔔 NotificationCenter: Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    setLoading(true);
    try {
      console.log('🔔 NotificationCenter: Marking as read:', notificationId);
      
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('🔔 NotificationCenter: Mark as read error:', error);
        throw error;
      }
      
      console.log('🔔 NotificationCenter: Successfully marked as read');
      fetchNotifications();
    } catch (error) {
      console.error('🔔 NotificationCenter: Error marking notification as read:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Get internal user ID
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (userError || !userData) {
        console.error('🔔 NotificationCenter: Error getting user for mark all read:', userError);
        return;
      }

      console.log('🔔 NotificationCenter: Marking all as read for user:', userData.id);

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userData.id)
        .eq('is_read', false);

      if (error) {
        console.error('🔔 NotificationCenter: Mark all as read error:', error);
        throw error;
      }
      
      console.log('🔔 NotificationCenter: Successfully marked all as read');
      fetchNotifications();
    } catch (error) {
      console.error('🔔 NotificationCenter: Error marking all notifications as read:', error);
    } finally {
      setLoading(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              disabled={loading}
            >
              <Check className="h-4 w-4 mr-1" />
              Mark All Read
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="max-h-96 overflow-y-auto space-y-3">
          {loading ? (
            <p className="text-gray-500 text-center py-4">Loading notifications...</p>
          ) : notifications.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No notifications</p>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`border rounded-lg p-3 ${
                  !notification.is_read ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{notification.title}</h4>
                      {!notification.is_read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  {!notification.is_read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsRead(notification.id)}
                      disabled={loading}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationCenter;
