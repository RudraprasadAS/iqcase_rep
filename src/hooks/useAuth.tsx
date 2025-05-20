
import { useState, useEffect } from 'react';

// Simple mock authentication hook for development purposes
// This should be replaced with actual authentication logic
export const useAuth = () => {
  const [user, setUser] = useState<{ id: string; email: string } | null>({
    id: '123456', // Mock user ID for testing
    email: 'test@example.com'
  });
  
  // In a real application, you would fetch the user from your auth provider
  useEffect(() => {
    // For now, we're just using a mock user
    // Later we can implement Supabase auth here
  }, []);
  
  const login = async (email: string, password: string) => {
    // Mock login function
    setUser({ id: '123456', email });
    return { user: { id: '123456', email }, session: {} };
  };
  
  const logout = async () => {
    // Mock logout function
    setUser(null);
  };
  
  return {
    user,
    login,
    logout,
    isAuthenticated: !!user
  };
};
