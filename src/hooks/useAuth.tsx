
import { useState, useEffect } from 'react';

// Simple auth hook for demo purposes
// Will be replaced with actual Supabase auth implementation later
export const useAuth = () => {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in from localStorage (temporary)
    const checkAuth = () => {
      const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
      if (isAuthenticated) {
        // Mock user data - replace with actual user data later
        setUser({
          id: 'mock-user-id',
          email: 'user@example.com'
        });
      } else {
        setUser(null);
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = (email: string, password: string) => {
    // Mock login - will be replaced with actual auth logic
    return new Promise((resolve) => {
      setTimeout(() => {
        localStorage.setItem('isAuthenticated', 'true');
        setUser({
          id: 'mock-user-id',
          email: email
        });
        resolve(true);
      }, 1000);
    });
  };

  const logout = () => {
    // Mock logout - will be replaced with actual auth logic
    localStorage.removeItem('isAuthenticated');
    setUser(null);
  };

  return {
    user,
    isLoading,
    login,
    logout
  };
};
