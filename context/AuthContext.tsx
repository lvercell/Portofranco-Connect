
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
  resendOtp: () => Promise<void>;
  logout: () => void;
  register: (user: User) => Promise<void>;
  loading: boolean;
  isPasswordRecovery: boolean; 
  setIsPasswordRecovery: (val: boolean) => void;
  setLoginStep: (step: 'CREDENTIALS' | 'MFA') => void;
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
            // 1. Check active session immediately
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                await loadProfile(session.user);
            } else {
                setLoading(false);
            }
        } catch (error) {
            console.error("Auth check failed", error);
            setLoading(false);
        }

        // 2. Listen for auth changes
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                if (!user || user.id !== session.user.id) {
                     await loadProfile(session.user);
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
  }, []);

  const loadProfile = async (sessionUser: any) => {
     try {
         const uid = sessionUser.id;
         const email = sessionUser.email;

         // 1. Try to get existing profile from public table
         let profile = await dataService.getUserById(uid);

         // 2. If NO public profile, but we have METADATA (from registration), create it now.
         // This fixes the "Magic Link does nothing" bug.
         if (!profile && sessionUser.user_metadata?.full_name) {
             const meta = sessionUser.user_metadata;
             const newUser: User = {
                 id: uid,
                 email: email,
                 name: meta.full_name,
                 phone: meta.phone || '',
                 role: meta.role || Role.STUDENT,
                 age: meta.age || 0,
                 dob: meta.dob,
                 parentName: meta.parent_name,
                 parentEmail: meta.parent_email,
                 status: 'PENDING'
             };
             // Create profile in public table
             profile = await dataService.createUser(newUser);
         }

         if (profile) {
            // 3. Check Approval Status
            if (profile.status === 'PENDING') {
                await supabase?.auth.signOut();
                alert("Account created! Waiting for Administrator approval.");
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
    const cleanEmail = email.trim().toLowerCase();
    
    const { error } = await supabase.auth.signInWithOtp({ 
        email: cleanEmail,
        options: { shouldCreateUser: false } 
    });
    
    if (error) throw error;
    setEmailForMfa(cleanEmail);
    setLoginStep('MFA');
  };

  const loginWithPassword = async (email: string, password: string) => {
      if (!supabase) throw new Error("Supabase not configured");
      const cleanEmail = email.trim().toLowerCase();
      const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
      if (error) throw error;
      setLoading(true); 
  };

  const verifyMfa = async (code: string) => {
    if (!supabase) return;
    // 'email' type covers both magic link token and numeric OTP in most Supabase configs
    const { error } = await supabase.auth.verifyOtp({
        email: emailForMfa,
        token: code,
        type: 'email'
    });
    if (error) throw error;
    setLoading(true);
  };

  const resendOtp = async () => {
      if (!supabase || !emailForMfa) return;
      const { error } = await supabase.auth.signInWithOtp({ email: emailForMfa });
      if (error) throw error;
  }

  const register = async (newUser: User) => {
    if (!supabase) throw new Error("Supabase not configured");
    const cleanEmail = newUser.email.trim().toLowerCase();

    // Store essential data in Auth Metadata so it survives the Magic Link redirect
    const { error } = await supabase.auth.signInWithOtp({ 
        email: cleanEmail,
        options: { 
            emailRedirectTo: window.location.href,
            data: {
                full_name: newUser.name,
                phone: newUser.phone,
                role: newUser.role,
                dob: newUser.dob,
                age: newUser.age,
                parent_name: newUser.parentName,
                parent_email: newUser.parentEmail
            }
        }
    });
    if (error) throw error;
    setEmailForMfa(cleanEmail);
    setLoginStep('MFA');
  };

  const logout = async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    setLoginStep('CREDENTIALS');
  };

  return (
    <AuthContext.Provider value={{ 
        user, loginStep, login, loginWithPassword, verifyMfa, resendOtp, logout, register, loading, isPasswordRecovery, setIsPasswordRecovery, setLoginStep
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
