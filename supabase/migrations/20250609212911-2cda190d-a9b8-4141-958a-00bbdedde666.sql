
-- Update the frontend_registry table to support more element types
ALTER TABLE public.frontend_registry 
DROP CONSTRAINT IF EXISTS frontend_registry_element_type_check;

-- Add the new constraint with expanded element types
ALTER TABLE public.frontend_registry 
ADD CONSTRAINT frontend_registry_element_type_check 
CHECK (element_type IN ('page', 'field', 'button', 'section', 'tab', 'menu'));

-- Update some existing entries to use more appropriate element types
UPDATE public.frontend_registry 
SET element_type = 'page' 
WHERE element_key IN ('dashboard', 'cases', 'notifications', 'reports', 'knowledge', 'insights', 'users_management', 'roles_management', 'permissions_management');

UPDATE public.frontend_registry 
SET element_type = 'button' 
WHERE element_key IN ('cases.create_case', 'cases.edit_case', 'cases.delete_case', 'reports.create_report', 'reports.edit_report', 'reports.delete_report', 'knowledge.create_article', 'knowledge.edit_article', 'knowledge.delete_article', 'users_management.create_user', 'users_management.edit_user', 'users_management.delete_user', 'roles_management.create_role', 'roles_management.edit_role', 'roles_management.delete_role');

UPDATE public.frontend_registry 
SET element_type = 'tab' 
WHERE element_key IN ('dashboard.calendar_view');

-- Verify the changes
SELECT element_type, COUNT(*) as count 
FROM public.frontend_registry 
GROUP BY element_type 
ORDER BY element_type;
