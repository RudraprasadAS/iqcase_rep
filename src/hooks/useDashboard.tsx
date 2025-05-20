
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dashboard, DashboardWidget } from "@/types/reports";
import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

export const useDashboard = (dashboardId?: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [currentDashboardId, setCurrentDashboardId] = useState<string | undefined>(dashboardId);

  const { data: dashboards, isLoading: dashboardsLoading } = useQuery({
    queryKey: ["dashboards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dashboards")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching dashboards:", error);
        throw new Error(`Error fetching dashboards: ${error.message}`);
      }

      return data as Dashboard[];
    },
  });

  const { data: currentDashboard, isLoading: currentDashboardLoading } = useQuery({
    queryKey: ["dashboard", currentDashboardId],
    queryFn: async () => {
      if (!currentDashboardId) return null;

      const { data, error } = await supabase
        .from("dashboards")
        .select("*")
        .eq("id", currentDashboardId)
        .single();

      if (error) {
        console.error("Error fetching dashboard:", error);
        throw new Error(`Error fetching dashboard: ${error.message}`);
      }

      return data as Dashboard;
    },
    enabled: !!currentDashboardId,
  });

  const { data: widgets, isLoading: widgetsLoading } = useQuery({
    queryKey: ["dashboard_widgets", currentDashboardId],
    queryFn: async () => {
      if (!currentDashboardId) return [];

      const { data, error } = await supabase
        .from("dashboard_widgets")
        .select(`
          *,
          report:reports(*)
        `)
        .eq("dashboard_id", currentDashboardId);

      if (error) {
        console.error("Error fetching dashboard widgets:", error);
        throw new Error(`Error fetching dashboard widgets: ${error.message}`);
      }

      return data.map(widget => ({
        ...widget,
        position: widget.position as { x: number; y: number; w: number; h: number },
        report: widget.report ? {
          ...widget.report,
          selected_fields: widget.report.selected_fields as string[],
          filters: (widget.report.filters || []) as any[]
        } : undefined
      })) as DashboardWidget[];
    },
    enabled: !!currentDashboardId,
  });

  const createDashboard = useMutation({
    mutationFn: async (newDashboard: Omit<Dashboard, "id" | "user_id" | "created_at" | "updated_at">) => {
      // Get the current user
      const { data: authData } = await supabase.auth.getUser();
      
      if (!authData?.user) {
        throw new Error("User must be authenticated to create a dashboard");
      }
      
      const { data, error } = await supabase
        .from("dashboards")
        .insert({
          ...newDashboard,
          user_id: authData.user.id
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating dashboard:", error);
        throw new Error(`Error creating dashboard: ${error.message}`);
      }

      return data as Dashboard;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["dashboards"] });
      toast({
        title: "Dashboard created",
        description: "Your new dashboard has been created successfully.",
      });
      setCurrentDashboardId(data.id);
    },
    onError: (error) => {
      toast({
        title: "Error creating dashboard",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateDashboard = useMutation({
    mutationFn: async (updatedDashboard: Partial<Dashboard> & { id: string }) => {
      const { data, error } = await supabase
        .from("dashboards")
        .update(updatedDashboard)
        .eq("id", updatedDashboard.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating dashboard:", error);
        throw new Error(`Error updating dashboard: ${error.message}`);
      }

      return data as Dashboard;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboards"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", currentDashboardId] });
      toast({
        title: "Dashboard updated",
        description: "Your dashboard has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating dashboard",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteDashboard = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("dashboards")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting dashboard:", error);
        throw new Error(`Error deleting dashboard: ${error.message}`);
      }

      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.invalidateQueries({ queryKey: ["dashboards"] });
      if (currentDashboardId === deletedId) {
        setCurrentDashboardId(undefined);
      }
      toast({
        title: "Dashboard deleted",
        description: "The dashboard has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting dashboard",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addWidget = useMutation({
    mutationFn: async (widget: Omit<DashboardWidget, "id" | "created_at" | "updated_at" | "report">) => {
      const { data, error } = await supabase
        .from("dashboard_widgets")
        .insert(widget)
        .select()
        .single();

      if (error) {
        console.error("Error adding widget:", error);
        throw new Error(`Error adding widget: ${error.message}`);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard_widgets", currentDashboardId] });
      toast({
        title: "Widget added",
        description: "The widget has been added to your dashboard.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error adding widget",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateWidget = useMutation({
    mutationFn: async (widget: Partial<DashboardWidget> & { id: string }) => {
      const { data, error } = await supabase
        .from("dashboard_widgets")
        .update(widget)
        .eq("id", widget.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating widget:", error);
        throw new Error(`Error updating widget: ${error.message}`);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard_widgets", currentDashboardId] });
      toast({
        title: "Widget updated",
        description: "The widget has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating widget",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteWidget = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("dashboard_widgets")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting widget:", error);
        throw new Error(`Error deleting widget: ${error.message}`);
      }

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard_widgets", currentDashboardId] });
      toast({
        title: "Widget deleted",
        description: "The widget has been removed from your dashboard.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting widget",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const selectDashboard = useCallback((id: string) => {
    setCurrentDashboardId(id);
  }, []);

  return {
    dashboards,
    currentDashboard,
    widgets,
    isLoading: dashboardsLoading || currentDashboardLoading || widgetsLoading,
    createDashboard,
    updateDashboard,
    deleteDashboard,
    addWidget,
    updateWidget,
    deleteWidget,
    selectDashboard,
    currentDashboardId,
  };
};
