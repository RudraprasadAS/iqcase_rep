
-- Let's first check what's happening by creating a debug function
CREATE OR REPLACE FUNCTION debug_notification_access(notification_id uuid)
RETURNS TABLE(
  notification_exists boolean,
  notification_user_id uuid,
  current_auth_uid uuid,
  current_internal_user_id uuid,
  user_match boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXISTS(SELECT 1 FROM notifications WHERE id = notification_id),
    (SELECT user_id FROM notifications WHERE id = notification_id),
    auth.uid(),
    (SELECT u.id FROM users u WHERE u.auth_user_id = auth.uid() LIMIT 1),
    EXISTS(
      SELECT 1 FROM notifications n 
      JOIN users u ON n.user_id = u.id 
      WHERE n.id = notification_id AND u.auth_user_id = auth.uid()
    );
END;
$$;

-- Drop existing policies completely
DROP POLICY IF EXISTS "notifications_select_policy" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_policy" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete_policy" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_policy" ON public.notifications;

-- Create simpler, more permissive policies for testing
CREATE POLICY "notifications_select_simple" 
  ON public.notifications 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = notifications.user_id 
      AND u.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "notifications_update_simple" 
  ON public.notifications 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = notifications.user_id 
      AND u.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "notifications_delete_simple" 
  ON public.notifications 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = notifications.user_id 
      AND u.auth_user_id = auth.uid()
    )
  );

-- For insert, allow authenticated users to create notifications for any user
-- This is needed for system operations
CREATE POLICY "notifications_insert_simple" 
  ON public.notifications 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Make sure RLS is enabled
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
