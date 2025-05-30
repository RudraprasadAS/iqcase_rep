
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
      console.log('Fetching user role for:', userId);
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
      
      const role = userData?.roles?.name || null;
      console.log('User role fetched:', role);
      return role;
    } catch (error) {
      console.error('Exception fetching user role:', error);
      return null;
    }
  };
  
  // Check for existing session on mount
  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...');
        
        // First, get the current session
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          if (mounted) {
            setIsLoading(false);
          }
          return;
        }
        
        console.log('Current session:', currentSession ? 'exists' : 'none');
        
        if (currentSession && mounted) {
          setSession(currentSession);
          setUser(currentSession.user);
          
          // Fetch user role for existing session
          const role = await fetchUserRole(currentSession.user.id);
          if (mounted) {
            setUserRole(role);
          }
        }
        
        if (mounted) {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('Auth state changed:', event);
        
        if (!mounted) return;
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          // Fetch user role when user logs in
          const role = await fetchUserRole(currentSession.user.id);
          if (mounted) {
            setUserRole(role);
          }
        } else {
          setUserRole(null);
        }
        
        // Make sure loading is false after auth state change
        setIsLoading(false);
      }
    );
    
    // Initialize auth
    initializeAuth();
    
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
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
      
      // Note: Role will be fetched by the auth state change listener
      
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
