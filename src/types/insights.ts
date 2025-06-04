
export interface DataSource {
  id: string;
  name: string;
  table_name: string;
  description: string;
  fields: DataField[];
  relationships: TableRelationship[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DataField {
  name: string;
  type: 'text' | 'number' | 'boolean' | 'timestamp' | 'uuid' | 'array' | 'integer';
  label: string;
  nullable?: boolean;
}

export interface TableRelationship {
  table: string;
  field: string;
  target_field: string;
  label: string;
}

export interface InsightFilter {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in' | 'is';
  value: any;
  logic?: 'AND' | 'OR';
}

export interface CalculatedField {
  name: string;
  alias: string;
  expression: string;
  type: DataField['type'];
}

export interface Aggregation {
  field: string;
  function: 'COUNT' | 'SUM' | 'AVG' | 'MIN' | 'MAX';
  alias: string;
}

export interface GroupBy {
  field: string;
  alias?: string;
}

export interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'area' | 'donut' | 'scatter' | 'bubble' | 'kpi' | 'table';
  xAxis?: string;
  yAxis?: string;
  colorField?: string;
  labels?: boolean;
  legend?: boolean;
  tooltips?: boolean;
  colors?: string[];
}

export interface InsightReport {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  data_source_id?: string;
  selected_fields: string[];
  calculated_fields: CalculatedField[];
  filters: InsightFilter[];
  group_by: GroupBy[];
  aggregations: Aggregation[];
  chart_config: ChartConfig;
  is_template: boolean;
  is_public: boolean;
  tags: string[];
  schedule_config?: any;
  alert_config?: any;
  created_at: string;
  updated_at: string;
}

export interface InsightDashboard {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  layout_config: DashboardWidget[];
  filters: InsightFilter[];
  is_public: boolean;
  tags: string[];
  refresh_interval: number;
  created_at: string;
  updated_at: string;
}

export interface DashboardWidget {
  id: string;
  dashboard_id: string;
  widget_type: 'report' | 'kpi' | 'text' | 'iframe';
  title: string;
  report_id?: string;
  config: any;
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  created_at: string;
  updated_at: string;
}

export interface ReportExecution {
  columns: string[];
  rows: any[];
  total: number;
  execution_time?: number;
}

export interface ShareConfig {
  id: string;
  resource_type: 'report' | 'dashboard';
  resource_id: string;
  shared_by: string;
  share_type: 'view' | 'edit';
  share_with_role?: string;
  share_with_user?: string;
  expires_at?: string;
  share_token: string;
  created_at: string;
}
