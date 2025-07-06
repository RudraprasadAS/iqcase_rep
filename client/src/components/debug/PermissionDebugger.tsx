
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const PermissionDebugger: React.FC = () => {
  // Get current user info
  const { data: userInfo } = useQuery({
    queryKey: ['debug-user-info'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_current_user_info');
      if (error) throw error;
      return data?.[0];
    }
  });

  // Get user's permissions
  const { data: permissions } = useQuery({
    queryKey: ['debug-permissions', userInfo?.user_id],
    queryFn: async () => {
      if (!userInfo?.user_id) return [];
      
      const { data, error } = await supabase
        .from('permissions')
        .select(`
          *,
          frontend_registry (
            element_key,
            module,
            label,
            element_type
          )
        `)
        .eq('role_id', userInfo.role_name === 'caseworker' ? 
          (await supabase.from('roles').select('id').eq('name', 'caseworker').single()).data?.id : 
          (await supabase.from('roles').select('id').eq('name', userInfo.role_name).single()).data?.id
        );
      
      if (error) throw error;
      return data;
    },
    enabled: !!userInfo
  });

  // Get frontend registry
  const { data: registry } = useQuery({
    queryKey: ['debug-registry'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('frontend_registry')
        .select('*')
        .eq('is_active', true)
        .order('module');
      
      if (error) throw error;
      return data;
    }
  });

  if (!userInfo) {
    return (
      <Card className="m-4">
        <CardHeader>
          <CardTitle>Permission Debugger</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading user info...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="m-4">
      <CardHeader>
        <CardTitle>Permission Debugger</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold">Current User:</h3>
          <p>Role: <Badge>{userInfo.role_name}</Badge></p>
          <p>User Type: <Badge variant="outline">{userInfo.user_type}</Badge></p>
          <p>User ID: {userInfo.user_id}</p>
        </div>

        <div>
          <h3 className="font-semibold">User Permissions ({permissions?.length || 0}):</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {permissions?.map((perm) => (
              <div key={perm.id} className="border p-2 rounded text-sm">
                <p><strong>{perm.frontend_registry?.element_key}</strong> ({perm.frontend_registry?.label})</p>
                <div className="flex gap-2">
                  <Badge variant={perm.can_view ? "default" : "secondary"}>
                    View: {perm.can_view ? "✓" : "✗"}
                  </Badge>
                  <Badge variant={perm.can_edit ? "default" : "secondary"}>
                    Edit: {perm.can_edit ? "✓" : "✗"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-semibold">Available Registry Elements ({registry?.length || 0}):</h3>
          <div className="space-y-1 max-h-40 overflow-y-auto text-sm">
            {registry?.map((reg) => (
              <div key={reg.id} className="flex justify-between border p-1 rounded">
                <span>{reg.element_key} ({reg.label})</span>
                <Badge variant="outline">{reg.module}</Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
