
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

    // Define the frontend elements
    const registryElements = [
      // Cases module
      { element_key: 'cases', module: 'cases', screen: 'cases_list', element_type: 'page', label: 'Cases Page' },
      { element_key: 'cases.create_case', module: 'cases', screen: 'cases_list', element_type: 'button', label: 'Create Case Button' },
      { element_key: 'cases.export_cases', module: 'cases', screen: 'cases_list', element_type: 'button', label: 'Export Cases Button' },
      { element_key: 'cases.view_all_cases', module: 'cases', screen: 'cases_list', element_type: 'feature', label: 'View All Cases' },
      { element_key: 'cases.assign_cases', module: 'cases', screen: 'case_detail', element_type: 'feature', label: 'Assign Cases' },
      
      // Case Detail module
      { element_key: 'case_detail', module: 'cases', screen: 'case_detail', element_type: 'page', label: 'Case Detail Page' },
      { element_key: 'case_detail.edit_case', module: 'cases', screen: 'case_detail', element_type: 'button', label: 'Edit Case Button' },
      { element_key: 'case_detail.close_case', module: 'cases', screen: 'case_detail', element_type: 'button', label: 'Close Case Button' },
      { element_key: 'case_detail.add_notes', module: 'cases', screen: 'case_detail', element_type: 'feature', label: 'Add Case Notes' },
      { element_key: 'case_detail.view_internal_notes', module: 'cases', screen: 'case_detail', element_type: 'feature', label: 'View Internal Notes' },
      { element_key: 'case_detail.manage_tasks', module: 'cases', screen: 'case_detail', element_type: 'feature', label: 'Manage Case Tasks' },
      
      // Users module
      { element_key: 'users', module: 'users', screen: 'users_list', element_type: 'page', label: 'Users Management Page' },
      { element_key: 'users.create_user', module: 'users', screen: 'users_list', element_type: 'button', label: 'Create User Button' },
      { element_key: 'users.edit_user', module: 'users', screen: 'users_list', element_type: 'button', label: 'Edit User Button' },
      
      // Roles module
      { element_key: 'roles', module: 'roles', screen: 'roles_list', element_type: 'page', label: 'Roles Management Page' },
      
      // Permissions module
      { element_key: 'permissions', module: 'permissions', screen: 'permissions_list', element_type: 'page', label: 'Permissions Management Page' },
      
      // Reports module
      { element_key: 'reports', module: 'reports', screen: 'reports_list', element_type: 'page', label: 'Reports Page' },
      { element_key: 'reports.create_report', module: 'reports', screen: 'reports_list', element_type: 'button', label: 'Create Report Button' },
      
      // Dashboard module
      { element_key: 'dashboard', module: 'dashboard', screen: 'main_dashboard', element_type: 'page', label: 'Dashboard Page' },
      
      // Notifications module
      { element_key: 'notifications', module: 'notifications', screen: 'notifications_list', element_type: 'page', label: 'Notifications Page' },
      
      // Citizen portal pages
      { element_key: 'citizen_dashboard', module: 'citizen', screen: 'citizen_dashboard', element_type: 'page', label: 'Citizen Dashboard' },
      { element_key: 'citizen_cases', module: 'citizen', screen: 'citizen_cases', element_type: 'page', label: 'Citizen Cases Page' },
      { element_key: 'citizen_notifications', module: 'citizen', screen: 'citizen_notifications', element_type: 'page', label: 'Citizen Notifications' },
      { element_key: 'citizen_knowledge', module: 'citizen', screen: 'citizen_knowledge', element_type: 'page', label: 'Citizen Knowledge Base' }
    ];

    // Insert all elements
    const { error: insertError } = await supabase
      .from('frontend_registry')
      .insert(registryElements);

    if (insertError) {
      console.error("[Frontend Registry] Error inserting elements:", insertError);
      throw insertError;
    }

    console.log("[Frontend Registry] Successfully initialized with", registryElements.length, "elements");

    // Now set up basic permissions for case workers
    await setupCaseWorkerPermissions();

  } catch (error) {
    console.error("[Frontend Registry] Initialization failed:", error);
    throw error;
  }
};

const setupCaseWorkerPermissions = async () => {
  console.log("[Frontend Registry] Setting up case worker permissions...");
  
  try {
    // Get case worker role
    const { data: caseWorkerRole, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'case_worker')
      .single();

    if (roleError || !caseWorkerRole) {
      console.error("[Frontend Registry] Case worker role not found:", roleError);
      return;
    }

    // Get relevant frontend registry elements for case workers
    const { data: registryElements, error: registryError } = await supabase
      .from('frontend_registry')
      .select('id, element_key')
      .in('element_key', [
        'cases',
        'case_detail',
        'case_detail.add_notes',
        'case_detail.view_internal_notes',
        'case_detail.manage_tasks',
        'dashboard',
        'notifications'
      ]);

    if (registryError || !registryElements) {
      console.error("[Frontend Registry] Error fetching registry elements:", registryError);
      return;
    }

    // Create permissions for case workers
    const permissions = registryElements.map(element => ({
      role_id: caseWorkerRole.id,
      frontend_registry_id: element.id,
      can_view: true,
      can_edit: ['case_detail.add_notes', 'case_detail.manage_tasks'].includes(element.element_key)
    }));

    // Check if permissions already exist
    const { data: existingPermissions, error: existingError } = await supabase
      .from('permissions')
      .select('frontend_registry_id')
      .eq('role_id', caseWorkerRole.id);

    if (existingError) {
      console.error("[Frontend Registry] Error checking existing permissions:", existingError);
      return;
    }

    // Filter out permissions that already exist
    const existingRegistryIds = new Set(existingPermissions?.map(p => p.frontend_registry_id) || []);
    const newPermissions = permissions.filter(p => !existingRegistryIds.has(p.frontend_registry_id));

    if (newPermissions.length > 0) {
      const { error: permissionError } = await supabase
        .from('permissions')
        .insert(newPermissions);

      if (permissionError) {
        console.error("[Frontend Registry] Error setting case worker permissions:", permissionError);
        return;
      }

      console.log("[Frontend Registry] Case worker permissions set successfully for", newPermissions.length, "elements");
    } else {
      console.log("[Frontend Registry] Case worker permissions already exist, skipping");
    }

  } catch (error) {
    console.error("[Frontend Registry] Error setting up case worker permissions:", error);
  }
};
