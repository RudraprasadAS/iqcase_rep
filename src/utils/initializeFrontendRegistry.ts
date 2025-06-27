
import { supabase } from "@/integrations/supabase/client";

export const initializeFrontendRegistry = async () => {
  console.log("[Frontend Registry] Starting initialization...");
  
  try {
    // Check if registry is already populated
    const { data: existingElements, error: checkError } = await supabase
      .from('frontend_registry')
      .select('id')
      .limit(1);

    if (checkError) {
      console.error("[Frontend Registry] Error checking existing elements:", checkError);
      throw checkError;
    }

    if (existingElements && existingElements.length > 0) {
      console.log("[Frontend Registry] Registry already populated, skipping initialization");
      return;
    }

    // Define the frontend elements - FIXED MAPPINGS
    const registryElements = [
      // Main navigation pages
      { element_key: 'dashboard', module: 'dashboard', screen: 'main_dashboard', element_type: 'page', label: 'Dashboard' },
      { element_key: 'cases', module: 'cases', screen: 'cases_list', element_type: 'page', label: 'Cases' },
      { element_key: 'notifications', module: 'notifications', screen: 'notifications_list', element_type: 'page', label: 'Notifications' },
      { element_key: 'reports', module: 'reports', screen: 'reports_list', element_type: 'page', label: 'Reports' },
      { element_key: 'knowledge', module: 'knowledge', screen: 'knowledge_list', element_type: 'page', label: 'Knowledge Base' },
      { element_key: 'insights', module: 'insights', screen: 'insights_list', element_type: 'page', label: 'Insights' },
      
      // Admin pages - CORRECTED ELEMENT KEYS
      { element_key: 'users_management', module: 'users_management', screen: 'users_list', element_type: 'page', label: 'Users Management' },
      { element_key: 'permissions_management', module: 'permissions_management', screen: 'permissions_list', element_type: 'page', label: 'Permissions Management' },
      { element_key: 'roles_management', module: 'roles_management', screen: 'roles_list', element_type: 'page', label: 'Roles Management' },
      
      // Cases module features
      { element_key: 'cases.create_case', module: 'cases', screen: 'cases_list', element_type: 'button', label: 'Create Case Button' },
      { element_key: 'cases.export_cases', module: 'cases', screen: 'cases_list', element_type: 'button', label: 'Export Cases Button' },
      { element_key: 'cases.view_all_cases', module: 'cases', screen: 'cases_list', element_type: 'feature', label: 'View All Cases' },
      { element_key: 'cases.assign_cases', module: 'cases', screen: 'case_detail', element_type: 'feature', label: 'Assign Cases' },
      
      // Case Detail module
      { element_key: 'case_detail', module: 'cases', screen: 'case_detail', element_type: 'page', label: 'Case Detail' },
      { element_key: 'case_detail.edit_case', module: 'cases', screen: 'case_detail', element_type: 'button', label: 'Edit Case Button' },
      { element_key: 'case_detail.close_case', module: 'cases', screen: 'case_detail', element_type: 'button', label: 'Close Case Button' },
      { element_key: 'case_detail.add_notes', module: 'cases', screen: 'case_detail', element_type: 'feature', label: 'Add Case Notes' },
      { element_key: 'case_detail.view_internal_notes', module: 'cases', screen: 'case_detail', element_type: 'feature', label: 'View Internal Notes' },
      { element_key: 'case_detail.manage_tasks', module: 'cases', screen: 'case_detail', element_type: 'feature', label: 'Manage Case Tasks' },
      
      // Users management features
      { element_key: 'users_management.create_user', module: 'users_management', screen: 'users_list', element_type: 'button', label: 'Create User Button' },
      { element_key: 'users_management.edit_user', module: 'users_management', screen: 'users_list', element_type: 'button', label: 'Edit User Button' },
      { element_key: 'users_management.delete_user', module: 'users_management', screen: 'users_list', element_type: 'button', label: 'Delete User Button' },
      
      // Roles management features
      { element_key: 'roles_management.create_role', module: 'roles_management', screen: 'roles_list', element_type: 'button', label: 'Create Role Button' },
      { element_key: 'roles_management.edit_role', module: 'roles_management', screen: 'roles_list', element_type: 'button', label: 'Edit Role Button' },
      { element_key: 'roles_management.delete_role', module: 'roles_management', screen: 'roles_list', element_type: 'button', label: 'Delete Role Button' },
      
      // Permissions management features
      { element_key: 'permissions_management.edit_permissions', module: 'permissions_management', screen: 'permissions_list', element_type: 'feature', label: 'Edit Permissions' },
      { element_key: 'permissions_management.save_permissions', module: 'permissions_management', screen: 'permissions_list', element_type: 'button', label: 'Save Permissions Button' },
      
      // Reports module features
      { element_key: 'reports.create_report', module: 'reports', screen: 'reports_list', element_type: 'button', label: 'Create Report Button' },
      { element_key: 'reports.export_report', module: 'reports', screen: 'reports_list', element_type: 'button', label: 'Export Report Button' },
      
      // Citizen portal pages
      { element_key: 'citizen_dashboard', module: 'citizen', screen: 'citizen_dashboard', element_type: 'page', label: 'Citizen Dashboard' },
      { element_key: 'citizen_cases', module: 'citizen', screen: 'citizen_cases', element_type: 'page', label: 'Citizen Cases' },
      { element_key: 'citizen_notifications', module: 'citizen', screen: 'citizen_notifications', element_type: 'page', label: 'Citizen Notifications' },
      { element_key: 'citizen_knowledge', module: 'citizen', screen: 'citizen_knowledge', element_type: 'page', label: 'Citizen Knowledge Base' }
    ];

    console.log("[Frontend Registry] Inserting", registryElements.length, "elements");

    // Insert all elements
    const { error: insertError } = await supabase
      .from('frontend_registry')
      .insert(registryElements);

    if (insertError) {
      console.error("[Frontend Registry] Error inserting elements:", insertError);
      throw insertError;
    }

    console.log("[Frontend Registry] Successfully initialized with", registryElements.length, "elements");

    // Now set up basic permissions for default roles
    await setupDefaultRolePermissions();

  } catch (error) {
    console.error("[Frontend Registry] Initialization failed:", error);
    throw error;
  }
};

const setupDefaultRolePermissions = async () => {
  console.log("[Frontend Registry] Setting up default role permissions...");
  
  try {
    // Get all roles
    const { data: roles, error: roleError } = await supabase
      .from('roles')
      .select('id, name');

    if (roleError || !roles) {
      console.error("[Frontend Registry] Error fetching roles:", roleError);
      return;
    }

    // Get all frontend registry elements
    const { data: registryElements, error: registryError } = await supabase
      .from('frontend_registry')
      .select('id, element_key, module');

    if (registryError || !registryElements) {
      console.error("[Frontend Registry] Error fetching registry elements:", registryError);
      return;
    }

    // Define default permissions for each role
    const rolePermissions: Record<string, { view: string[], edit: string[] }> = {
      'caseworker': {
        view: ['dashboard', 'cases', 'case_detail', 'notifications'],
        edit: ['case_detail.add_notes', 'case_detail.manage_tasks']
      },
      'case_worker': {
        view: ['dashboard', 'cases', 'case_detail', 'notifications'],
        edit: ['case_detail.add_notes', 'case_detail.manage_tasks']
      },
      'admin': {
        view: ['dashboard', 'cases', 'case_detail', 'notifications', 'reports', 'users_management', 'permissions_management', 'roles_management'],
        edit: ['cases.create_case', 'cases.export_cases', 'case_detail.edit_case', 'case_detail.close_case', 'case_detail.add_notes', 'case_detail.manage_tasks', 'users_management.create_user', 'users_management.edit_user', 'roles_management.create_role', 'roles_management.edit_role', 'permissions_management.edit_permissions']
      },
      'citizen': {
        view: ['citizen_dashboard', 'citizen_cases', 'citizen_notifications', 'citizen_knowledge'],
        edit: []
      }
    };

    const permissionsToInsert: any[] = [];

    // Create permissions for each role
    for (const role of roles) {
      const defaultPerms = rolePermissions[role.name];
      if (!defaultPerms) continue;

      for (const element of registryElements) {
        const canView = defaultPerms.view.includes(element.element_key);
        const canEdit = defaultPerms.edit.includes(element.element_key);

        // Only create permissions if there's at least view access
        if (canView || canEdit) {
          permissionsToInsert.push({
            role_id: role.id,
            frontend_registry_id: element.id,
            can_view: canView,
            can_edit: canEdit
          });
        }
      }
    }

    // Check if permissions already exist
    const { data: existingPermissions, error: existingError } = await supabase
      .from('permissions')
      .select('role_id, frontend_registry_id');

    if (existingError) {
      console.error("[Frontend Registry] Error checking existing permissions:", existingError);
      return;
    }

    // Filter out permissions that already exist
    const existingKeys = new Set(
      existingPermissions?.map(p => `${p.role_id}-${p.frontend_registry_id}`) || []
    );
    
    const newPermissions = permissionsToInsert.filter(p => 
      !existingKeys.has(`${p.role_id}-${p.frontend_registry_id}`)
    );

    if (newPermissions.length > 0) {
      const { error: permissionError } = await supabase
        .from('permissions')
        .insert(newPermissions);

      if (permissionError) {
        console.error("[Frontend Registry] Error setting default permissions:", permissionError);
        return;
      }

      console.log("[Frontend Registry] Default permissions set successfully for", newPermissions.length, "elements");
    } else {
      console.log("[Frontend Registry] Default permissions already exist, skipping");
    }

  } catch (error) {
    console.error("[Frontend Registry] Error setting up default permissions:", error);
  }
};
