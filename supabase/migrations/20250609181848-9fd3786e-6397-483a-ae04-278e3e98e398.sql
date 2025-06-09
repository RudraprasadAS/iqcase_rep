
-- First, let's ensure we have the correct roles structure
INSERT INTO roles (name, description, is_system, role_type) 
VALUES 
  ('admin', 'Can do everything - full system access', true, 'internal'),
  ('manager', 'Can see and edit all cases and team activity', false, 'internal'),
  ('caseworker', 'Can manage only their own cases and related tasks', false, 'internal'),
  ('viewer', 'Read-only access to assigned or related cases', false, 'internal'),
  ('citizen', 'Can only access their own cases and submit feedback', true, 'external')
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  is_system = EXCLUDED.is_system,
  role_type = EXCLUDED.role_type;

-- Create comprehensive RLS policies for cases table
DROP POLICY IF EXISTS "Case access policy" ON cases;
CREATE POLICY "Case access policy" ON cases
FOR ALL USING (
  -- Admins and managers can see everything
  EXISTS (
    SELECT 1 FROM users u 
    JOIN roles r ON u.role_id = r.id 
    WHERE u.auth_user_id = auth.uid() 
    AND r.name IN ('admin', 'manager')
  )
  OR
  -- Caseworkers can see cases assigned to them or where they're watchers
  (
    EXISTS (
      SELECT 1 FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE u.auth_user_id = auth.uid() 
      AND r.name = 'caseworker'
    )
    AND (
      assigned_to = (SELECT id FROM users WHERE auth_user_id = auth.uid())
      OR EXISTS (
        SELECT 1 FROM case_watchers cw 
        WHERE cw.case_id = cases.id 
        AND cw.user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
      )
    )
  )
  OR
  -- Viewers can see cases they're assigned to or watching (same as caseworkers but read-only)
  (
    EXISTS (
      SELECT 1 FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE u.auth_user_id = auth.uid() 
      AND r.name = 'viewer'
    )
    AND (
      assigned_to = (SELECT id FROM users WHERE auth_user_id = auth.uid())
      OR EXISTS (
        SELECT 1 FROM case_watchers cw 
        WHERE cw.case_id = cases.id 
        AND cw.user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
      )
    )
  )
  OR
  -- Citizens can only see their own cases
  (
    EXISTS (
      SELECT 1 FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE u.auth_user_id = auth.uid() 
      AND r.name = 'citizen'
    )
    AND submitted_by = (SELECT id FROM users WHERE auth_user_id = auth.uid())
  )
);

-- Create function to check user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT r.name 
  FROM users u 
  JOIN roles r ON u.role_id = r.id 
  WHERE u.auth_user_id = auth.uid()
  LIMIT 1;
$$;

-- Create function to check if user can edit records
CREATE OR REPLACE FUNCTION can_edit_case()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users u 
    JOIN roles r ON u.role_id = r.id 
    WHERE u.auth_user_id = auth.uid() 
    AND r.name IN ('admin', 'manager', 'caseworker')
  );
$$;

-- Set up permissions for default modules according to your spec
DELETE FROM permissions WHERE role_id IN (
  SELECT id FROM roles WHERE name IN ('admin', 'manager', 'caseworker', 'viewer', 'citizen')
);

-- Admin permissions (full access to everything)
INSERT INTO permissions (role_id, module_name, field_name, can_view, can_edit)
SELECT r.id, module, field, true, true
FROM roles r,
(VALUES 
  ('dashboard', NULL),
  ('cases', NULL),
  ('cases', 'case_id'),
  ('cases', 'status'),
  ('cases', 'assigned_to'),
  ('cases', 'internal_notes'),
  ('tasks', NULL),
  ('attachments', NULL),
  ('notes', NULL),
  ('watchers', NULL),
  ('messages', NULL),
  ('feedback', NULL)
) AS modules(module, field)
WHERE r.name = 'admin';

-- Manager permissions (full access except some field restrictions)
INSERT INTO permissions (role_id, module_name, field_name, can_view, can_edit)
SELECT r.id, module, field, true, 
  CASE 
    WHEN field = 'internal_notes' THEN false -- read-only
    ELSE true 
  END
FROM roles r,
(VALUES 
  ('dashboard', NULL),
  ('cases', NULL),
  ('cases', 'case_id'),
  ('cases', 'status'),
  ('cases', 'assigned_to'),
  ('cases', 'internal_notes'),
  ('tasks', NULL),
  ('attachments', NULL),
  ('notes', NULL),
  ('watchers', NULL),
  ('messages', NULL),
  ('feedback', NULL)
) AS modules(module, field)
WHERE r.name = 'manager';

-- Caseworker permissions (conditional edit access)
INSERT INTO permissions (role_id, module_name, field_name, can_view, can_edit)
SELECT r.id, module, field, true,
  CASE 
    WHEN field IN ('case_id', 'assigned_to') THEN false -- read-only
    WHEN field = 'internal_notes' THEN false -- no access
    WHEN module = 'watchers' THEN false -- limited access
    ELSE true 
  END
FROM roles r,
(VALUES 
  ('dashboard', NULL),
  ('cases', NULL),
  ('cases', 'case_id'),
  ('cases', 'status'),
  ('cases', 'assigned_to'),
  ('tasks', NULL),
  ('attachments', NULL),
  ('notes', NULL),
  ('watchers', NULL),
  ('messages', NULL),
  ('feedback', NULL)
) AS modules(module, field)
WHERE r.name = 'caseworker';

-- Viewer permissions (read-only access)
INSERT INTO permissions (role_id, module_name, field_name, can_view, can_edit)
SELECT r.id, module, field, 
  CASE 
    WHEN field = 'internal_notes' THEN false -- no access
    WHEN module IN ('tasks', 'attachments', 'notes', 'watchers', 'messages') THEN false -- no access to these modules
    ELSE true 
  END,
  false -- no edit access for viewers
FROM roles r,
(VALUES 
  ('cases', NULL),
  ('cases', 'case_id'),
  ('cases', 'status'),
  ('cases', 'assigned_to'),
  ('cases', 'internal_notes'),
  ('tasks', NULL),
  ('attachments', NULL),
  ('notes', NULL),
  ('watchers', NULL),
  ('messages', NULL),
  ('feedback', NULL)
) AS modules(module, field)
WHERE r.name = 'viewer';

-- Citizen permissions (very limited access)
INSERT INTO permissions (role_id, module_name, field_name, can_view, can_edit)
SELECT r.id, module, field, 
  CASE 
    WHEN module IN ('dashboard', 'tasks', 'attachments', 'notes', 'watchers', 'messages') THEN false -- no access
    WHEN field IN ('status', 'assigned_to', 'internal_notes') THEN false -- no access to these fields
    ELSE true 
  END,
  false -- no edit access for citizens
FROM roles r,
(VALUES 
  ('dashboard', NULL),
  ('cases', NULL),
  ('cases', 'case_id'),
  ('cases', 'status'),
  ('cases', 'assigned_to'),
  ('cases', 'internal_notes'),
  ('tasks', NULL),
  ('attachments', NULL),
  ('notes', NULL),
  ('watchers', NULL),
  ('messages', NULL),
  ('feedback', NULL)
) AS modules(module, field)
WHERE r.name = 'citizen';

-- Update the specific user to have admin role
UPDATE users 
SET role_id = (SELECT id FROM roles WHERE name = 'admin')
WHERE email = 'rudraprasad.as@gmail.com';

-- Create comprehensive RLS policies for related tables
-- Case watchers
DROP POLICY IF EXISTS "Watcher access policy" ON case_watchers;
CREATE POLICY "Watcher access policy" ON case_watchers
FOR ALL USING (
  -- Admins and managers can see everything
  get_user_role() IN ('admin', 'manager')
  OR
  -- Users can see watchers for cases they have access to
  EXISTS (
    SELECT 1 FROM cases c 
    WHERE c.id = case_watchers.case_id
    AND (
      c.assigned_to = (SELECT id FROM users WHERE auth_user_id = auth.uid())
      OR c.submitted_by = (SELECT id FROM users WHERE auth_user_id = auth.uid())
      OR EXISTS (
        SELECT 1 FROM case_watchers cw2 
        WHERE cw2.case_id = c.id 
        AND cw2.user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
      )
    )
  )
);

-- Case messages
DROP POLICY IF EXISTS "Message access policy" ON case_messages;
CREATE POLICY "Message access policy" ON case_messages
FOR ALL USING (
  -- Admins and managers can see everything
  get_user_role() IN ('admin', 'manager')
  OR
  -- Users can see messages for cases they have access to
  EXISTS (
    SELECT 1 FROM cases c 
    WHERE c.id = case_messages.case_id
    AND (
      c.assigned_to = (SELECT id FROM users WHERE auth_user_id = auth.uid())
      OR c.submitted_by = (SELECT id FROM users WHERE auth_user_id = auth.uid())
      OR EXISTS (
        SELECT 1 FROM case_watchers cw 
        WHERE cw.case_id = c.id 
        AND cw.user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
      )
    )
  )
);

-- Case notes
DROP POLICY IF EXISTS "Note access policy" ON case_notes;
CREATE POLICY "Note access policy" ON case_notes
FOR ALL USING (
  -- Admins and managers can see everything
  get_user_role() IN ('admin', 'manager')
  OR
  -- Internal notes are restricted
  (
    NOT is_internal 
    AND EXISTS (
      SELECT 1 FROM cases c 
      WHERE c.id = case_notes.case_id
      AND (
        c.assigned_to = (SELECT id FROM users WHERE auth_user_id = auth.uid())
        OR c.submitted_by = (SELECT id FROM users WHERE auth_user_id = auth.uid())
        OR EXISTS (
          SELECT 1 FROM case_watchers cw 
          WHERE cw.case_id = c.id 
          AND cw.user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
        )
      )
    )
  )
  OR
  -- Caseworkers can see internal notes for their cases
  (
    get_user_role() = 'caseworker'
    AND EXISTS (
      SELECT 1 FROM cases c 
      WHERE c.id = case_notes.case_id
      AND (
        c.assigned_to = (SELECT id FROM users WHERE auth_user_id = auth.uid())
        OR EXISTS (
          SELECT 1 FROM case_watchers cw 
          WHERE cw.case_id = c.id 
          AND cw.user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
        )
      )
    )
  )
);
