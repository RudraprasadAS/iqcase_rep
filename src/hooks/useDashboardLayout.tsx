
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
      const { data, error } = await supabase.rpc('get_current_user_info');
      if (error) {
        console.error('📊 [useDashboardLayout] Error fetching user info:', error);
        throw error;
      }
      const result = data?.[0];
      console.log('📊 [useDashboardLayout] Current user info:', result);
      return result;
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
    },
    enabled: !!currentUserData?.user_id
  });

  // Save layout mutation
  const saveLayoutMutation = useMutation({
    mutationFn: async (layout: LayoutItem[]) => {
      if (!currentUserData?.user_id) {
        throw new Error('User not authenticated or user ID not available');
      }
      
      console.log('📊 [useDashboardLayout] Saving layout for user:', currentUserData.user_id, 'layout:', layout);
      
      const { error } = await supabase
        .from('dashboard_layouts')
        .upsert({
          user_id: currentUserData.user_id,
          dashboard_id: dashboardId,
          layout_data: layout as any
        });
      
      if (error) {
        console.error('📊 [useDashboardLayout] Error saving layout:', error);
        throw error;
      }
      
      console.log('📊 [useDashboardLayout] Layout saved successfully');
      return layout;
    },
    onSuccess: () => {
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
        title: 'Error',
        description: 'Failed to save layout. Please try again.'
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
