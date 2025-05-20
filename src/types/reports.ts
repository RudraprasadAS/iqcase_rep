
import type { Json } from '@/integrations/supabase/types';

export type FilterOperator = 
  | 'eq' 
  | 'neq' 
  | 'gt' 
  | 'gte' 
  | 'lt' 
  | 'lte' 
  | 'like' 
  | 'ilike' 
  | 'in' 
  | 'is' 
  | 'contains';

export interface ReportFilter {
  field: string;
  operator: FilterOperator;
  value: string | number | boolean | null | string[];
}

export interface CalculatedField {
  name: string;
  expression: string;
  description?: string;
}

export interface FieldDefinition {
  name: string;
  label: string;
  table: string;
  type: string;
}

export interface GroupByConfig {
  field: string;
}

export interface AggregationConfig {
  type: 'count' | 'sum' | 'avg' | 'min' | 'max';
  field?: string;
}

export interface VisualizationConfig {
  type: 'table' | 'bar' | 'line' | 'pie' | 'kpi';
  options?: Record<string, any>;
}

export interface ExportConfig {
  type: 'csv' | 'pdf' | 'excel';
  includeHeaders?: boolean;
}

export interface ScheduleConfig {
  frequency: 'daily' | 'weekly' | 'monthly';
  time?: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  recipients: string[];
  deliveryType: 'email' | 'webhook';
  exportFormat: 'csv' | 'pdf' | 'excel';
}

export interface Report {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  base_table: string;
  fields: string[];
  filters?: ReportFilter[];
  calculated_fields?: CalculatedField[];
  group_by?: GroupByConfig[];
  aggregation?: AggregationConfig[];
  visualization?: VisualizationConfig;
  schedule?: ScheduleConfig;
  export_config?: ExportConfig;
  template_id?: string;
  is_public?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description?: string;
  base_table: string;
  config: Omit<Report, 'id' | 'name' | 'created_by' | 'created_at' | 'updated_at'>;
  created_by: string;
  is_public: boolean;
  created_at?: string;
}

export interface ReportSchedule {
  id: string;
  report_id: string;
  user_id: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  delivery_type: 'email' | 'webhook';
  recipients: string[];
  last_sent_at?: string;
  next_run_at?: string;
}

export interface TableInfo {
  name: string;
  schema: string;
  fields: string[];
}

export interface ReportData {
  columns: string[];
  rows: Record<string, any>[];
  total: number;
}
