
import { useEffect, useState, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
  logout: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ user: User | null; error: any }>;
  register: (email: string, password: string) => Promise<{ user: User | null; error: any }>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state change:', event, 'User email:', session?.user?.email);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // If user signs in, ensure they have a record in our users table
        if (session?.user && event === 'SIGNED_IN') {
          console.log('📋 User signed in, checking/creating user record...');
          setTimeout(async () => {
            await ensureUserRecord(session.user);
          }, 0);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🔍 Initial session check:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        console.log('📋 Found existing session, ensuring user record...');
        ensureUserRecord(session.user);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const ensureUserRecord = async (authUser: User) => {
    try {
      console.log('🔍 Checking user record for:', authUser.email, 'Auth ID:', authUser.id);
      
      // Check if user exists in our users table
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id, name, email, role_id, auth_user_id, user_type, roles(name, role_type)')
        .eq('auth_user_id', authUser.id)
        .maybeSingle();

      if (checkError) {
        console.error('❌ Error checking user record:', checkError);
        return;
      }

      if (!existingUser) {
        console.log('❌ No user record found, creating one for:', authUser.email);
        
        // Check if there's a user with this email but no auth_user_id
        const { data: emailUser, error: emailError } = await supabase
          .from('users')
          .select('id, email, role_id')
          .eq('email', authUser.email)
          .maybeSingle();

        if (emailUser && !emailUser.auth_user_id) {
          console.log('🔗 Found user by email, linking auth_user_id...');
          const { error: updateError } = await supabase
            .from('users')
            .update({ auth_user_id: authUser.id })
            .eq('id', emailUser.id);

          if (updateError) {
            console.error('❌ Error linking auth_user_id:', updateError);
          } else {
            console.log('✅ Successfully linked auth_user_id');
          }
          return;
        }

        // Get default role based on email
        let defaultRoleQuery = supabase
          .from('roles')
          .select('id')
          .eq('name', 'citizen')
          .single();
          
        if (authUser.email === 'superadmin@dev.com') {
          console.log('👑 Creating super admin user...');
          defaultRoleQuery = supabase
            .from('roles')
            .select('id')
            .eq('name', 'super_admin')
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
              user_type: authUser.email === 'superadmin@dev.com' ? 'internal' : 'external',
              is_active: true
            });

          if (insertError) {
            console.error('❌ Error creating user record:', insertError);
          } else {
            console.log('✅ User record created successfully');
          }
        }
      } else {
        console.log('✅ User record exists:', existingUser.email, 'Role:', existingUser.roles?.name);
        console.log('📊 User details:', {
          id: existingUser.id,
          email: existingUser.email,
          role: existingUser.roles?.name,
          user_type: existingUser.user_type,
          auth_user_id: existingUser.auth_user_id
        });
      }
    } catch (error) {
      console.error('❌ Error in ensureUserRecord:', error);
    }
  };

  const login = async (email: string, password: string) => {
    console.log('🔐 Attempting login for:', email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('❌ Login error:', error);
    } else {
      console.log('✅ Login successful for:', email);
    }
    
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
    console.log('👋 Signing out...');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('❌ Error signing out:', error);
    } else {
      console.log('✅ Signed out successfully');
    }
  };

  const logout = signOut; // Alias for compatibility

  const value = {
    user,
    session,
    loading,
    isLoading: loading,
    signOut,
    logout,
    login,
    register,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
