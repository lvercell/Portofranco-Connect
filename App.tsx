import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/Layout';
import { Login } from './views/Login';
import { StudentDashboard } from './views/StudentDashboard';
import { TeacherDashboard } from './views/TeacherDashboard';
import { LeaderDashboard } from './views/LeaderDashboard';
import { AdminDashboard } from './views/AdminDashboard';
import { Role, Announcement } from './types';
import { dataService } from './services/dataService'; // Import to init data

const MainContent = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    if (user) {
      dataService.getAnnouncements().then(setAnnouncements).catch(console.error);
    }
  }, [user]);

  if (!user) {
    return <Login />;
  }

  return (
    <div className="space-y-8">
      {/* Universal Announcement Banner */}
      {announcements.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded shadow-sm">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <span className="font-bold">Latest: </span> 
                {announcements[0].title}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Welcome Header */}
      <div className="bg-indigo-700/90 backdrop-blur-sm rounded-2xl p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">{t('welcome')}, {user.name}!</h1>
        <p className="opacity-80 text-lg">
          {t('role')}: {t(user.role.toLowerCase())} {user.isAdmin && '(Admin)'} {user.isLeader && '(Leader)'}
        </p>
      </div>

      {/* Role Based Views */}
      {/* Admin Panel (Only for admins) */}
      {user.isAdmin && <AdminDashboard />}

      {/* Leader Dashboard (For Admins or promoted Teachers) */}
      {(user.isLeader || user.isAdmin) && <LeaderDashboard />}

      {/* Standard Role Dashboards */}
      {user.role === Role.STUDENT && <StudentDashboard />}
      {user.role === Role.TEACHER && <TeacherDashboard />}
    </div>
  );
};

const App = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ThemeProvider>
          <Layout>
            <MainContent />
          </Layout>
        </ThemeProvider>
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;