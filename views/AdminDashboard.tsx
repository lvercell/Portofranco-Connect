import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { dataService } from '../services/dataService';
import { useTheme } from '../context/ThemeContext';
import { Role, User, Booking } from '../types';
import { SUBJECTS_DATA } from '../constants';

const WALLPAPER_PRESETS = [
  { name: 'Library', url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2070&auto=format&fit=crop' },
  { name: 'Abstract Blue', url: 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029&auto=format&fit=crop' },
  { name: 'Pencils', url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=2022&auto=format&fit=crop' },
  { name: 'Minimal Geo', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop' },
];

export const AdminDashboard = () => {
  const { t, language } = useLanguage();
  const { backgroundImage, setBackgroundImage } = useTheme();
  const [teachers, setTeachers] = useState<User[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reportDate, setReportDate] = useState<string>('');
  const [customBg, setCustomBg] = useState('');

  const refresh = () => {
    setTeachers(dataService.getUsers().filter(u => u.role === Role.TEACHER));
    setBookings(dataService.getBookings());
    const available = dataService.getAvailableDates();
    if (available.length > 0 && !reportDate) setReportDate(available[0]);
  };

  useEffect(() => {
    refresh();
  }, []);

  const toggleLeader = (userId: string) => {
    dataService.toggleLeaderStatus(userId);
    refresh();
  };

  const getSubjectName = (id: string) => {
      const s = SUBJECTS_DATA.find(sub => sub.id === id);
      return s ? s.translations[language] : id;
  };

  const handlePrint = () => {
      window.print();
  };

  const handleCustomBg = (e: React.FormEvent) => {
    e.preventDefault();
    if(customBg) setBackgroundImage(customBg);
  }

  const reportData = bookings.filter(b => b.date === reportDate);

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      
      {/* 1. Appearance Panel (New) */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="border-b pb-4 mb-4">
            <h2 className="text-xl font-bold text-gray-800">🎨 System Appearance</h2>
            <p className="text-sm text-gray-500">Change the background wallpaper for the portal.</p>
        </div>
        
        <div className="space-y-4">
           <div>
             <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Presets</label>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               {WALLPAPER_PRESETS.map(p => (
                 <button 
                   key={p.name}
                   onClick={() => setBackgroundImage(p.url)}
                   className={`h-24 rounded-lg bg-cover bg-center border-4 transition-all hover:opacity-100 ${backgroundImage === p.url ? 'border-indigo-500 opacity-100' : 'border-transparent opacity-60'}`}
                   style={{ backgroundImage: `url(${p.url})` }}
                 >
                   <span className="bg-black/50 text-white text-xs px-2 py-1 rounded">{p.name}</span>
                 </button>
               ))}
             </div>
           </div>
           
           <form onSubmit={handleCustomBg}>
             <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Or Custom URL</label>
             <div className="flex gap-2">
               <input 
                type="text" 
                placeholder="https://example.com/image.jpg"
                value={customBg}
                onChange={e => setCustomBg(e.target.value)}
                className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
               />
               <button className="bg-gray-800 text-white px-4 py-2 rounded text-sm hover:bg-gray-900">Set</button>
             </div>
           </form>
        </div>
      </div>

      {/* 2. Leader Management */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="border-b pb-4 mb-4">
            <h2 className="text-xl font-bold text-gray-800">{t('adminPanel')} - {t('manageLeaders')}</h2>
            <p className="text-sm text-gray-500">Authorize teachers to send global announcements.</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('name')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('email')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('isLeader')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {teachers.map((teacher) => (
                <tr key={teacher.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{teacher.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{teacher.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${teacher.isLeader ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                      {teacher.isLeader ? 'LEADER' : '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {teacher.isAdmin ? (
                        <span className="text-gray-400 italic text-xs flex items-center justify-end gap-1">
                            🔒 {t('superAdmin')}
                        </span>
                    ) : (
                        <button 
                        onClick={() => toggleLeader(teacher.id)}
                        className={`${teacher.isLeader ? 'text-red-600 hover:text-red-900' : 'text-indigo-600 hover:text-indigo-900'}`}
                        >
                        {teacher.isLeader ? t('demoteLeader') : t('promoteToLeader')}
                        </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Reporting Section (Printable) */}
      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 print:shadow-none print:border-none">
          <div className="flex justify-between items-end mb-6 print:hidden">
              <div>
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    📄 {t('reports')}
                  </h2>
                  <p className="text-gray-500 mt-1">Daily match report for classes.</p>
              </div>
              <div className="flex gap-4 items-end">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('date')}</label>
                    <select 
                        value={reportDate} 
                        onChange={(e) => setReportDate(e.target.value)}
                        className="border p-2 rounded bg-gray-50"
                    >
                        {dataService.getAvailableDates().map(d => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>
                </div>
                <button 
                    onClick={handlePrint}
                    className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-black transition-colors"
                >
                    🖨️ {t('printReport')}
                </button>
              </div>
          </div>

          {/* Printable Area */}
          <div className="print:w-full">
            <div className="mb-6 border-b-2 border-black pb-2 flex justify-between items-baseline">
                <h1 className="text-3xl font-black uppercase tracking-wider">Doposcuola Connect</h1>
                <div className="text-right">
                    <h2 className="text-xl font-medium uppercase text-gray-600">{t('reports')}</h2>
                    <span className="text-lg font-bold">{new Date(reportDate).toLocaleDateString()}</span>
                </div>
            </div>

            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b-2 border-black">
                        <th className="py-2 text-sm uppercase font-bold text-gray-600 w-1/3">{t('student')}</th>
                        <th className="py-2 text-sm uppercase font-bold text-gray-600 w-1/3">{t('subject')}</th>
                        <th className="py-2 text-sm uppercase font-bold text-gray-600 w-1/3">{t('teacher')}</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-300">
                    {reportData.length === 0 && (
                        <tr><td colSpan={3} className="py-8 text-center text-gray-400 italic">{t('noClasses')}</td></tr>
                    )}
                    {reportData.map(b => (
                        <tr key={b.id} className="group">
                            <td className="py-3 font-medium">{b.studentName}</td>
                            <td className="py-3 text-gray-700">{getSubjectName(b.subjectId)}</td>
                            <td className="py-3">
                                {b.teacherName ? (
                                    <span className="font-bold text-black">✅ {b.teacherName}</span>
                                ) : (
                                    <span className="text-red-500 font-mono text-sm uppercase">[ {t('unclaimed')} ]</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="mt-12 pt-4 border-t border-gray-300 text-xs text-center text-gray-400">
                {t('generatedBy')}
            </div>
          </div>
      </div>

    </div>
  );
};