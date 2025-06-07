
export interface Report {
  id: string;
  name: string;
  description?: string;
  table_name: string;
  selected_fields: string[];
  filters: ReportFilter[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ReportFilter {
  field: string;
  operator: 'eq' | 'like' | 'gt' | 'lt' | 'gte' | 'lte';
  value: string;
}

export interface TableInfo {
  table_name: string;
  column_names: string[];
}

export interface ReportData {
  data: Record<string, any>[];
  error?: string;
}

// Add missing types for backward compatibility
export interface ColumnDefinition {
  name: string;
  type: string;
  label: string;
}

export type FilterOperator = 'eq' | 'like' | 'gt' | 'lt' | 'gte' | 'lte';
