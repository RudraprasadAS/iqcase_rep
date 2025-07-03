-- Fix notifications for caseworker - create some test notifications
DO $$
DECLARE
  caseworker_internal_id UUID;
BEGIN
  -- Get the caseworker's internal user ID
  SELECT id INTO caseworker_internal_id 
  FROM public.users 
  WHERE email = 'caseworker@dev.com' 
  LIMIT 1;
  
  IF caseworker_internal_id IS NOT NULL THEN
    -- Delete old test notifications to avoid duplicates
    DELETE FROM public.notifications 
    WHERE user_id = caseworker_internal_id 
    AND title IN ('Welcome to the System', 'New Case Assignment', 'Report Available');
    
    -- Insert fresh test notifications for caseworker
    INSERT INTO public.notifications (user_id, title, message, notification_type, is_read) VALUES
    (caseworker_internal_id, 'Welcome to the System', 'Your account has been set up successfully. You can now access all case management features.', 'system', false),
    (caseworker_internal_id, 'New Case Assignment', 'You have been assigned a new case that requires your attention.', 'case_assignment', false),
    (caseworker_internal_id, 'Report Available', 'A new report has been generated and is ready for review.', 'report', false),
    (caseworker_internal_id, 'System Update', 'The system has been updated with new features. Check them out!', 'system', false);
    
    RAISE NOTICE 'Test notifications created for caseworker user: %', caseworker_internal_id;
  ELSE
    RAISE NOTICE 'Caseworker user not found';
  END IF;
END $$;

-- Also ensure RLS policies are working correctly
-- Fix case_feedback RLS to allow external users to insert/update their feedback
DROP POLICY IF EXISTS "External users can submit feedback" ON public.case_feedback;
DROP POLICY IF EXISTS "External users can update feedback" ON public.case_feedback;

-- Allow external users to insert their own feedback
CREATE POLICY "External users can submit feedback" 
ON public.case_feedback 
FOR INSERT 
WITH CHECK (
  submitted_by = get_current_internal_user_id()
  AND EXISTS (
    SELECT 1 FROM cases 
    WHERE id = case_feedback.case_id 
    AND submitted_by = get_current_internal_user_id()
    AND status IN ('closed', 'resolved')
  )
);

-- Allow external users to update their own feedback
CREATE POLICY "External users can update feedback" 
ON public.case_feedback 
FOR UPDATE 
USING (
  submitted_by = get_current_internal_user_id()
  AND EXISTS (
    SELECT 1 FROM cases 
    WHERE id = case_feedback.case_id 
    AND submitted_by = get_current_internal_user_id()
    AND status IN ('closed', 'resolved')
  )
);