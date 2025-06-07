
import { Json } from '@/integrations/supabase/types';

export interface Report {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at?: string;
  updated_at?: string;
  module: string;
  base_table: string;
  selected_fields: Json;
  fields: string[];
  filters: ReportFilter[];
  aggregation?: string;
  chart_type?: 'table' | 'bar' | 'line' | 'pie';
  group_by?: string;
  is_public: boolean;
  joins?: TableJoin[];
}

export type FilterOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in' | 'is';

export interface ReportFilter {
  field: string;
  operator: FilterOperator;
  value: string | number | boolean | null | (string | number)[];
}

export interface TableInfo {
  name: string;
  fields: string[];
  description?: string;
  relations?: TableRelation[];
}

export interface TableRelation {
  referencedTable: string;
  sourceColumn: string;
  targetColumn: string;
}

export interface TableJoin {
  table: string;
  alias?: string;
  sourceColumn: string;
  targetColumn: string;
  joinType: 'inner' | 'left' | 'right';
}

export interface ReportData {
  columns: string[];
  rows: Record<string, any>[];
  total: number;
}

export interface ColumnDefinition {
  key: string;
  label: string;
  table?: string;
  sourceTable?: string;
}

export interface SavedView {
  id: string;
  name: string;
  description?: string;
  baseReport: string;
  columns: string[];
  filters: ReportFilter[];
  created_by: string;
  created_at?: string;
}

// Added to ensure ReportFilter can be used as a JSON value
export type ReportFilterJson = {
  field: string;
  operator: string;
  value: string | number | boolean | null | (string | number)[];
};

// Type for the config stored in the report_configs table
export interface ReportConfigJson {
  baseReportId: string;
  columns: string[];
  filters: ReportFilterJson[];
}

// Enhanced chart configuration interface
export interface ChartConfig {
  type: 'table' | 'bar' | 'line' | 'pie';
  xAxis?: string;
  yAxis?: string;
  aggregation?: 'count' | 'sum' | 'avg' | 'min' | 'max';
  dateGrouping?: 'day' | 'week' | 'month' | 'quarter' | 'year';
}
