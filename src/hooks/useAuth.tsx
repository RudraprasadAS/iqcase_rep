
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useAuth = () => {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  
  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      console.log('Checking for existing Supabase session...');
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error checking session:', error);
        return;
      }
      
      if (session) {
        console.log('Found existing session:', session.user.id);
        setUser({
          id: session.user.id,
          email: session.user.email || 'unknown@example.com'
        });
      } else {
        console.log('No existing session found, using mock user for development');
        // Mock user for development when no session exists
        setUser({ 
          id: '68a999c3-6bf7-4722-a7bc-b7e16ecd8daf',
          email: 'test@example.com'
        });
      }
    };
    
    checkSession();
    
    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event);
        if (session) {
          setUser({
            id: session.user.id,
            email: session.user.email || 'unknown@example.com'
          });
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );
    
    return () => {
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
        // For development, fall back to mock user
        setUser({ 
          id: '68a999c3-6bf7-4722-a7bc-b7e16ecd8daf', 
          email 
        });
        return { user: { id: '68a999c3-6bf7-4722-a7bc-b7e16ecd8daf', email }, session: {} };
      }
      
      console.log('Login successful:', data.user?.id);
      if (data?.user) {
        setUser({
          id: data.user.id,
          email: data.user.email || 'unknown@example.com'
        });
      }
      
      return data;
    } catch (error) {
      console.error('Login exception:', error);
      
      // Fall back to mock user for development
      setUser({ 
        id: '68a999c3-6bf7-4722-a7bc-b7e16ecd8daf', 
        email 
      });
      
      return { user: { id: '68a999c3-6bf7-4722-a7bc-b7e16ecd8daf', email }, session: {} };
    }
  };
  
  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear the local user state even if Supabase call fails
      setUser(null);
    }
  };
  
  return {
    user,
    login,
    logout,
    isAuthenticated: !!user
  };
};
