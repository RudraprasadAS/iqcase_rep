
-- Create the frontend_registry table to track all controllable UI elements
CREATE TABLE public.frontend_registry (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module TEXT NOT NULL,
  screen TEXT NOT NULL,
  element_type TEXT NOT NULL CHECK (element_type IN ('field', 'button', 'tab', 'section', 'menu', 'action')),
  element_key TEXT NOT NULL,
  label TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(module, screen, element_key)
);

-- Drop the existing permissions table and recreate it with proper structure
DROP TABLE IF EXISTS public.permissions CASCADE;

CREATE TABLE public.permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  frontend_registry_id UUID NOT NULL REFERENCES public.frontend_registry(id) ON DELETE CASCADE,
  can_view BOOLEAN NOT NULL DEFAULT false,
  can_edit BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(role_id, frontend_registry_id)
);

-- Create indexes for better performance
CREATE INDEX idx_frontend_registry_module_screen ON public.frontend_registry(module, screen);
CREATE INDEX idx_frontend_registry_element_key ON public.frontend_registry(element_key);
CREATE INDEX idx_permissions_role_id ON public.permissions(role_id);
CREATE INDEX idx_permissions_registry_id ON public.permissions(frontend_registry_id);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_frontend_registry_updated_at BEFORE UPDATE ON public.frontend_registry
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_permissions_updated_at BEFORE UPDATE ON public.permissions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial frontend registry entries for the case management system
INSERT INTO public.frontend_registry (module, screen, element_type, element_key, label) VALUES
-- Cases Module
('Cases', 'Case List', 'button', 'create_case_btn', 'Create Case Button'),
('Cases', 'Case List', 'field', 'status_filter', 'Status Filter'),
('Cases', 'Case List', 'field', 'priority_filter', 'Priority Filter'),
('Cases', 'Case List', 'action', 'export_cases', 'Export Cases'),
('Cases', 'Case View', 'field', 'case_title', 'Case Title'),
('Cases', 'Case View', 'field', 'case_description', 'Case Description'),
('Cases', 'Case View', 'field', 'case_status', 'Case Status'),
('Cases', 'Case View', 'field', 'case_priority', 'Case Priority'),
('Cases', 'Case View', 'field', 'assigned_to', 'Assigned To'),
('Cases', 'Case View', 'button', 'edit_case_btn', 'Edit Case Button'),
('Cases', 'Case View', 'button', 'close_case_btn', 'Close Case Button'),
('Cases', 'Case View', 'section', 'case_notes', 'Case Notes Section'),
('Cases', 'Case View', 'section', 'case_messages', 'Case Messages Section'),
('Cases', 'Case View', 'section', 'case_attachments', 'Case Attachments Section'),
('Cases', 'Case Edit', 'field', 'title_field', 'Title Field'),
('Cases', 'Case Edit', 'field', 'description_field', 'Description Field'),
('Cases', 'Case Edit', 'field', 'status_field', 'Status Field'),
('Cases', 'Case Edit', 'field', 'priority_field', 'Priority Field'),
('Cases', 'Case Edit', 'field', 'assignment_field', 'Assignment Field'),

-- Dashboard Module
('Dashboard', 'Main Dashboard', 'section', 'case_stats', 'Case Statistics'),
('Dashboard', 'Main Dashboard', 'section', 'recent_cases', 'Recent Cases'),
('Dashboard', 'Main Dashboard', 'section', 'user_activity', 'User Activity'),

-- Administration Module
('Administration', 'User Management', 'button', 'create_user_btn', 'Create User Button'),
('Administration', 'User Management', 'button', 'edit_user_btn', 'Edit User Button'),
('Administration', 'User Management', 'button', 'delete_user_btn', 'Delete User Button'),
('Administration', 'Role Management', 'button', 'create_role_btn', 'Create Role Button'),
('Administration', 'Role Management', 'button', 'edit_role_btn', 'Edit Role Button'),
('Administration', 'Role Management', 'button', 'delete_role_btn', 'Delete Role Button'),
('Administration', 'Permissions', 'section', 'permission_matrix', 'Permission Matrix'),

-- Reports Module
('Reports', 'Report Builder', 'button', 'create_report_btn', 'Create Report Button'),
('Reports', 'Report Builder', 'section', 'field_selector', 'Field Selector'),
('Reports', 'Report Builder', 'section', 'filter_builder', 'Filter Builder'),
('Reports', 'Standard Reports', 'action', 'export_report', 'Export Report'),

-- Navigation Menu Items
('Navigation', 'Main Menu', 'menu', 'dashboard_menu', 'Dashboard Menu'),
('Navigation', 'Main Menu', 'menu', 'cases_menu', 'Cases Menu'),
('Navigation', 'Main Menu', 'menu', 'reports_menu', 'Reports Menu'),
('Navigation', 'Main Menu', 'menu', 'admin_menu', 'Administration Menu');

-- Create a function to check frontend permissions
CREATE OR REPLACE FUNCTION public.user_has_frontend_permission(
  p_user_id UUID,
  p_element_key TEXT,
  p_permission_type TEXT DEFAULT 'view'
) RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
DECLARE
  user_role_id UUID;
  has_permission BOOLEAN := FALSE;
BEGIN
  -- Get the user's role
  SELECT role_id INTO user_role_id
  FROM public.users
  WHERE id = p_user_id AND is_active = true;
  
  -- If no role found, return false
  IF user_role_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if the role has the specific permission for this element
  IF p_permission_type = 'view' THEN
    SELECT p.can_view INTO has_permission
    FROM public.permissions p
    JOIN public.frontend_registry fr ON p.frontend_registry_id = fr.id
    WHERE p.role_id = user_role_id
      AND fr.element_key = p_element_key
      AND fr.is_active = true;
  ELSIF p_permission_type = 'edit' THEN
    SELECT p.can_edit INTO has_permission
    FROM public.permissions p
    JOIN public.frontend_registry fr ON p.frontend_registry_id = fr.id
    WHERE p.role_id = user_role_id
      AND fr.element_key = p_element_key
      AND fr.is_active = true;
  END IF;
  
  RETURN COALESCE(has_permission, FALSE);
END;
$$;

-- Create a function for current user frontend permissions
CREATE OR REPLACE FUNCTION public.current_user_has_frontend_permission(
  p_element_key TEXT,
  p_permission_type TEXT DEFAULT 'view'
) RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
  RETURN public.user_has_frontend_permission(
    public.get_current_user_id(),
    p_element_key,
    p_permission_type
  );
END;
$$;
