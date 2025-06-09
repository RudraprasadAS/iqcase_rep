
-- Update the users table to properly link the auth user to the internal user record
UPDATE public.users 
SET auth_user_id = '18a5f25a-860f-42ca-ac6f-ae0247447a17'
WHERE id = 'fd04c792-16e6-4b6c-bf04-e5a881425622';
