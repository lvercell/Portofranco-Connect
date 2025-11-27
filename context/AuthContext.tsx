import React, { createContext, useContext, useState, useEffect, PropsWithChildren } from 'react';
import { User, Role } from '../types';
import { dataService } from '../services/dataService';
import { supabase } from '../services/supabaseClient';

interface AuthContextType {
  user: User | null;
  loginStep: 'CREDENTIALS' | 'MFA';
  login: (email: string) => Promise<void>;
  verifyMfa: (code: string) => Promise<void>;
  logout: () => void;
  register: (user: User) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<User | null>(null);
  const [emailForMfa, setEmailForMfa] = useState<string>('');
  const [loginStep, setLoginStep] = useState<'CREDENTIALS' | 'MFA'>('CREDENTIALS');
  const [loading, setLoading] = useState(true);
  const [pendingRegisterUser, setPendingRegisterUser] = useState<User | null>(null);

  useEffect(() => {
    // Check active session on load
    const checkSession = async () => {
      if (!supabase) {
          setLoading(false);
          return;
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Fetch full profile from public.users
        const profile = await dataService.getUserById(session.user.id);
        if (profile) {
            setUser(profile);
        }
      }
      setLoading(false);
    };
    
    checkSession();
  }, []);

  const login = async (email: string) => {
    if (!supabase) throw new Error("Supabase not configured");
    
    // Check if user exists in our public table first (pseudo-check)
    const existing = await dataService.getUserByEmail(email);
    if (!existing) throw new Error("User not registered. Please register first.");

    // Send OTP via Email
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) throw error;

    setEmailForMfa(email);
    setLoginStep('MFA');
  };

  const verifyMfa = async (code: string) => {
    if (!supabase) return;

    const { data, error } = await supabase.auth.verifyOtp({
        email: emailForMfa,
        token: code,
        type: 'email'
    });

    if (error) throw error;
    if (data.session?.user) {
        // If this was a registration flow, create the profile now
        if (pendingRegisterUser) {
            const newUserProfile = { ...pendingRegisterUser, id: data.session.user.id };
            await dataService.createUser(newUserProfile);
            setUser(newUserProfile);
            setPendingRegisterUser(null);
        } else {
            // Normal login
            const profile = await dataService.getUserById(data.session.user.id);
            setUser(profile);
        }
        setLoginStep('CREDENTIALS');
    }
  };

  const register = async (newUser: User) => {
    if (!supabase) throw new Error("Supabase not configured");
    
    // We start the auth flow. When they verify OTP, we create the DB record.
    const { error } = await supabase.auth.signInWithOtp({ email: newUser.email });
    if (error) throw error;

    setPendingRegisterUser(newUser);
    setEmailForMfa(newUser.email);
    setLoginStep('MFA');
  };

  const logout = async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    setLoginStep('CREDENTIALS');
  };

  return (
    <AuthContext.Provider value={{ user, loginStep, login, verifyMfa, logout, register, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};