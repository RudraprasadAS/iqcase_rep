import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';

export const useNotificationsApi = () => {
  const queryClient = useQueryClient();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch notifications from backend API
  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications-api'],
    queryFn: async () => {
      console.log('🔔 [useNotificationsApi] Fetching notifications from backend API');
      
      try {
        const data = await apiService.getNotifications();
        console.log('🔔 [useNotificationsApi] Notifications fetched:', Array.isArray(data) ? data.length : 0);
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('🔔 [useNotificationsApi] Exception fetching notifications:', error);
        throw error;
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Update local state when data changes
  useEffect(() => {
    if (notificationsData && Array.isArray(notificationsData)) {
      console.log('🔔 [useNotificationsApi] Updating local state with notifications:', notificationsData.length);
      setNotifications(notificationsData);
      const unread = notificationsData.filter((n: any) => !n.is_read).length;
      setUnreadCount(unread);
      console.log('🔔 [useNotificationsApi] Unread count:', unread);
    }
    setLoading(isLoading);
  }, [notificationsData, isLoading]);

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      console.log('🔔 [useNotificationsApi] Marking notification as read:', notificationId);
      return await apiService.markNotificationAsRead(notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-api'] });
    },
    onError: (error) => {
      console.error('🔔 [useNotificationsApi] Failed to mark as read:', error);
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
      console.log('🔔 [useNotificationsApi] Marking all notifications as read');
      return await apiService.markAllNotificationsAsRead();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-api'] });
      toast({
        title: "Success",
        description: "All notifications marked as read"
      });
    },
    onError: (error) => {
      console.error('🔔 [useNotificationsApi] Failed to mark all as read:', error);
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
      console.log('🔔 [useNotificationsApi] Deleting notification:', notificationId);
      return await apiService.deleteNotification(notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-api'] });
      toast({
        title: "Success",
        description: "Notification deleted"
      });
    },
    onError: (error) => {
      console.error('🔔 [useNotificationsApi] Failed to delete notification:', error);
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
    refetch: () => queryClient.invalidateQueries({ queryKey: ['notifications-api'] })
  };
};