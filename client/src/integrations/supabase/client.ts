
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://nytxdkvpgbvndtbvcvxz.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55dHhka3ZwZ2J2bmR0YnZjdnh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczNjk0MDQsImV4cCI6MjA2Mjk0NTQwNH0.TpmAezgRrXiLaXFLVC98wPkY3hpV8y0Ogc_EatasxTQ";

// Create custom fetch function with logging
const createLoggingFetch = (originalFetch: typeof window.fetch) => {
  return function(input: RequestInfo | URL, init?: RequestInit) {
    // Only log Supabase API calls
    if (typeof input === 'string' && input.includes('supabase')) {
      const isRolePermissionRequest = typeof input === 'string' && input.includes('/permissions');
      
      // Parse body safely based on content type
      let parsedBody: any = undefined;
      if (init?.body) {
        try {
          if (typeof init.body === 'string') {
            parsedBody = JSON.parse(init.body);
          } else if (init.body instanceof FormData) {
            parsedBody = '[FormData]';
          } else if (init.body instanceof Blob) {
            parsedBody = '[Blob]';
          } else if (init.body instanceof ArrayBuffer) {
            parsedBody = '[ArrayBuffer]';
          } else {
            parsedBody = '[Unknown Body Type]';
          }
        } catch (error) {
          parsedBody = '[Unparseable Body]';
        }
      }
      
      console.log('[Supabase Fetch]', {
        url: input,
        method: init?.method,
        headers: init?.headers,
        body: parsedBody
      });
      
      // For permissions requests, add more detailed logging
      if (isRolePermissionRequest) {
        console.log('[Permission Request Details]', {
          url: input,
          method: init?.method,
          body: parsedBody
        });
      }
      
      // Return the original fetch with timing
      const startTime = performance.now();
      return originalFetch.apply(this, [input, init])
        .then(response => {
          const duration = performance.now() - startTime;
          
          // Clone the response to read its body without consuming it
          const clonedResponse = response.clone();
          
          if (isRolePermissionRequest) {
            clonedResponse.json().then(data => {
              console.log(`[Permission Response] Status: ${response.status}, Data:`, data);
            }).catch(err => {
              console.log(`[Permission Response] Could not parse body: ${err}`);
            });
          }
          
          console.log(`[Supabase Response] Status: ${response.status}, Time: ${duration.toFixed(2)}ms`);
          return response;
        })
        .catch(error => {
          console.error('[Supabase Error]', error);
          throw error;
        });
    }
    
    // For non-Supabase calls, just use the original fetch
    return originalFetch.apply(this, [input, init]);
  };
};

// Ensure fetch is available
const fetchImpl = typeof window !== 'undefined' ? createLoggingFetch(window.fetch) : fetch;
if (typeof window !== 'undefined') {
  window.fetch = fetchImpl;
}

// Create and export the Supabase client
export const supabase = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_PUBLISHABLE_KEY,
  {
    global: {
      fetch: fetchImpl as typeof fetch
    },
    db: {
      schema: 'public'
    },
        auth: {
      persistSession: true,
      autoRefreshToken: true,
  }
}
);

// Helper function for permission operations
export const permissionsApi = {
  // Delete duplicate permissions for a role
  async cleanupDuplicatePermissions(roleId: string): Promise<void> {
    console.log(`[permissionsApi] Cleaning up duplicate permissions for role: ${roleId}`);
    try {
      const { error } = await supabase.rpc('cleanup_duplicate_permissions', {
        p_role_id: roleId
      });
      
      if (error) {
        console.error("[permissionsApi] Error cleaning up permissions:", error);
      } else {
        console.log("[permissionsApi] Successfully cleaned up duplicate permissions");
      }
    } catch (e) {
      console.error("[permissionsApi] Exception in cleanupDuplicatePermissions:", e);
    }
  },

  // Check if current user has permission
  async checkPermission(moduleName: string, fieldName?: string | null, permissionType: 'view' | 'edit' = 'view'): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('current_user_can_access', {
        p_module_name: moduleName,
        p_field_name: fieldName,
        p_permission_type: permissionType
      });
      
      if (error) {
        console.error("[permissionsApi] Error checking permission:", error);
        return false;
      }
      
      return data as boolean;
    } catch (e) {
      console.error("[permissionsApi] Exception checking permission:", e);
      return false;
    }
  }
};
