
-- Enable RLS on cases table
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;

-- Policy for case access - user can view if assigned, watcher, or has related tasks
CREATE POLICY "case_contextual_access" ON cases
FOR SELECT USING (
  auth.uid() IN (
    SELECT auth_user_id FROM users WHERE id = assigned_to
  )
  OR auth.uid() IN (
    SELECT auth_user_id FROM users u 
    JOIN case_watchers cw ON u.id = cw.user_id 
    WHERE cw.case_id = cases.id
  )
  OR auth.uid() IN (
    SELECT auth_user_id FROM users u 
    JOIN case_tasks ct ON u.id = ct.assigned_to 
    WHERE ct.case_id = cases.id
  )
  OR auth.uid() IN (
    SELECT auth_user_id FROM users u 
    JOIN case_messages cm ON u.id = cm.sender_id 
    WHERE cm.case_id = cases.id
  )
);

-- Policy for case updates - only assigned user can edit
CREATE POLICY "case_update_assigned_only" ON cases
FOR UPDATE USING (
  auth.uid() IN (
    SELECT auth_user_id FROM users WHERE id = assigned_to
  )
);

-- Enable RLS on case_messages
ALTER TABLE case_messages ENABLE ROW LEVEL SECURITY;

-- Messages access - if user has access to parent case
CREATE POLICY "messages_case_access" ON case_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM cases c
    WHERE c.id = case_messages.case_id
    AND (
      auth.uid() IN (SELECT auth_user_id FROM users WHERE id = c.assigned_to)
      OR auth.uid() IN (
        SELECT auth_user_id FROM users u 
        JOIN case_watchers cw ON u.id = cw.user_id 
        WHERE cw.case_id = c.id
      )
    )
  )
);

-- Enable RLS on case_tasks
ALTER TABLE case_tasks ENABLE ROW LEVEL SECURITY;

-- Tasks access - if assigned to task or has access to parent case
CREATE POLICY "tasks_access" ON case_tasks
FOR SELECT USING (
  auth.uid() IN (
    SELECT auth_user_id FROM users WHERE id = assigned_to
  )
  OR EXISTS (
    SELECT 1 FROM cases c
    WHERE c.id = case_tasks.case_id
    AND auth.uid() IN (SELECT auth_user_id FROM users WHERE id = c.assigned_to)
  )
);

-- Enable RLS on case_watchers
ALTER TABLE case_watchers ENABLE ROW LEVEL SECURITY;

-- Watchers access - if you're the watcher or assigned to case
CREATE POLICY "watchers_access" ON case_watchers
FOR SELECT USING (
  auth.uid() IN (
    SELECT auth_user_id FROM users WHERE id = user_id
  )
  OR EXISTS (
    SELECT 1 FROM cases c
    WHERE c.id = case_watchers.case_id
    AND auth.uid() IN (SELECT auth_user_id FROM users WHERE id = c.assigned_to)
  )
);

-- Enable RLS on case_attachments
ALTER TABLE case_attachments ENABLE ROW LEVEL SECURITY;

-- Attachments access - if user has access to parent case
CREATE POLICY "attachments_case_access" ON case_attachments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM cases c
    WHERE c.id = case_attachments.case_id
    AND (
      auth.uid() IN (SELECT auth_user_id FROM users WHERE id = c.assigned_to)
      OR auth.uid() IN (
        SELECT auth_user_id FROM users u 
        JOIN case_watchers cw ON u.id = cw.user_id 
        WHERE cw.case_id = c.id
      )
    )
  )
);

-- Enable RLS on case_notes
ALTER TABLE case_notes ENABLE ROW LEVEL SECURITY;

-- Notes access - if user has access to parent case
CREATE POLICY "notes_case_access" ON case_notes
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM cases c
    WHERE c.id = case_notes.case_id
    AND (
      auth.uid() IN (SELECT auth_user_id FROM users WHERE id = c.assigned_to)
      OR auth.uid() IN (
        SELECT auth_user_id FROM users u 
        JOIN case_watchers cw ON u.id = cw.user_id 
        WHERE cw.case_id = c.id
      )
    )
  )
);

-- Enable RLS on case_feedback
ALTER TABLE case_feedback ENABLE ROW LEVEL SECURITY;

-- Feedback access - if user has access to parent case
CREATE POLICY "feedback_case_access" ON case_feedback
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM cases c
    WHERE c.id = case_feedback.case_id
    AND (
      auth.uid() IN (SELECT auth_user_id FROM users WHERE id = c.assigned_to)
      OR auth.uid() IN (
        SELECT auth_user_id FROM users u 
        JOIN case_watchers cw ON u.id = cw.user_id 
        WHERE cw.case_id = c.id
      )
    )
  )
);
