import React, { PropsWithChildren } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { SUPPORTED_LANGUAGES, Language } from '../types';

export const Layout = ({ children }: PropsWithChildren) => {
  const { language, setLanguage, t } = useLanguage();
  const { user, logout } = useAuth();
  const { backgroundImage, isDarkMode, toggleDarkMode } = useTheme();

  return (
    <div className={`${isDarkMode ? 'dark' : ''} min-h-screen font-sans selection:bg-indigo-100 selection:text-indigo-800`}>
        <div 
        className="min-h-screen bg-cover bg-center bg-fixed transition-all duration-500"
        style={{ backgroundImage: `url(${backgroundImage})` }}
        >
        <div className="min-h-screen bg-white/90 dark:bg-gray-900/90 backdrop-blur-[2px] transition-colors duration-300">
            {/* Development Banner (Floating) */}
            <div className="fixed bottom-6 right-6 z-[9999] bg-yellow-400 text-yellow-900 text-xs font-bold font-mono px-4 py-2 rounded-full shadow-2xl uppercase tracking-wider border-2 border-yellow-200 print:hidden animate-pulse hover:animate-none hover:scale-105 transition-transform cursor-default select-none flex items-center gap-2">
               <span>🛠️</span> {t('devMode')}
            </div>

            <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 print:hidden shadow-sm transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo(0, 0); }} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <div className="bg-indigo-600 text-white p-1.5 rounded-lg font-bold text-lg shadow-sm">DC</div>
                    <span className="font-bold text-xl tracking-tight text-gray-800 dark:text-gray-100 hidden sm:block">Doposcuola Connect</span>
                </a>
                
                <div className="flex items-center space-x-3 md:space-x-4">
                    
                    {/* Dark Mode Toggle */}
                    <button 
                        onClick={toggleDarkMode}
                        className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-yellow-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        title="Toggle Dark Mode"
                    >
                        {isDarkMode ? '🌙' : '☀️'}
                    </button>

                    {user && (
                    <button 
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
                        className="flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                    >
                        <span>🏠</span> <span className="hidden sm:inline">Home</span>
                    </button>
                    )}

                    <select 
                    value={language} 
                    onChange={(e) => setLanguage(e.target.value as Language)}
                    className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-200 text-sm rounded-lg border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-700 focus:ring-0 py-1.5 px-3 font-medium transition-colors cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                    {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
                        <option key={code} value={code}>{name}</option>
                    ))}
                    </select>

                    {user && (
                    <div className="flex items-center gap-4 pl-4 border-l border-gray-200 dark:border-gray-700">
                        <div className="hidden md:flex flex-col items-end">
                        <span className="text-sm font-bold text-gray-800 dark:text-gray-200 leading-none">{user.name}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">{t(user.role.toLowerCase())}</span>
                        </div>
                        <button 
                        onClick={logout}
                        className="bg-gray-100 dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 text-gray-600 dark:text-gray-400 p-2 rounded-lg transition-colors"
                        title={t('logout')}
                        >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                        </button>
                    </div>
                    )}
                </div>
                </div>
            </div>
            </nav>
            
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 print:p-0">
            {children}
            </main>
        </div>
        </div>
    </div>
  );
};