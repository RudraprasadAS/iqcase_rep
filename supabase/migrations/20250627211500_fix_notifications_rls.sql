
-- Fix notifications RLS to ensure proper access
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

-- Create more permissive RLS policies for notifications
-- Policy: Users can only see their own notifications
CREATE POLICY "Users can view own notifications" 
ON public.notifications 
FOR SELECT 
USING (
  user_id = get_current_internal_user_id()
);

-- Policy: Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" 
ON public.notifications 
FOR UPDATE 
USING (
  user_id = get_current_internal_user_id()
);

-- Policy: Allow system and admins to create notifications for users
CREATE POLICY "System can create notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

-- Policy: Users can delete their own notifications
CREATE POLICY "Users can delete own notifications" 
ON public.notifications 
FOR DELETE 
USING (
  user_id = get_current_internal_user_id()
);

-- Create some test notifications for caseworker to verify the system works
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
    -- Insert test notifications
    INSERT INTO public.notifications (user_id, title, message, notification_type, is_read) VALUES
    (caseworker_internal_id, 'Welcome to the System', 'Your account has been set up successfully. You can now access all case management features.', 'system', false),
    (caseworker_internal_id, 'New Case Assignment', 'You have been assigned a new case that requires your attention.', 'case_assignment', false),
    (caseworker_internal_id, 'Report Available', 'A new report has been generated and is ready for review.', 'report', false);
    
    RAISE NOTICE 'Test notifications created for caseworker user: %', caseworker_internal_id;
  ELSE
    RAISE NOTICE 'Caseworker user not found';
  END IF;
END $$;
