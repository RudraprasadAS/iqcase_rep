
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Report, TableInfo, ReportFilter } from "@/types/reports";
import { useToast } from "@/hooks/use-toast";

export const useReports = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: reports, isLoading: reportsLoading } = useQuery({
    queryKey: ["reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching reports:", error);
        throw new Error(`Error fetching reports: ${error.message}`);
      }

      return data.map(report => ({
        ...report,
        selected_fields: report.selected_fields as string[],
        filters: (report.filters || []) as ReportFilter[]
      })) as Report[];
    },
  });

  const { data: tables, isLoading: tablesLoading } = useQuery({
    queryKey: ["tables_info"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_tables_info");

      if (error) {
        console.error("Error fetching tables info:", error);
        throw new Error(`Error fetching tables info: ${error.message}`);
      }

      return data as TableInfo[];
    },
  });

  const createReport = useMutation({
    mutationFn: async (newReport: Omit<Report, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("reports")
        .insert({
          name: newReport.name,
          description: newReport.description,
          created_by: newReport.created_by,
          module: newReport.module,
          selected_fields: newReport.selected_fields,
          filters: newReport.filters,
          group_by: newReport.group_by,
          aggregation: newReport.aggregation,
          chart_type: newReport.chart_type,
          is_public: newReport.is_public
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating report:", error);
        throw new Error(`Error creating report: ${error.message}`);
      }

      return {
        ...data,
        selected_fields: data.selected_fields as string[],
        filters: (data.filters || []) as ReportFilter[]
      } as Report;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast({
        title: "Report created",
        description: "Your new report has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating report",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateReport = useMutation({
    mutationFn: async (updatedReport: Partial<Report> & { id: string }) => {
      const { data, error } = await supabase
        .from("reports")
        .update({
          name: updatedReport.name,
          description: updatedReport.description,
          module: updatedReport.module,
          selected_fields: updatedReport.selected_fields,
          filters: updatedReport.filters,
          group_by: updatedReport.group_by,
          aggregation: updatedReport.aggregation,
          chart_type: updatedReport.chart_type,
          is_public: updatedReport.is_public
        })
        .eq("id", updatedReport.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating report:", error);
        throw new Error(`Error updating report: ${error.message}`);
      }

      return {
        ...data,
        selected_fields: data.selected_fields as string[],
        filters: (data.filters || []) as ReportFilter[]
      } as Report;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast({
        title: "Report updated",
        description: "Your report has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating report",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteReport = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("reports")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting report:", error);
        throw new Error(`Error deleting report: ${error.message}`);
      }

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast({
        title: "Report deleted",
        description: "The report has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting report",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const executeReport = async (report: Report) => {
    try {
      let query = supabase.from(report.module).select(report.selected_fields.join(','));

      // Apply filters
      if (report.filters && report.filters.length > 0) {
        report.filters.forEach((filter: ReportFilter) => {
          switch (filter.operator) {
            case 'eq':
              query = query.eq(filter.field, filter.value);
              break;
            case 'neq':
              query = query.neq(filter.field, filter.value);
              break;
            case 'gt':
              query = query.gt(filter.field, filter.value);
              break;
            case 'gte':
              query = query.gte(filter.field, filter.value);
              break;
            case 'lt':
              query = query.lt(filter.field, filter.value);
              break;
            case 'lte':
              query = query.lte(filter.field, filter.value);
              break;
            case 'like':
              query = query.like(filter.field, `%${filter.value}%`);
              break;
            case 'ilike':
              query = query.ilike(filter.field, `%${filter.value}%`);
              break;
            case 'in':
              if (Array.isArray(filter.value)) {
                query = query.in(filter.field, filter.value);
              }
              break;
            default:
              break;
          }
        });
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error executing report:", error);
        throw new Error(`Error executing report: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error("Error executing report:", error);
      throw error;
    }
  };

  return {
    reports,
    tables,
    isLoading: reportsLoading || tablesLoading,
    createReport,
    updateReport,
    deleteReport,
    executeReport,
  };
};
