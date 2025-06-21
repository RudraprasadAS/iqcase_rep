
-- Drop existing notification policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Internal users can create notifications" ON public.notifications;

-- Create new comprehensive notification policies for all roles
CREATE POLICY "Users can view notifications sent to them" 
  ON public.notifications 
  FOR SELECT 
  USING (
    user_id = get_current_internal_user_id()
  );

CREATE POLICY "Users can update their own notifications" 
  ON public.notifications 
  FOR UPDATE 
  USING (
    user_id = get_current_internal_user_id()
  );

CREATE POLICY "Users can delete their own notifications" 
  ON public.notifications 
  FOR DELETE 
  USING (
    user_id = get_current_internal_user_id()
  );

CREATE POLICY "System can create notifications for any user" 
  ON public.notifications 
  FOR INSERT 
  WITH CHECK (true);
