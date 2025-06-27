
-- 1. Grant caseworker access to reports and dashboard
DO $$
DECLARE
  caseworker_role_id UUID;
  registry_record RECORD;
BEGIN
  -- Get caseworker role ID
  SELECT id INTO caseworker_role_id FROM public.roles WHERE name IN ('caseworker', 'case_worker') LIMIT 1;
  
  IF caseworker_role_id IS NULL THEN
    RAISE NOTICE 'Caseworker role not found';
    RETURN;
  END IF;

  -- Grant access to reports and dashboard for caseworkers
  FOR registry_record IN 
    SELECT id, element_key FROM public.frontend_registry 
    WHERE element_key IN (
      'reports',
      'reports.create_report',
      'reports.edit_report',
      'reports.view_report',
      'dashboard'
    ) AND is_active = true
  LOOP
    INSERT INTO public.permissions (role_id, frontend_registry_id, can_view, can_edit)
    VALUES (caseworker_role_id, registry_record.id, true, true)
    ON CONFLICT (role_id, frontend_registry_id) 
    DO UPDATE SET can_view = true, can_edit = true, updated_at = now();
    
    RAISE NOTICE 'Added permission for caseworker: %', registry_record.element_key;
  END LOOP;
END $$;

-- 2. Add RLS policy to reports table to enforce privacy rules
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own reports OR public reports
CREATE POLICY "Users can view own reports or public reports" 
ON public.reports 
FOR SELECT 
USING (
  created_by = get_current_internal_user_id() 
  OR is_public = true
);

-- Policy: Users can only edit their own reports
CREATE POLICY "Users can edit own reports" 
ON public.reports 
FOR UPDATE 
USING (created_by = get_current_internal_user_id());

-- Policy: Users can delete their own reports
CREATE POLICY "Users can delete own reports" 
ON public.reports 
FOR DELETE 
USING (created_by = get_current_internal_user_id());

-- Policy: Users can create reports
CREATE POLICY "Users can create reports" 
ON public.reports 
FOR INSERT 
WITH CHECK (created_by = get_current_internal_user_id());

-- 3. Add RLS policy to notifications table to ensure proper access
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own notifications
CREATE POLICY "Users can view own notifications" 
ON public.notifications 
FOR SELECT 
USING (user_id = get_current_internal_user_id());

-- Policy: Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" 
ON public.notifications 
FOR UPDATE 
USING (user_id = get_current_internal_user_id());

-- Policy: Allow system to create notifications for users
CREATE POLICY "System can create notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);
