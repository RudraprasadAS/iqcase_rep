
import { Json } from '@/integrations/supabase/types';

export interface DataField {
  name: string;
  type: 'text' | 'number' | 'integer' | 'boolean' | 'timestamp' | 'uuid' | 'array';
  label: string;
  nullable?: boolean;
}

export interface DataSourceRelationship {
  table: string;
  field: string;
  target_field: string;
  label: string;
}

export interface DataSource {
  id: string;
  name: string;
  table_name: string;
  description?: string;
  fields: DataField[];
  relationships: DataSourceRelationship[];
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface InsightFilter {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in';
  value: string | number | boolean | null;
  logic?: 'AND' | 'OR';
}

export interface GroupBy {
  field: string;
  alias?: string;
}

export interface Aggregation {
  field: string;
  function: 'count' | 'sum' | 'avg' | 'min' | 'max';
  alias: string;
}

export interface ChartConfig {
  type: 'table' | 'bar' | 'line' | 'pie' | 'area' | 'donut' | 'scatter' | 'kpi';
  xAxis?: string;
  yAxis?: string;
  labels?: boolean;
  legend?: boolean;
  tooltips?: boolean;
}

export interface InsightReport {
  id: string;
  name: string;
  description?: string;
  data_source_id: string;
  selected_fields: string[];
  calculated_fields: Json;
  filters: InsightFilter[];
  group_by: GroupBy[];
  aggregations: Aggregation[];
  chart_config: ChartConfig;
  is_template: boolean;
  is_public: boolean;
  tags: string[];
  created_by: string;
  created_at?: string;
  updated_at?: string;
}

export interface InsightDashboard {
  id: string;
  name: string;
  description?: string;
  layout_config: Json;
  filters: InsightFilter[];
  refresh_interval: number;
  is_public: boolean;
  tags: string[];
  created_by: string;
  created_at?: string;
  updated_at?: string;
}

export interface DashboardWidget {
  id: string;
  dashboard_id: string;
  report_id?: string;
  title: string;
  widget_type: string;
  config: Json;
  position: Json;
  created_at?: string;
  updated_at?: string;
}

export interface ReportExecution {
  columns: string[];
  rows: Record<string, any>[];
  total: number;
}
