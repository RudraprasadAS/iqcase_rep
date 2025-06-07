
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import type { DashboardTemplate } from '@/types/reports';

export const useDashboards = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch dashboard templates
  const { data: dashboards, isLoading: isLoadingDashboards } = useQuery({
    queryKey: ['dashboardTemplates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dashboard_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DashboardTemplate[];
    }
  });

  // Create dashboard
  const createDashboard = useMutation({
    mutationFn: async (dashboardData: Omit<DashboardTemplate, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
      if (!user) throw new Error('User not authenticated');

      const userRecord = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (userRecord.error) throw userRecord.error;

      const { data, error } = await supabase
        .from('dashboard_templates')
        .insert({
          ...dashboardData,
          created_by: userRecord.data.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboardTemplates'] });
      toast({
        title: 'Success',
        description: 'Dashboard created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create dashboard: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Update dashboard
  const updateDashboard = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DashboardTemplate> & { id: string }) => {
      const { data, error } = await supabase
        .from('dashboard_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboardTemplates'] });
      toast({
        title: 'Success',
        description: 'Dashboard updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update dashboard: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Delete dashboard
  const deleteDashboard = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('dashboard_templates')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboardTemplates'] });
      toast({
        title: 'Success',
        description: 'Dashboard deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete dashboard: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  return {
    dashboards,
    isLoadingDashboards,
    createDashboard,
    updateDashboard,
    deleteDashboard,
  };
};
