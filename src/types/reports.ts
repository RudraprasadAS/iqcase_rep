
export interface DataSource {
  id: string;
  name: string;
  table_name: string;
  description?: string;
  fields: FieldDefinition[];
  relationships: Relationship[];
  is_active: boolean;
  created_at: string;
}

export interface FieldDefinition {
  name: string;
  type: string;
  label: string;
  nullable?: boolean;
  default_value?: string;
}

export interface Relationship {
  table: string;
  field: string;
  target_field: string;
  label: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description?: string;
  base_table: string;
  config: ReportConfig;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_public: boolean;
  is_active: boolean;
}

export interface ReportConfig {
  selected_fields: SelectedField[];
  filters: ReportFilter[];
  grouping: GroupingConfig[];
  aggregations: AggregationConfig[];
  joins: JoinConfig[];
  chart_type?: 'table' | 'bar' | 'line' | 'pie' | 'donut';
  sort_by?: SortConfig[];
  limit?: number;
}

export interface SelectedField {
  table: string;
  field: string;
  alias?: string;
  label: string;
}

export interface ReportFilter {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'like' | 'in' | 'between';
  value: string | string[];
  table?: string;
}

export interface GroupingConfig {
  field: string;
  table?: string;
}

export interface AggregationConfig {
  function: 'COUNT' | 'SUM' | 'AVG' | 'MIN' | 'MAX';
  field: string;
  alias: string;
  table?: string;
}

export interface JoinConfig {
  table: string;
  join_type: 'INNER' | 'LEFT' | 'RIGHT';
  on_field: string;
  target_field: string;
}

export interface SortConfig {
  field: string;
  direction: 'ASC' | 'DESC';
  table?: string;
}

export interface DashboardTemplate {
  id: string;
  name: string;
  description?: string;
  layout: DashboardLayout;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface DashboardLayout {
  widgets: DashboardWidget[];
  global_filters?: GlobalFilter[];
  auto_refresh?: number; // seconds
}

export interface DashboardWidget {
  id: string;
  report_id: string;
  position: WidgetPosition;
  size: WidgetSize;
  title?: string;
}

export interface WidgetPosition {
  x: number;
  y: number;
}

export interface WidgetSize {
  width: number;
  height: number;
}

export interface GlobalFilter {
  field: string;
  operator: string;
  value: string;
  applies_to: string[]; // widget IDs
}

export interface ReportResult {
  data: any[];
  total_count?: number;
  error?: string;
}
