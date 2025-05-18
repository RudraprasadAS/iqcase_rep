
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userDetails: any | null; // Full user record from users table
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userDetails, setUserDetails] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user details from users table
  const fetchUserDetails = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*, roles(*)")
        .eq("auth_user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("[AuthProvider] Error fetching user details:", error);
        return;
      }

      if (data) {
        console.log("[AuthProvider] User details:", data);
        setUserDetails(data);
      } else {
        console.log("[AuthProvider] No matching user found in users table");
      }
    } catch (error) {
      console.error("[AuthProvider] Error in fetchUserDetails:", error);
    }
  };

  // This function handles either login or signup from Google
  const handleGoogleAuth = async (session: Session | null) => {
    if (!session?.user) return;

    const { user } = session;
    
    // Check if the user already exists in the users table
    const { data: existingUser } = await supabase
      .from("users")
      .select("*")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (!existingUser) {
      // User doesn't exist yet, create a new entry in users table
      console.log("[AuthProvider] Creating new user record for Google auth user");
      
      // First, get the public role ID
      const { data: publicRole } = await supabase
        .from("roles")
        .select("id")
        .eq("name", "PublicUser")
        .maybeSingle();
        
      const roleId = publicRole?.id;
      
      if (!roleId) {
        console.error("[AuthProvider] Public role not found");
        return;
      }
      
      const { error: insertError } = await supabase
        .from("users")
        .insert({
          auth_user_id: user.id,
          name: user.user_metadata.full_name || 'New User',
          email: user.email,
          role_id: roleId,
          user_type: "public",
          is_active: true
        });

      if (insertError) {
        console.error("[AuthProvider] Error creating user record:", insertError);
      }
    }
    
    await fetchUserDetails(user.id);
  };

  useEffect(() => {
    const setupAuth = async () => {
      setIsLoading(true);
      
      // Setup auth state listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, currentSession) => {
          console.log("[AuthProvider] Auth state change event:", event);
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          
          // If we have a user, fetch their details
          if (currentSession?.user) {
            // Use setTimeout to prevent potential auth deadlock
            setTimeout(() => {
              handleGoogleAuth(currentSession);
            }, 0);
          } else {
            setUserDetails(null);
          }
        }
      );
      
      // Get initial session
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      
      // If we have a user, fetch their details
      if (initialSession?.user) {
        await handleGoogleAuth(initialSession);
      }
      
      setIsLoading(false);
      
      // Cleanup the subscription on unmount
      return () => {
        subscription.unsubscribe();
      };
    };
    
    setupAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error("[AuthProvider] Sign in error:", error);
        return { error };
      }
      
      return { error: null };
    } catch (error) {
      console.error("[AuthProvider] Sign in exception:", error);
      return { error };
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });
      
      if (error) {
        console.error("[AuthProvider] Sign up error:", error);
        return { error };
      }
      
      return { error: null };
    } catch (error) {
      console.error("[AuthProvider] Sign up exception:", error);
      return { error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
    });
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        userDetails,
        isLoading,
        signIn,
        signUp,
        signOut,
        signInWithGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
