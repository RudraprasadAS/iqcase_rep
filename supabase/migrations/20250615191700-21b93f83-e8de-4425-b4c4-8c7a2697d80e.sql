
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Internal users can insert notifications" ON public.notifications;

-- Enable RLS on notifications table if not already enabled
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
FOR SELECT 
USING (user_id = get_current_internal_user_id());

-- Create policy to allow users to update their own notifications (for marking as read)
CREATE POLICY "Users can update their own notifications" ON public.notifications
FOR UPDATE 
USING (user_id = get_current_internal_user_id());

-- Create policy to allow users to delete their own notifications
CREATE POLICY "Users can delete their own notifications" ON public.notifications
FOR DELETE 
USING (user_id = get_current_internal_user_id());

-- Create policy to allow internal users to insert notifications (for system notifications)
CREATE POLICY "Internal users can insert notifications" ON public.notifications
FOR INSERT 
WITH CHECK (true);
