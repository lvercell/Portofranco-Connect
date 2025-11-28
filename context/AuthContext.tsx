
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
  isPasswordRecovery: boolean; 
  setIsPasswordRecovery: (val: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<User | null>(null);
  const [emailForMfa, setEmailForMfa] = useState<string>('');
  const [loginStep, setLoginStep] = useState<'CREDENTIALS' | 'MFA'>('CREDENTIALS');
  const [loading, setLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  useEffect(() => {
    // Listen for Auth changes (Magic Links, Password Reset, etc)
    const { data: authListener } = supabase?.auth.onAuthStateChange(async (event, session) => {
        console.log("Supabase Auth Event:", event);
        
        if (event === 'SIGNED_IN' && session?.user) {
            await loadProfile(session.user.id, session.user.email);
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

  const loadProfile = async (uid: string, email?: string) => {
     try {
         // 1. Try to get existing profile
         let profile = await dataService.getUserById(uid);

         // 2. If no profile exists, check if we have pending registration data in LocalStorage
         // This handles the "Magic Link clicked in new tab" scenario
         if (!profile) {
             const pendingData = localStorage.getItem('pending_register_user');
             if (pendingData) {
                 const userData = JSON.parse(pendingData);
                 // Security check: ensure email matches
                 if (userData.email.toLowerCase() === email?.toLowerCase()) {
                     profile = await dataService.createUser({ ...userData, id: uid });
                     localStorage.removeItem('pending_register_user'); // cleanup
                 }
             }
         }

         if (profile) {
            // 3. Security Check: Is Account Approved?
            if (profile.status === 'PENDING') {
                await supabase?.auth.signOut();
                alert("Account created but pending approval by Administrator.");
                setUser(null);
                return;
            }
            setUser(profile);
         }
     } catch (e) {
         console.error("Error loading profile:", e);
     } finally {
         setLoading(false);
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
    // session is created, onAuthStateChange will trigger loadProfile
  };

  const register = async (newUser: User) => {
    if (!supabase) throw new Error("Supabase not configured");
    
    // SAVE TO LOCAL STORAGE to persist across tabs if they click Magic Link
    localStorage.setItem('pending_register_user', JSON.stringify(newUser));

    // We start the auth flow. When they verify OTP, we create the DB record.
    const { error } = await supabase.auth.signInWithOtp({ 
        email: newUser.email,
        options: {
            // Force redirection to current URL to trigger detection
            emailRedirectTo: window.location.href 
        }
    });
    
    if (error) throw error;

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
