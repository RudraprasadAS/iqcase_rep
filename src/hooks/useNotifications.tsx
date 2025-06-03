
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface Notification {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  case_id?: string;
  is_read: boolean;
  created_at: string;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [internalUserId, setInternalUserId] = useState<string | null>(null);

  // Get internal user ID
  useEffect(() => {
    const getInternalUserId = async () => {
      if (!user) {
        console.log('🔔 No auth user found');
        return;
      }

      try {
        console.log('🔔 Fetching internal user ID for auth user:', user.id);
        
        const { data: userData, error } = await supabase
          .from('users')
          .select('id')
          .eq('auth_user_id', user.id)
          .single();

        if (error) {
          console.error('🔔 Error fetching internal user:', error);
          return;
        }

        if (!userData) {
          console.log('🔔 No internal user found for auth user:', user.id);
          return;
        }

        console.log('🔔 Internal user ID found:', userData.id);
        setInternalUserId(userData.id);
      } catch (error) {
        console.error('🔔 Exception fetching internal user:', error);
      }
    };

    getInternalUserId();
  }, [user]);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!internalUserId) {
      console.log('🔔 No internal user ID, skipping notification fetch');
      return;
    }

    try {
      console.log('🔔 Fetching notifications for user:', internalUserId);
      setLoading(true);

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', internalUserId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('🔔 Error fetching notifications:', error);
        throw error;
      }

      console.log('🔔 Notifications fetched:', data?.length || 0, 'items');

      setNotifications(data || []);
      
      // Count unread notifications
      const unread = (data || []).filter(n => !n.is_read).length;
      console.log('🔔 Unread count:', unread);
      setUnreadCount(unread);

    } catch (error) {
      console.error('🔔 Error in fetchNotifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notifications',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      console.log('🔔 Marking notification as read:', notificationId);
      
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('🔔 Error marking as read:', error);
        throw error;
      }

      // Update local state
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      ));
      
      setUnreadCount(prev => Math.max(0, prev - 1));
      console.log('🔔 Notification marked as read successfully');

    } catch (error) {
      console.error('🔔 Error in markAsRead:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!internalUserId) return;

    try {
      console.log('🔔 Marking all notifications as read for user:', internalUserId);
      
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', internalUserId)
        .eq('is_read', false);

      if (error) {
        console.error('🔔 Error marking all as read:', error);
        throw error;
      }

      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      console.log('🔔 All notifications marked as read successfully');

    } catch (error) {
      console.error('🔔 Error in markAllAsRead:', error);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    try {
      console.log('🔔 Deleting notification:', notificationId);
      
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        console.error('🔔 Error deleting notification:', error);
        throw error;
      }

      // Update local state
      const deletedNotification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      if (deletedNotification && !deletedNotification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      console.log('🔔 Notification deleted successfully');

    } catch (error) {
      console.error('🔔 Error in deleteNotification:', error);
    }
  };

  // Fetch notifications when internal user ID is available
  useEffect(() => {
    if (internalUserId) {
      console.log('🔔 Internal user ID available, fetching notifications');
      fetchNotifications();
    }
  }, [internalUserId]);

  // Set up real-time subscription
  useEffect(() => {
    if (!internalUserId) {
      console.log('🔔 No internal user ID for real-time subscription');
      return;
    }

    console.log('🔔 Setting up real-time notifications subscription for user:', internalUserId);

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${internalUserId}`
        },
        (payload) => {
          console.log('🔔 New notification received via real-time:', payload);
          const newNotification = payload.new as Notification;
          
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Show toast for new notification
          toast({
            title: newNotification.title,
            description: newNotification.message,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${internalUserId}`
        },
        (payload) => {
          console.log('🔔 Notification updated via real-time:', payload);
          const updatedNotification = payload.new as Notification;
          
          setNotifications(prev => prev.map(n => 
            n.id === updatedNotification.id ? updatedNotification : n
          ));
          
          // Update unread count if read status changed
          if (updatedNotification.is_read) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔔 Cleaning up notifications subscription');
      supabase.removeChannel(channel);
    };
  }, [internalUserId, toast]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchNotifications,
  };
};
