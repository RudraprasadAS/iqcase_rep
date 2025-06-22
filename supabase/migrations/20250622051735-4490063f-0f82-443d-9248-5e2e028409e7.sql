
-- Drop all existing notification policies by name
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view notifications sent to them" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications; 
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can create notifications for any user" ON public.notifications;
DROP POLICY IF EXISTS "Authorized users can create notifications" ON public.notifications;

-- Get all existing policies on notifications table and drop them
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'notifications' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON public.notifications';
    END LOOP;
END $$;

-- Now create the new policies
CREATE POLICY "notifications_select_policy" 
  ON public.notifications 
  FOR SELECT 
  USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "notifications_update_policy" 
  ON public.notifications 
  FOR UPDATE 
  USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "notifications_delete_policy" 
  ON public.notifications 
  FOR DELETE 
  USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "notifications_insert_policy" 
  ON public.notifications 
  FOR INSERT 
  WITH CHECK (true);

-- Update the get_current_internal_user_id function to be more robust
CREATE OR REPLACE FUNCTION public.get_current_internal_user_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT u.id
  FROM public.users u 
  WHERE u.auth_user_id = auth.uid()
  AND u.is_active = true
  LIMIT 1;
$$;
