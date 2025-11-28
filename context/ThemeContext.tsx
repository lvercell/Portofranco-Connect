

import React, { createContext, useContext, useState, useEffect, PropsWithChildren } from 'react';
import { dataService } from '../services/dataService';

interface ThemeContextType {
  backgroundImage: string;
  setBackgroundImage: (url: string) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const DEFAULT_BG = 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2070&auto=format&fit=crop';

export const ThemeProvider = ({ children }: PropsWithChildren) => {
  const [backgroundImage, setBackgroundImage] = useState<string>(DEFAULT_BG);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  useEffect(() => {
    const initTheme = async () => {
        try {
            // 1. Try to fetch Global Wallpaper from DB
            const dbBg = await dataService.getWallpaper();
            if (dbBg) {
                setBackgroundImage(dbBg);
                localStorage.setItem('app_bg', dbBg); // Sync local for faster load next time
            } else {
                // Fallback to local
                const storedBg = localStorage.getItem('app_bg');
                if (storedBg) setBackgroundImage(storedBg);
            }

            // 2. Load Dark Mode (Local Preference only)
            const storedDark = localStorage.getItem('app_dark_mode');
            if (storedDark) {
                setIsDarkMode(JSON.parse(storedDark));
            } else {
                if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                setIsDarkMode(true);
                }
            }
        } catch (e) {
            console.warn('Theme init error', e);
        }
    };
    initTheme();
  }, []);

  const handleSetBackground = async (url: string) => {
    setBackgroundImage(url);
    try {
      localStorage.setItem('app_bg', url); // Optimistic local update
      await dataService.saveWallpaper(url); // Global DB update
    } catch (e) {
      console.warn('Theme: Could not save background globally.');
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
        const newVal = !prev;
        try {
            localStorage.setItem('app_dark_mode', JSON.stringify(newVal));
        } catch(e) {}
        return newVal;
    });
  };

  return (
    <ThemeContext.Provider value={{ 
        backgroundImage, 
        setBackgroundImage: handleSetBackground,
        isDarkMode,
        toggleDarkMode 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};