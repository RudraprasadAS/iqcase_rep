
-- Check and fix RLS policies for notifications table
-- First, let's see what policies exist and then create proper ones

-- Drop existing policies if they exist (in case they're misconfigured)
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;

-- Create proper RLS policies for notifications
-- Policy for viewing notifications - users can see their own notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (user_id IN (
  SELECT id FROM public.users WHERE auth_user_id = auth.uid()
));

-- Policy for inserting notifications - any authenticated user can create notifications for any user
-- This is important because caseworkers need to create notifications for other users
CREATE POLICY "Authenticated users can create notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Policy for updating notifications - users can update their own notifications
CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (user_id IN (
  SELECT id FROM public.users WHERE auth_user_id = auth.uid()
));

-- Policy for deleting notifications - users can delete their own notifications
CREATE POLICY "Users can delete their own notifications" 
ON public.notifications 
FOR DELETE 
USING (user_id IN (
  SELECT id FROM public.users WHERE auth_user_id = auth.uid()
));

-- Ensure RLS is enabled
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
