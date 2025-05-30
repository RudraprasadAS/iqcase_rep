
import { useState, useEffect } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  // Check if user is super admin based on their role from database
  const isSuperAdmin = userRole === 'super_admin' || userRole === 'admin';
  
  // Fetch user role from database
  const fetchUserRole = async (userId: string) => {
    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select(`
          role_id,
          roles (
            name,
            role_type
          )
        `)
        .eq('auth_user_id', userId)
        .single();
        
      if (error) {
        console.error('Error fetching user role:', error);
        return null;
      }
      
      return userData?.roles?.name || null;
    } catch (error) {
      console.error('Exception fetching user role:', error);
      return null;
    }
  };
  
  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log('Checking for existing Supabase session...');
        
        // Set up auth state listener FIRST
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, currentSession) => {
            console.log('Auth state changed:', event);
            setSession(currentSession);
            setUser(currentSession?.user ?? null);
            
            if (currentSession?.user) {
              // Fetch user role when user logs in
              const role = await fetchUserRole(currentSession.user.id);
              setUserRole(role);
            } else {
              setUserRole(null);
            }
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
          
          // Fetch user role for existing session
          const role = await fetchUserRole(currentSession.user.id);
          setUserRole(role);
        } else {
          console.log('No existing session found');
          setUser(null);
          setSession(null);
          setUserRole(null);
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
      
      // Fetch user role after successful login
      if (data.user) {
        const role = await fetchUserRole(data.user.id);
        setUserRole(role);
      }
      
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
      setUserRole(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear the local user state even if Supabase call fails
      setUser(null);
      setSession(null);
      setUserRole(null);
      throw error;
    }
  };
  
  return {
    user,
    session,
    userRole,
    login,
    logout,
    register,
    isAuthenticated: !!user,
    isLoading,
    isSuperAdmin
  };
};
