
import React, { PropsWithChildren } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { SUPPORTED_LANGUAGES, Language } from '../types';

export const Layout = ({ children }: PropsWithChildren) => {
  const { language, setLanguage, t } = useLanguage();
  const { user, logout } = useAuth();
  const { backgroundImage } = useTheme();

  return (
    <div 
      className="min-h-screen font-sans selection:bg-indigo-100 selection:text-indigo-800 print:bg-white bg-cover bg-center bg-fixed transition-all duration-500"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="min-h-screen bg-white/90 backdrop-blur-[2px]">
        {/* Development Banner */}
        <div className="fixed bottom-0 right-0 m-2 z-[100] bg-yellow-300 text-yellow-900 text-[10px] font-mono px-3 py-1 rounded-full shadow-lg opacity-80 pointer-events-none uppercase tracking-wider border border-yellow-400 print:hidden">
          {t('devMode')}
        </div>

        <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 print:hidden shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo(0, 0); }} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <div className="bg-indigo-600 text-white p-1.5 rounded-lg font-bold text-lg shadow-sm">DC</div>
                <span className="font-bold text-xl tracking-tight text-gray-800 hidden sm:block">Doposcuola Connect</span>
              </a>
              
              <div className="flex items-center space-x-3 md:space-x-4">
                
                {user && (
                  <button 
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
                    className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-indigo-100 transition-colors"
                  >
                    <span>🏠</span> <span className="hidden sm:inline">Home</span>
                  </button>
                )}

                <select 
                  value={language} 
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  className="bg-gray-100 text-gray-600 text-sm rounded-lg border-transparent focus:border-indigo-500 focus:bg-white focus:ring-0 py-1.5 px-3 font-medium transition-colors cursor-pointer hover:bg-gray-200"
                >
                  {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
                    <option key={code} value={code}>{name}</option>
                  ))}
                </select>

                {user && (
                  <div className="flex items-center gap-4 pl-4 border-l border-gray-200">
                    <div className="hidden md:flex flex-col items-end">
                      <span className="text-sm font-bold text-gray-800 leading-none">{user.name}</span>
                      <span className="text-xs text-gray-500 uppercase">{t(user.role.toLowerCase())}</span>
                    </div>
                    <button 
                      onClick={logout}
                      className="bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-600 p-2 rounded-lg transition-colors"
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
  );
};
