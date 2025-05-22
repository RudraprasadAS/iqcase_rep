
import { useState, useEffect } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  // Special handling for system admin authentication
  const isSuperAdmin = user?.email === 'admin@system.com';
  
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
      
      // Check if this is the super admin login
      if (email === 'admin@system.com' && password === 'Admin123!') {
        console.log('Super admin login detected');
        
        // First try to sign up if not exists
        let { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              is_super_admin: true,
              name: 'System Administrator',
            }
          }
        });
        
        // If there's an error (likely user already exists), try to sign in
        if (signUpError) {
          console.log('Super admin already exists or error in signup. Trying login...');
        }
        
        // Now perform sign in
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (error) {
          console.error('Super admin login error:', error);
          return { user: null, session: null, error };
        }
        
        console.log('Super admin login successful:', data.user?.id);
        return { user: data.user, session: data.session, error: null };
      }
      
      // Regular user login
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
  
  return {
    user,
    session,
    login,
    logout,
    register,
    isAuthenticated: !!user || isSuperAdmin,
    isLoading,
    isSuperAdmin
  };
};
