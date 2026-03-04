import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

type AppRole = "admin" | "staff";

interface AuthState {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  profile: { email: string; full_name: string } | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [profile, setProfile] = useState<{ email: string; full_name: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (userId: string) => {
    try {
      const [profileRes, roleRes] = await Promise.all([
        supabase.from("profiles").select("email, full_name").eq("id", userId).single(),
        supabase.from("user_roles").select("role").eq("user_id", userId).single(),
      ]);
      if (profileRes.data) setProfile(profileRes.data);
      if (roleRes.data) setRole(roleRes.data.role as AppRole);
      else setRole("staff"); // default role
    } catch {
      setRole("staff");
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          // Use setTimeout to avoid Supabase deadlock
          setTimeout(() => fetchUserData(session.user.id), 0);
        } else {
          setRole(null);
          setProfile(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        profile,
        loading,
        signIn,
        signOut,
        isAdmin: role === "admin",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
