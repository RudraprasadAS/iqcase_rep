
import { useState, useEffect } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log('Checking for existing Supabase session...');
        
        // Set up auth state listener FIRST
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, currentSession) => {
            console.log('Auth state changed:', event);
            setSession(currentSession);
            setUser(currentSession?.user ?? null);
          }
        );
        
        // THEN check for existing session
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error checking session:', error);
          return;
        }
        
        if (currentSession) {
          console.log('Found existing session:', currentSession.user.id);
          setSession(currentSession);
          setUser(currentSession.user);
        } else {
          console.log('No existing session found');
          setUser(null);
          setSession(null);
        }
        
        setIsLoading(false);
        
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Session check error:', error);
        setIsLoading(false);
      }
    };
    
    checkSession();
  }, []);
  
  const login = async (email: string, password: string) => {
    try {
      console.log('Attempting login with:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('Login error:', error);
        return { user: null, session: null, error };
      }
      
      console.log('Login successful:', data.user?.id);
      
      return { user: data.user, session: data.session, error: null };
    } catch (error) {
      console.error('Login exception:', error);
      return { user: null, session: null, error: error as AuthError };
    }
  };
  
  const register = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });
      
      if (error) {
        console.error('Registration error:', error);
        return { user: null, error };
      }
      
      console.log('Registration successful:', data);
      return { user: data.user, error: null };
    } catch (error) {
      console.error('Registration exception:', error);
      return { user: null, error: error as AuthError };
    }
  };
  
  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
        throw error;
      }
      
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear the local user state even if Supabase call fails
      setUser(null);
      setSession(null);
      throw error;
    }
  };

  // Super admin login function - bypasses standard auth
  const superAdminLogin = () => {
    const fakeUser = {
      id: 'super-admin-id',
      email: 'superadmin@example.com',
      app_metadata: {
        role: 'super_admin'
      },
      user_metadata: {
        name: 'Super Admin'
      }
    } as User;

    const fakeSession = {
      user: fakeUser,
      access_token: 'fake-super-admin-token',
      refresh_token: 'fake-super-admin-refresh'
    } as Session;

    // Set the user and session state
    setUser(fakeUser);
    setSession(fakeSession);

    return { user: fakeUser, session: fakeSession, error: null };
  };
  
  return {
    user,
    session,
    login,
    logout,
    register,
    superAdminLogin,
    isAuthenticated: !!user,
    isLoading
  };
};
