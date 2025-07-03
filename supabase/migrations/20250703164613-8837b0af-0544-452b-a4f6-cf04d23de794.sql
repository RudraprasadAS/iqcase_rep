-- Add cases.case_detail to frontend registry and grant permission to caseworker
INSERT INTO frontend_registry (element_key, module, screen, element_type, label, is_active)
VALUES ('cases.case_detail', 'cases', 'case_detail', 'page', 'Case Detail Page Access', true)
ON CONFLICT (element_key) DO NOTHING;

-- Get the caseworker role ID and the new frontend registry entry
DO $$
DECLARE
    caseworker_role_id UUID;
    registry_id UUID;
BEGIN
    -- Get caseworker role ID
    SELECT id INTO caseworker_role_id FROM roles WHERE name = 'caseworker';
    
    -- Get the frontend registry ID for cases.case_detail
    SELECT id INTO registry_id FROM frontend_registry WHERE element_key = 'cases.case_detail';
    
    -- Insert permission for caseworker to access case detail page
    INSERT INTO permissions (role_id, frontend_registry_id, can_view, can_edit)
    VALUES (caseworker_role_id, registry_id, true, true)
    ON CONFLICT (role_id, frontend_registry_id) DO UPDATE SET
        can_view = true,
        can_edit = true;
END $$;