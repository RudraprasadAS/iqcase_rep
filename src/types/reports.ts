
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
}

export interface ReportFilter {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in' | 'is';
  value: string | number | boolean | null | (string | number)[];
}

export interface TableInfo {
  name: string;
  fields: string[];
  description?: string;
}

export interface ReportData {
  columns: string[];
  rows: Record<string, any>[];
  total: number;
}
