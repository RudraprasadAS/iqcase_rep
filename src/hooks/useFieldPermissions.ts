
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface FieldPermissionResult {
  canView: boolean;
  canEdit: boolean;
  isLoading: boolean;
  error: Error | null;
}

export const useFieldPermission = (
  moduleName: string,
  screenName: string,
  fieldName: string
): FieldPermissionResult => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['field_permission', moduleName, screenName, fieldName],
    queryFn: async () => {
      const fieldKey = `${screenName}.${fieldName}`;
      
      // Check view permission
      const { data: viewData, error: viewError } = await supabase.rpc('current_user_can_access', {
        p_module_name: moduleName,
        p_field_name: fieldKey,
        p_permission_type: 'view'
      });
      
      if (viewError) {
        console.error('Field view permission check error:', viewError);
        throw viewError;
      }
      
      // Check edit permission
      const { data: editData, error: editError } = await supabase.rpc('current_user_can_access', {
        p_module_name: moduleName,
        p_field_name: fieldKey,
        p_permission_type: 'edit'
      });
      
      if (editError) {
        console.error('Field edit permission check error:', editError);
        throw editError;
      }
      
      return {
        canView: viewData as boolean,
        canEdit: editData as boolean
      };
    },
    enabled: !!(moduleName && screenName && fieldName),
  });

  return {
    canView: data?.canView ?? false,
    canEdit: data?.canEdit ?? false,
    isLoading,
    error: error as Error | null
  };
};

// Hook to check if user can perform specific case actions based on RLS
export const useCaseAccess = (caseId: string, action: 'view' | 'edit' | 'delete') => {
  const { data: hasAccess = false, isLoading, error } = useQuery({
    queryKey: ['case_access', caseId, action],
    queryFn: async () => {
      if (!caseId) return false;
      
      // For view access, just try to fetch the case
      if (action === 'view') {
        const { data, error } = await supabase
          .from('cases')
          .select('id')
          .eq('id', caseId)
          .maybeSingle();
          
        return !error && !!data;
      }
      
      // For edit/delete, check if user is assigned to the case
      const { data, error } = await supabase
        .from('cases')
        .select('assigned_to, users!cases_assigned_to_fkey(auth_user_id)')
        .eq('id', caseId)
        .maybeSingle();
        
      if (error || !data) return false;
      
      const { data: { user } } = await supabase.auth.getUser();
      return user?.id === data.users?.auth_user_id;
    },
    enabled: !!caseId,
  });

  return {
    hasAccess,
    isLoading,
    error: error as Error | null
  };
};

// Hook to check if user can access specific case components
export const useCaseComponentAccess = (caseId: string, component: 'messages' | 'tasks' | 'notes' | 'attachments' | 'watchers' | 'feedback') => {
  const { data: hasAccess = false, isLoading, error } = useQuery({
    queryKey: ['case_component_access', caseId, component],
    queryFn: async () => {
      if (!caseId) return false;
      
      // Check if user has access to the parent case first
      const { data, error } = await supabase
        .from('cases')
        .select('id')
        .eq('id', caseId)
        .maybeSingle();
        
      return !error && !!data;
    },
    enabled: !!caseId,
  });

  return {
    hasAccess,
    isLoading,
    error: error as Error | null
  };
};
