
export interface Role {
  id: string;
  name: string;
  description: string | null;
  is_system: boolean;
  role_type: string | null;
  created_at: string | null;
  updated_at: string | null;
  is_active?: boolean | null;
}
