
import { Json } from "@/integrations/supabase/types";

export type ChartType = "table" | "bar" | "line" | "pie";
export type AggregationType = "count" | "sum" | "avg" | "min" | "max";

export interface ReportFilter {
  field: string;
  operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "like" | "ilike" | "in";
  value: string | number | boolean | (string | number | boolean)[];
}

export interface Report {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  module: string;
  selected_fields: string[];
  filters: ReportFilter[];
  group_by: string | null;
  aggregation: AggregationType | null;
  chart_type: ChartType;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface Dashboard {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  layout_config: Json;
  created_at: string;
  updated_at: string;
}

export interface DashboardWidget {
  id: string;
  dashboard_id: string;
  report_id: string;
  chart_type: ChartType | null;
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  refresh_rate: number | null;
  created_at: string;
  updated_at: string;
  report?: Report;
}

export interface TableInfo {
  name: string;
  schema: string;
  fields: string[];
}
