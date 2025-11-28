
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
    const initAuth = async () => {
        if (!supabase) {
            console.warn("Supabase not configured");
            setLoading(false);
            return;
        }

        try {
            // 1. Check active session immediately on mount
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                await loadProfile(session.user.id, session.user.email);
            } else {
                setLoading(false);
            }
        } catch (error) {
            console.error("Auth check failed", error);
            setLoading(false);
        }

        // 2. Listen for future changes
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log("Supabase Auth Event:", event);
            
            if (event === 'SIGNED_IN' && session?.user) {
                // Avoid reloading if we already have the user
                if (!user || user.id !== session.user.id) {
                     await loadProfile(session.user.id, session.user.email);
                }
            }
            
            if (event === 'SIGNED_OUT') {
                setUser(null);
                setLoginStep('CREDENTIALS');
                setLoading(false);
            }
            
            if (event === 'PASSWORD_RECOVERY') {
                setIsPasswordRecovery(true);
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    };

    initAuth();
  }, []); // Run once on mount

  const loadProfile = async (uid: string, email?: string) => {
     try {
         // 1. Try to get existing profile
         let profile = await dataService.getUserById(uid);

         // 2. If no profile exists, check LocalStorage for pending registration
         if (!profile) {
             const pendingData = localStorage.getItem('pending_register_user');
             if (pendingData) {
                 const userData = JSON.parse(pendingData);
                 if (userData.email.toLowerCase() === email?.toLowerCase()) {
                     profile = await dataService.createUser({ ...userData, id: uid });
                     localStorage.removeItem('pending_register_user');
                 }
             }
         }

         if (profile) {
            // 3. Check Approval Status
            if (profile.status === 'PENDING') {
                await supabase?.auth.signOut();
                alert("Account created but pending approval by Administrator.");
                setUser(null);
            } else {
                setUser(profile);
            }
         }
     } catch (e) {
         console.error("Error loading profile:", e);
     } finally {
         setLoading(false);
     }
  };

  const login = async (email: string) => {
    if (!supabase) throw new Error("Supabase not configured");
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) throw error;
    setEmailForMfa(email);
    setLoginStep('MFA');
  };

  const loginWithPassword = async (email: string, password: string) => {
      if (!supabase) throw new Error("Supabase not configured");
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setLoading(true); // Show loading while profile fetches via onAuthStateChange
  };

  const verifyMfa = async (code: string) => {
    if (!supabase) return;
    const { error } = await supabase.auth.verifyOtp({
        email: emailForMfa,
        token: code,
        type: 'email'
    });
    if (error) throw error;
    setLoading(true);
  };

  const register = async (newUser: User) => {
    if (!supabase) throw new Error("Supabase not configured");
    localStorage.setItem('pending_register_user', JSON.stringify(newUser));
    const { error } = await supabase.auth.signInWithOtp({ 
        email: newUser.email,
        options: { emailRedirectTo: window.location.href }
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
        user, loginStep, login, loginWithPassword, verifyMfa, logout, register, loading, isPasswordRecovery, setIsPasswordRecovery
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
