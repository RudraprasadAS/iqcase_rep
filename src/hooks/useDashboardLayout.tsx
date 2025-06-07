
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

  // Fetch saved layout
  const { data: savedLayout, isLoading } = useQuery({
    queryKey: ['dashboard-layout', user?.id, dashboardId],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('dashboard_layouts')
        .select('layout_data')
        .eq('user_id', user.id)
        .eq('dashboard_id', dashboardId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching layout:', error);
        return null;
      }
      
      return data?.layout_data as LayoutItem[] || null;
    },
    enabled: !!user?.id
  });

  // Save layout mutation
  const saveLayoutMutation = useMutation({
    mutationFn: async (layout: LayoutItem[]) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('dashboard_layouts')
        .upsert({
          user_id: user.id,
          dashboard_id: dashboardId,
          layout_data: layout
        });
      
      if (error) throw error;
      return layout;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-layout', user?.id, dashboardId] });
      toast({
        title: 'Layout saved',
        description: 'Your dashboard layout has been saved successfully'
      });
    },
    onError: (error) => {
      console.error('Error saving layout:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save layout. Please try again.'
      });
    }
  });

  const saveLayout = (layout: LayoutItem[]) => {
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
