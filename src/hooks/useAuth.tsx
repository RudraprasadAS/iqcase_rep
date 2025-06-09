
import { useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // If user signs in, ensure they have a record in our users table
        if (session?.user && event === 'SIGNED_IN') {
          setTimeout(async () => {
            await ensureUserRecord(session.user);
          }, 0);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        ensureUserRecord(session.user);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const ensureUserRecord = async (authUser: User) => {
    try {
      // Check if user exists in our users table
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id, name, email, role_id')
        .eq('auth_user_id', authUser.id)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking user record:', checkError);
        return;
      }

      if (!existingUser) {
        console.log('Creating user record for:', authUser.email);
        
        // Get default role (citizen for external users, admin for specific email)
        let defaultRoleQuery = supabase
          .from('roles')
          .select('id')
          .eq('name', 'citizen')
          .single();
          
        if (authUser.email === 'rudraprasad.as@gmail.com') {
          defaultRoleQuery = supabase
            .from('roles')
            .select('id')
            .eq('name', 'admin')
            .single();
        }

        const { data: role } = await defaultRoleQuery;

        if (role) {
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              auth_user_id: authUser.id,
              email: authUser.email || '',
              name: authUser.user_metadata?.name || authUser.email || 'User',
              role_id: role.id,
              user_type: authUser.email === 'rudraprasad.as@gmail.com' ? 'internal' : 'external',
              is_active: true
            });

          if (insertError) {
            console.error('Error creating user record:', insertError);
          } else {
            console.log('User record created successfully');
          }
        }
      } else {
        console.log('User record exists:', existingUser.email);
        
        // Update auth_user_id if it's missing
        if (!existingUser.auth_user_id) {
          await supabase
            .from('users')
            .update({ auth_user_id: authUser.id })
            .eq('email', authUser.email);
        }
      }
    } catch (error) {
      console.error('Error in ensureUserRecord:', error);
    }
  };

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { user: data.user, error };
  };

  const register = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`
      }
    });
    return { user: data.user, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    }
  };

  const logout = signOut; // Alias for compatibility

  return {
    user,
    session,
    loading,
    isLoading: loading, // Alias for compatibility
    signOut,
    logout,
    login,
    register,
    isAuthenticated: !!user
  };
};
