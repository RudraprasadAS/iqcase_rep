
-- First, let's ensure we have proper RLS policies for all related tables

-- Cases table policies
DROP POLICY IF EXISTS "Admins can view all cases" ON public.cases;
DROP POLICY IF EXISTS "Case workers can view related cases" ON public.cases;
DROP POLICY IF EXISTS "Citizens can view their own cases" ON public.cases;
DROP POLICY IF EXISTS "Internal users can view related cases" ON public.cases;

-- Enable RLS on cases table
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;

-- Super comprehensive policy for case workers
CREATE POLICY "Case workers comprehensive access" ON public.cases
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.roles r ON u.role_id = r.id
    WHERE u.auth_user_id = auth.uid()
    AND r.name = 'case_worker'
    AND u.is_active = true
    AND (
      -- Cases directly assigned to them
      u.id = cases.assigned_to
      OR
      -- Cases they submitted
      u.id = cases.submitted_by
      OR
      -- Cases where they have tasks assigned
      EXISTS (
        SELECT 1 FROM public.case_tasks ct
        WHERE ct.case_id = cases.id
        AND ct.assigned_to = u.id
      )
      OR
      -- Cases where they have sent any message (internal or external)
      EXISTS (
        SELECT 1 FROM public.case_messages cm
        WHERE cm.case_id = cases.id
        AND cm.sender_id = u.id
      )
      OR
      -- Cases where they have added notes
      EXISTS (
        SELECT 1 FROM public.case_notes cn
        WHERE cn.case_id = cases.id
        AND cn.author_id = u.id
      )
      OR
      -- Cases where they are watchers
      EXISTS (
        SELECT 1 FROM public.case_watchers cw
        WHERE cw.case_id = cases.id
        AND cw.user_id = u.id
      )
      OR
      -- Cases where they have activities logged
      EXISTS (
        SELECT 1 FROM public.case_activities ca
        WHERE ca.case_id = cases.id
        AND ca.performed_by = u.id
      )
    )
  )
);

-- Admins can see all cases
CREATE POLICY "Admins can view all cases" ON public.cases
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.roles r ON u.role_id = r.id
    WHERE u.auth_user_id = auth.uid()
    AND r.name IN ('super_admin', 'admin')
    AND u.is_active = true
  )
);

-- Citizens can see their own cases
CREATE POLICY "Citizens can view own cases" ON public.cases
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.roles r ON u.role_id = r.id
    WHERE u.auth_user_id = auth.uid()
    AND r.name = 'citizen'
    AND u.is_active = true
    AND u.id = cases.submitted_by
  )
);

-- Other internal users can see cases they're involved with
CREATE POLICY "Internal users can view involved cases" ON public.cases
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.roles r ON u.role_id = r.id
    WHERE u.auth_user_id = auth.uid()
    AND u.user_type = 'internal'
    AND r.name NOT IN ('super_admin', 'admin', 'case_worker', 'citizen')
    AND u.is_active = true
    AND (u.id = cases.submitted_by OR u.id = cases.assigned_to)
  )
);

-- Update policies for case workers
CREATE POLICY "Case workers can update related cases" ON public.cases
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.roles r ON u.role_id = r.id
    WHERE u.auth_user_id = auth.uid()
    AND r.name = 'case_worker'
    AND u.is_active = true
    AND (
      u.id = cases.assigned_to
      OR
      EXISTS (
        SELECT 1 FROM public.case_tasks ct
        WHERE ct.case_id = cases.id
        AND ct.assigned_to = u.id
      )
    )
  )
);

-- Admins can update all cases
CREATE POLICY "Admins can update all cases" ON public.cases
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.roles r ON u.role_id = r.id
    WHERE u.auth_user_id = auth.uid()
    AND r.name IN ('super_admin', 'admin')
    AND u.is_active = true
  )
);

-- Insert policies
CREATE POLICY "Admins can insert cases" ON public.cases
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.roles r ON u.role_id = r.id
    WHERE u.auth_user_id = auth.uid()
    AND r.name IN ('super_admin', 'admin')
    AND u.is_active = true
  )
);

CREATE POLICY "Citizens can insert own cases" ON public.cases
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.roles r ON u.role_id = r.id
    WHERE u.auth_user_id = auth.uid()
    AND r.name = 'citizen'
    AND u.is_active = true
    AND u.id = submitted_by
  )
);

-- Notifications table RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert notifications" ON public.notifications;

CREATE POLICY "Users can view own notifications" ON public.notifications
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.auth_user_id = auth.uid()
    AND u.id = notifications.user_id
    AND u.is_active = true
  )
);

CREATE POLICY "Users can update own notifications" ON public.notifications
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.auth_user_id = auth.uid()
    AND u.id = notifications.user_id
    AND u.is_active = true
  )
);

CREATE POLICY "System can insert notifications" ON public.notifications
FOR INSERT 
WITH CHECK (true);

-- Case messages RLS
ALTER TABLE public.case_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view case messages" ON public.case_messages;
DROP POLICY IF EXISTS "Users can insert case messages" ON public.case_messages;

CREATE POLICY "Users can view case messages for accessible cases" ON public.case_messages
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.cases c
    WHERE c.id = case_messages.case_id
    -- User can see the case (leverages existing case policies)
  )
);

CREATE POLICY "Users can insert case messages for accessible cases" ON public.case_messages
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.cases c
    WHERE c.id = case_messages.case_id
    -- User can see the case (leverages existing case policies)
  )
  AND
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.auth_user_id = auth.uid()
    AND u.id = case_messages.sender_id
    AND u.is_active = true
  )
);

-- Case tasks RLS
ALTER TABLE public.case_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view case tasks" ON public.case_tasks;
DROP POLICY IF EXISTS "Users can update case tasks" ON public.case_tasks;
DROP POLICY IF EXISTS "Users can insert case tasks" ON public.case_tasks;

CREATE POLICY "Users can view case tasks for accessible cases" ON public.case_tasks
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.cases c
    WHERE c.id = case_tasks.case_id
    -- User can see the case (leverages existing case policies)
  )
);

CREATE POLICY "Users can update own or assigned tasks" ON public.case_tasks
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.auth_user_id = auth.uid()
    AND u.is_active = true
    AND (
      u.id = case_tasks.assigned_to
      OR
      u.id = case_tasks.created_by
      OR
      EXISTS (
        SELECT 1 FROM public.roles r
        WHERE r.id = u.role_id
        AND r.name IN ('super_admin', 'admin')
      )
    )
  )
);

CREATE POLICY "Users can insert case tasks for accessible cases" ON public.case_tasks
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.cases c
    WHERE c.id = case_tasks.case_id
    -- User can see the case (leverages existing case policies)
  )
  AND
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.auth_user_id = auth.uid()
    AND u.is_active = true
    AND (
      u.id = case_tasks.created_by
      OR
      EXISTS (
        SELECT 1 FROM public.roles r
        WHERE r.id = u.role_id
        AND r.name IN ('super_admin', 'admin', 'case_worker')
      )
    )
  )
);

-- Case notes RLS
ALTER TABLE public.case_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view case notes" ON public.case_notes;
DROP POLICY IF EXISTS "Users can insert case notes" ON public.case_notes;
DROP POLICY IF EXISTS "Users can update own case notes" ON public.case_notes;

CREATE POLICY "Users can view case notes for accessible cases" ON public.case_notes
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.cases c
    WHERE c.id = case_notes.case_id
    -- User can see the case (leverages existing case policies)
  )
  AND
  (
    -- Internal notes only visible to internal users
    (case_notes.is_internal = false)
    OR
    (case_notes.is_internal = true AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_user_id = auth.uid()
      AND u.user_type = 'internal'
      AND u.is_active = true
    ))
  )
);

CREATE POLICY "Users can insert case notes for accessible cases" ON public.case_notes
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.cases c
    WHERE c.id = case_notes.case_id
    -- User can see the case (leverages existing case policies)
  )
  AND
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.auth_user_id = auth.uid()
    AND u.id = case_notes.author_id
    AND u.is_active = true
  )
);

CREATE POLICY "Users can update own case notes" ON public.case_notes
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.auth_user_id = auth.uid()
    AND u.id = case_notes.author_id
    AND u.is_active = true
  )
);
