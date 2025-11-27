import React, { createContext, useContext, useState, useEffect, PropsWithChildren } from 'react';

interface ThemeContextType {
  backgroundImage: string;
  setBackgroundImage: (url: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const DEFAULT_BG = 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2070&auto=format&fit=crop';

export const ThemeProvider = ({ children }: PropsWithChildren) => {
  const [backgroundImage, setBackgroundImage] = useState<string>(DEFAULT_BG);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('app_bg');
      if (stored) setBackgroundImage(stored);
    } catch (e) {
      console.warn('Theme: LocalStorage access denied, using default.');
    }
  }, []);

  const handleSetBackground = (url: string) => {
    setBackgroundImage(url);
    try {
      localStorage.setItem('app_bg', url);
    } catch (e) {
      console.warn('Theme: Could not save background to LocalStorage.');
    }
  };

  return (
    <ThemeContext.Provider value={{ backgroundImage, setBackgroundImage: handleSetBackground }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};