
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export interface Notification {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
  case_id?: string;
  user_id: string;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  // Get current user's internal ID for proper notification access
  const { data: currentUserData } = useQuery({
    queryKey: ["current_user_info"],
    queryFn: async () => {
      console.log('🔔 [useNotifications] Fetching current user info...');
      const { data, error } = await supabase.rpc('get_current_user_info');
      if (error) {
        console.error('🔔 [useNotifications] Error fetching user info:', error);
        throw error;
      }
      const result = data?.[0];
      console.log('🔔 [useNotifications] Current user info:', result);
      return result;
    },
    enabled: !!user
  });

  // Fetch notifications for the current user
  const { data: notifications = [], isLoading, refetch } = useQuery({
    queryKey: ["notifications", currentUserData?.user_id],
    queryFn: async () => {
      if (!currentUserData?.user_id) {
        console.log('🔔 [useNotifications] No user ID available, returning empty notifications');
        return [];
      }
      
      console.log('🔔 [useNotifications] Fetching notifications for user:', currentUserData.user_id);
      
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", currentUserData.user_id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error('🔔 [useNotifications] Error fetching notifications:', error);
        throw error;
      }

      console.log('🔔 [useNotifications] Fetched notifications:', data?.length || 0);
      return data || [];
    },
    enabled: !!currentUserData?.user_id,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      console.log('🔔 [useNotifications] Marking notification as read:', notificationId);
      
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId)
        .eq("user_id", currentUserData?.user_id);

      if (error) {
        console.error('🔔 [useNotifications] Error marking notification as read:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error) => {
      console.error('🔔 [useNotifications] Failed to mark notification as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      });
    },
  });

  // Mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!currentUserData?.user_id) return;
      
      console.log('🔔 [useNotifications] Marking all notifications as read for user:', currentUserData.user_id);
      
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", currentUserData.user_id)
        .eq("is_read", false);

      if (error) {
        console.error('🔔 [useNotifications] Error marking all notifications as read:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    },
    onError: (error) => {
      console.error('🔔 [useNotifications] Failed to mark all notifications as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark notifications as read",
        variant: "destructive",
      });
    },
  });

  // Delete notification
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      console.log('🔔 [useNotifications] Deleting notification:', notificationId);
      
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId)
        .eq("user_id", currentUserData?.user_id);

      if (error) {
        console.error('🔔 [useNotifications] Error deleting notification:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast({
        title: "Success",
        description: "Notification deleted",
      });
    },
    onError: (error) => {
      console.error('🔔 [useNotifications] Failed to delete notification:', error);
      toast({
        title: "Error",
        description: "Failed to delete notification",
        variant: "destructive",
      });
    },
  });

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.is_read).length;
  
  // Get recent notifications (last 5)
  const recentNotifications = notifications.slice(0, 5);

  // Debug logging
  useEffect(() => {
    console.log('🔔 [useNotifications] Notification state update:', {
      userDataAvailable: !!currentUserData,
      userId: currentUserData?.user_id,
      totalNotifications: notifications.length,
      unreadCount,
      recentCount: recentNotifications.length,
      isLoading
    });
  }, [notifications, unreadCount, recentNotifications.length, isLoading, currentUserData]);

  return {
    notifications,
    recentNotifications,
    unreadCount,
    isLoading,
    loading: isLoading, // Add alias for backward compatibility
    isOpen,
    setIsOpen,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    deleteNotification: deleteNotificationMutation.mutate,
    refetch,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
  };
};
