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
        {/* Development Banner (Strictly Fixed) */}
        <div className="fixed bottom-4 right-4 z-[99999] pointer-events-none print:hidden">
            <div className="bg-yellow-400/90 backdrop-blur text-yellow-900 text-[10px] font-bold font-mono px-3 py-1.5 rounded-full shadow-lg border border-yellow-500/30 uppercase tracking-wider animate-pulse flex items-center gap-1.5 pointer-events-auto select-none hover:scale-105 transition-transform cursor-default">
                <span>🛠️</span> {t('devMode')}
            </div>
        </div>

        <div 
        className="min-h-screen bg-cover bg-center bg-fixed transition-all duration-500 flex flex-col"
        style={{ backgroundImage: `url(${backgroundImage})` }}
        >
        <div className="min-h-screen bg-white/90 dark:bg-gray-900/90 backdrop-blur-[2px] transition-colors duration-300 flex flex-col">
            
            <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 print:hidden shadow-sm transition-colors duration-300 shrink-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-14">
                <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo(0, 0); }} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <div className="bg-indigo-600 text-white p-1 rounded-lg font-bold text-lg shadow-sm">DC</div>
                    <span className="font-bold text-lg tracking-tight text-gray-800 dark:text-gray-100 hidden sm:block">Doposcuola Connect</span>
                </a>
                
                <div className="flex items-center space-x-3 md:space-x-4">
                    
                    {/* Dark Mode Toggle */}
                    <button 
                        onClick={toggleDarkMode}
                        className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-yellow-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        title="Toggle Dark Mode"
                    >
                        {isDarkMode ? '🌙' : '☀️'}
                    </button>

                    {user && (
                    <button 
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
                        className="flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-lg text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                    >
                        <span>🏠</span> <span className="hidden sm:inline">Home</span>
                    </button>
                    )}

                    <select 
                    value={language} 
                    onChange={(e) => setLanguage(e.target.value as Language)}
                    className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-200 text-xs rounded-lg border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-700 focus:ring-0 py-1 px-2 font-medium transition-colors cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                    {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
                        <option key={code} value={code}>{name}</option>
                    ))}
                    </select>

                    {user && (
                    <div className="flex items-center gap-3 pl-3 border-l border-gray-200 dark:border-gray-700">
                        <div className="hidden md:flex flex-col items-end">
                        <span className="text-xs font-bold text-gray-800 dark:text-gray-200 leading-none">{user.name}</span>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t(user.role.toLowerCase())}</span>
                        </div>
                        <button 
                        onClick={logout}
                        className="bg-gray-100 dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 text-gray-600 dark:text-gray-400 p-1.5 rounded-lg transition-colors"
                        title={t('logout')}
                        >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                        </button>
                    </div>
                    )}
                </div>
                </div>
            </div>
            </nav>
            
            <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 print:p-0">
            {children}
            </main>
        </div>
        </div>
    </div>
  );
};