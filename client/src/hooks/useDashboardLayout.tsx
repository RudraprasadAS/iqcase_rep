
import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface LayoutItem {
  i: string; // item id
  x: number; // x position in grid units
  y: number; // y position in grid units
  w: number; // width in grid units
  h: number; // height in grid units
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
}

export const useDashboardLayout = (dashboardId: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditMode, setIsEditMode] = useState(false);

  // Get current user's internal ID for proper database access
  const { data: currentUserData } = useQuery({
    queryKey: ["current_user_info"],
    queryFn: async () => {
      console.log('📊 [useDashboardLayout] Fetching current user info...');
      
      try {
        const { data, error } = await supabase.rpc('get_current_user_info');
        if (error) {
          console.error('📊 [useDashboardLayout] Error fetching user info:', error);
          throw error;
        }
        const result = data?.[0];
        console.log('📊 [useDashboardLayout] Current user info:', result);
        return result;
      } catch (error) {
        console.error('📊 [useDashboardLayout] Exception fetching user info:', error);
        // Fallback: try to get user ID from users table directly
        if (user) {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('auth_user_id', user.id)
            .maybeSingle();
          
          if (userError) {
            console.error('📊 [useDashboardLayout] Fallback user lookup error:', userError);
            throw userError;
          }
          
          if (userData) {
            console.log('📊 [useDashboardLayout] Fallback user ID found:', userData.id);
            return { user_id: userData.id };
          }
        }
        throw error;
      }
    },
    enabled: !!user
  });

  // Fetch saved layout
  const { data: savedLayout, isLoading } = useQuery({
    queryKey: ['dashboard-layout', currentUserData?.user_id, dashboardId],
    queryFn: async () => {
      if (!currentUserData?.user_id) {
        console.log('📊 [useDashboardLayout] No user ID available');
        return null;
      }
      
      console.log('📊 [useDashboardLayout] Fetching layout for user:', currentUserData.user_id, 'dashboard:', dashboardId);
      
      try {
        const { data, error } = await supabase
          .from('dashboard_layouts')
          .select('layout_data')
          .eq('user_id', currentUserData.user_id)
          .eq('dashboard_id', dashboardId)
          .maybeSingle();
        
        if (error) {
          console.error('📊 [useDashboardLayout] Error fetching layout:', error);
          return null;
        }
        
        console.log('📊 [useDashboardLayout] Fetched layout:', data);
        return data?.layout_data ? (data.layout_data as unknown as LayoutItem[]) : null;
      } catch (error) {
        console.error('📊 [useDashboardLayout] Exception fetching layout:', error);
        return null;
      }
    },
    enabled: !!currentUserData?.user_id && !!dashboardId
  });

  // Save layout mutation with improved error handling
  const saveLayoutMutation = useMutation({
    mutationFn: async (layout: LayoutItem[]) => {
      if (!currentUserData?.user_id) {
        throw new Error('User not authenticated or user ID not available');
      }
      
      if (!dashboardId) {
        throw new Error('Dashboard ID is required');
      }
      
      console.log('📊 [useDashboardLayout] Saving layout for user:', currentUserData.user_id, 'dashboard:', dashboardId, 'layout:', layout);
      
      try {
        const { data, error } = await supabase
          .from('dashboard_layouts')
          .upsert({
            user_id: currentUserData.user_id,
            dashboard_id: dashboardId,
            layout_data: layout as any,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,dashboard_id'
          })
          .select();
        
        if (error) {
          console.error('📊 [useDashboardLayout] Error saving layout:', error);
          throw error;
        }
        
        console.log('📊 [useDashboardLayout] Layout saved successfully:', data);
        return layout;
      } catch (error) {
        console.error('📊 [useDashboardLayout] Exception saving layout:', error);
        throw error;
      }
    },
    onSuccess: (layout) => {
      console.log('📊 [useDashboardLayout] Save mutation succeeded');
      queryClient.invalidateQueries({ queryKey: ['dashboard-layout', currentUserData?.user_id, dashboardId] });
      toast({
        title: 'Layout saved',
        description: 'Your dashboard layout has been saved successfully'
      });
    },
    onError: (error) => {
      console.error('📊 [useDashboardLayout] Error saving layout:', error);
      toast({
        variant: 'destructive',
        title: 'Error saving layout',
        description: error.message || 'Failed to save layout. Please try again.'
      });
    }
  });

  const saveLayout = (layout: LayoutItem[]) => {
    if (!currentUserData?.user_id) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Unable to save layout - user not authenticated'
      });
      return;
    }
    
    if (!dashboardId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Unable to save layout - dashboard ID missing'
      });
      return;
    }
    
    console.log('📊 [useDashboardLayout] Triggering save layout with:', layout);
    saveLayoutMutation.mutate(layout);
  };

  const getDefaultLayout = (itemCount: number): LayoutItem[] => {
    const layouts: LayoutItem[] = [];
    const cols = 4; // 4 columns grid
    
    for (let i = 0; i < itemCount; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      
      layouts.push({
        i: i.toString(),
        x: col * 3, // Each item takes 3 grid units width by default
        y: row * 4, // Each row is 4 grid units high
        w: 3, // Default width
        h: 4, // Default height
        minW: 2,
        minH: 2
      });
    }
    
    return layouts;
  };

  return {
    savedLayout,
    isLoading,
    isEditMode,
    setIsEditMode,
    saveLayout,
    getDefaultLayout,
    isSaving: saveLayoutMutation.isPending
  };
};
