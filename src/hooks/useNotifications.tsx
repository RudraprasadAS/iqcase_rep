
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useNotifications = () => {
  const queryClient = useQueryClient();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch notifications with proper backend filtering
  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      console.log('🔔 [useNotifications] Fetching notifications from backend');
      
      try {
        // Let the backend handle all filtering based on RLS policies
        const { data, error } = await supabase
          .from('notifications')
          .select(`
            id,
            title,
            message,
            notification_type,
            is_read,
            case_id,
            user_id,
            created_at,
            updated_at
          `)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('🔔 [useNotifications] Error fetching notifications:', error);
          throw error;
        }

        console.log('🔔 [useNotifications] Notifications fetched:', data?.length || 0);
        return data || [];
      } catch (error) {
        console.error('🔔 [useNotifications] Exception fetching notifications:', error);
        throw error;
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Update local state when data changes
  useEffect(() => {
    if (notificationsData) {
      console.log('🔔 [useNotifications] Updating local state with notifications:', notificationsData.length);
      setNotifications(notificationsData);
      const unread = notificationsData.filter(n => !n.is_read).length;
      setUnreadCount(unread);
      console.log('🔔 [useNotifications] Unread count:', unread);
    }
    setLoading(isLoading);
  }, [notificationsData, isLoading]);

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      console.log('🔔 [useNotifications] Marking notification as read:', notificationId);
      
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('id', notificationId);
        
      if (error) {
        console.error('🔔 [useNotifications] Error marking as read:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error) => {
      console.error('🔔 [useNotifications] Failed to mark as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive"
      });
    }
  });

  // Mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      console.log('🔔 [useNotifications] Marking all notifications as read');
      
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('is_read', false);
        
      if (error) {
        console.error('🔔 [useNotifications] Error marking all as read:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast({
        title: "Success",
        description: "All notifications marked as read"
      });
    },
    onError: (error) => {
      console.error('🔔 [useNotifications] Failed to mark all as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive"
      });
    }
  });

  // Delete notification
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      console.log('🔔 [useNotifications] Deleting notification:', notificationId);
      
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);
        
      if (error) {
        console.error('🔔 [useNotifications] Error deleting notification:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast({
        title: "Success",
        description: "Notification deleted"
      });
    },
    onError: (error) => {
      console.error('🔔 [useNotifications] Failed to delete notification:', error);
      toast({
        title: "Error",
        description: "Failed to delete notification",
        variant: "destructive"
      });
    }
  });

  const markAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  };

  const markAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const deleteNotification = (notificationId: string) => {
    deleteNotificationMutation.mutate(notificationId);
  };

  return {
    notifications,
    unreadCount,
    loading: loading || isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
  };
};
