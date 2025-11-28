
import React, { createContext, useContext, useState, useEffect, PropsWithChildren } from 'react';
import { User, Role } from '../types';
import { dataService } from '../services/dataService';
import { supabase } from '../services/supabaseClient';

interface AuthContextType {
  user: User | null;
  loginStep: 'CREDENTIALS' | 'MFA';
  login: (email: string) => Promise<void>;
  loginWithPassword: (email: string, password: string) => Promise<void>;
  verifyMfa: (code: string) => Promise<void>;
  logout: () => void;
  register: (user: User) => Promise<void>;
  loading: boolean;
  isPasswordRecovery: boolean; // Flag to show reset password screen
  setIsPasswordRecovery: (val: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<User | null>(null);
  const [emailForMfa, setEmailForMfa] = useState<string>('');
  const [loginStep, setLoginStep] = useState<'CREDENTIALS' | 'MFA'>('CREDENTIALS');
  const [loading, setLoading] = useState(true);
  const [pendingRegisterUser, setPendingRegisterUser] = useState<User | null>(null);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  useEffect(() => {
    // Check active session on load
    const checkSession = async () => {
      if (!supabase) {
          setLoading(false);
          return;
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await loadProfile(session.user.id);
      }
      setLoading(false);
    };
    
    checkSession();

    // Listen for Auth changes (Magic Links, Password Reset, etc)
    const { data: authListener } = supabase?.auth.onAuthStateChange(async (event, session) => {
        console.log("Supabase Auth Event:", event);
        if (event === 'SIGNED_IN' && session?.user) {
            await loadProfile(session.user.id);
        }
        if (event === 'SIGNED_OUT') {
            setUser(null);
            setLoginStep('CREDENTIALS');
        }
        if (event === 'PASSWORD_RECOVERY') {
            setIsPasswordRecovery(true);
        }
    }) || { data: { subscription: { unsubscribe: () => {} } } };

    return () => {
        authListener.subscription.unsubscribe();
    };
  }, []);

  const loadProfile = async (uid: string) => {
     const profile = await dataService.getUserById(uid);
     if (profile) {
        if (profile.status === 'PENDING') {
            await supabase?.auth.signOut();
            throw new Error("ACCOUNT_PENDING");
        }
        setUser(profile);
     }
  };

  const login = async (email: string) => {
    if (!supabase) throw new Error("Supabase not configured");
    
    // Send OTP via Email (Magic Link)
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) throw error;

    setEmailForMfa(email);
    setLoginStep('MFA');
  };

  const loginWithPassword = async (email: string, password: string) => {
      if (!supabase) throw new Error("Supabase not configured");
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // onAuthStateChange handles the profile loading
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
    <AuthContext.Provider value={{ 
        user, 
        loginStep, 
        login, 
        loginWithPassword,
        verifyMfa, 
        logout, 
        register, 
        loading,
        isPasswordRecovery,
        setIsPasswordRecovery
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
