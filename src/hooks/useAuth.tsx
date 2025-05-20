
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Simple mock authentication hook for development purposes
// This should be replaced with actual authentication logic
export const useAuth = () => {
  const [user, setUser] = useState<{ id: string; email: string } | null>({
    id: '68a999c3-6bf7-4722-a7bc-b7e16ecd8daf', // Mock UUID format user ID for testing
    email: 'test@example.com'
  });
  
  // In a real application, you would fetch the user from your auth provider
  useEffect(() => {
    // For now, we're just using a mock user
    // Later we can implement Supabase auth here
    
    // Check if there's a session
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (session) {
        setUser({
          id: session.user.id,
          email: session.user.email || 'unknown@example.com'
        });
      }
    };
    
    checkSession();
  }, []);
  
  const login = async (email: string, password: string) => {
    // Try to use actual Supabase auth
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      if (data?.user) {
        setUser({
          id: data.user.id,
          email: data.user.email || 'unknown@example.com'
        });
      }
      
      return data;
    } catch (error) {
      console.error('Login error:', error);
      
      // Fall back to mock user for development
      setUser({ 
        id: '68a999c3-6bf7-4722-a7bc-b7e16ecd8daf', 
        email 
      });
      
      return { user: { id: '68a999c3-6bf7-4722-a7bc-b7e16ecd8daf', email }, session: {} };
    }
  };
  
  const logout = async () => {
    // Try to use actual Supabase auth
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    // Always clear the local user state
    setUser(null);
  };
  
  return {
    user,
    login,
    logout,
    isAuthenticated: !!user
  };
};
