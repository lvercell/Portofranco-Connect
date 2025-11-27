import React, { createContext, useContext, useState, PropsWithChildren } from 'react';
import { User, Role } from '../types';
import { dataService } from '../services/dataService';

interface AuthContextType {
  user: User | null;
  loginStep: 'CREDENTIALS' | 'MFA';
  login: (email: string, password?: string) => Promise<void>;
  verifyMfa: (code: string) => Promise<void>;
  logout: () => void;
  register: (user: User) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<User | null>(null);
  const [tempUser, setTempUser] = useState<User | null>(null); // Holds user during MFA
  const [loginStep, setLoginStep] = useState<'CREDENTIALS' | 'MFA'>('CREDENTIALS');

  const login = async (email: string, password?: string) => {
    const foundUser = dataService.getUserByEmail(email);
    if (foundUser) {
      // Password check for prototype
      if (foundUser.password && foundUser.password !== password) {
        throw new Error('Invalid password');
      }

      setTempUser(foundUser);
      setLoginStep('MFA');
      // Simulate sending OTP
      console.log(`[Auth Service] OTP for ${email} is 1234`); 
      // In a real app, this would trigger an API call to email provider
    } else {
      throw new Error('User not found');
    }
  };

  const verifyMfa = async (code: string) => {
    if (code === '1234' && tempUser) {
      setUser(tempUser);
      setTempUser(null);
      setLoginStep('CREDENTIALS');
    } else {
      throw new Error('Invalid OTP code');
    }
  };

  const logout = () => {
    setUser(null);
    setLoginStep('CREDENTIALS');
  };

  const register = async (newUser: User) => {
    dataService.createUser(newUser);
    // Auto-login after register for simplicity, or force login flow
    setUser(newUser);
  };

  return (
    <AuthContext.Provider value={{ user, loginStep, login, verifyMfa, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};