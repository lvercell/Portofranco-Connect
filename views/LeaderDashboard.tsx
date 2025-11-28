
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { dataService } from '../services/dataService';
import { Announcement, Holiday } from '../types';

export const LeaderDashboard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  
  // Announcements
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  
  // Holiday State
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [holidayStartDate, setHolidayStartDate] = useState('');
  const [holidayEndDate, setHolidayEndDate] = useState('');
  const [holidayReason, setHolidayReason] = useState('');

  // Config State
  const [classDays, setClassDays] = useState<number[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const anns = await dataService.getAnnouncements();
    setAnnouncements(anns);
    const hols = await dataService.getHolidays();
    setHolidays(hols);
    const days = await dataService.getClassDays();
    setClassDays(days);
  };

  const handlePublish = async () => {
    if (!user || !title || !content) return;
    const newAnnouncement: Partial<Announcement> = {
      title, content, date: new Date().toLocaleDateString(), authorName: user.name
    };
    await dataService.createAnnouncement(newAnnouncement as Announcement, false);
    setTitle('');
    setContent('');
    loadData();
    alert("Announcement published!");
  };

  const handleCopyEmails = async () => {
      const emails = await dataService.getAllUserEmails();
      if (emails.length > 0) {
          await navigator.clipboard.writeText(emails.join(', '));
          alert(t('emailsCopied'));
      } else {
          alert("No users found.");
      }
  };

  const handleDeleteAnnouncement = async (id: string) => {
      if(window.confirm('Are you sure you want to delete this announcement?')) {
          await dataService.deleteAnnouncement(id);
          loadData();
      }
  };

  const handleAddHoliday = async () => {
      if (!holidayStartDate || !holidayReason) return;
      const end = holidayEndDate || holidayStartDate;
      if (end < holidayStartDate) {
          alert("End date cannot be before start date");
          return;
      }
      await dataService.createHolidayRange(holidayStartDate, end, holidayReason);
      setHolidayStartDate('');
      setHolidayEndDate('');
      setHolidayReason('');
      loadData();
  };

  const handleDeleteHoliday = async (id: string) => {
      await dataService.deleteHoliday(id);
      loadData();
  };

  const handleDayToggle = async (dayIndex: number) => {
      const newDays = classDays.includes(dayIndex) 
        ? classDays.filter(d => d !== dayIndex)
        : [...classDays, dayIndex].sort();
      
      setClassDays(newDays);
      await dataService.setClassDays(newDays);
  };

  const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
      
      {/* 1. Announcements */}
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-purple-100 dark:border-purple-900">
            <h2 className="text-2xl font-bold mb-4 text-purple-700 dark:text-purple-300">{t('newAnnouncement')}</h2>
            <div className="space-y-4">
            <input 
                type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" 
                className="w-full text-lg font-bold border-b-2 border-gray-200 dark:border-gray-600 bg-transparent dark:text-white p-2 focus:outline-none focus:border-purple-500"
            />
            <textarea value={content} onChange={e => setContent(e.target.value)} rows={4} className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white p-3 rounded" placeholder="Content..."/>
            
            <div className="flex justify-between items-center bg-purple-50 dark:bg-purple-900/30 p-3 rounded">
                <button 
                    onClick={handleCopyEmails}
                    className="flex items-center gap-2 text-sm text-purple-700 dark:text-purple-300 font-bold hover:underline"
                >
                    📋 {t('copyEmails')}
                </button>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                    Paste into BCC in your email app.
                </div>
            </div>

            <div className="flex justify-end">
                <button onClick={handlePublish} disabled={!title || !content} className="bg-green-600 text-white px-6 py-2 rounded font-medium hover:bg-green-700 disabled:opacity-50 transition-colors">
                {t('send')}
                </button>
            </div>
            </div>
        </div>

        <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300">History</h3>
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
            {announcements.map(a => (
            <div key={a.id} className="bg-white dark:bg-gray-800 p-4 rounded shadow-sm border-l-4 border-purple-500 group relative">
                <div className="flex justify-between items-baseline mb-1">
                <h4 className="font-bold text-gray-800 dark:text-gray-100">{a.title}</h4>
                <span className="text-xs text-gray-500 dark:text-gray-400">{a.date}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{a.content}</p>
                <button 
                    onClick={() => handleDeleteAnnouncement(a.id)}
                    className="absolute top-2 right-2 text-red-400 opacity-0 group-hover:opacity-100 hover:text-red-600 transition-opacity"
                    title="Delete Announcement"
                >
                    🗑️
                </button>
            </div>
            ))}
        </div>
      </div>

      {/* 2. Configuration & Holidays */}
      <div className="space-y-6">
          
          {/* Class Days Config */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-indigo-100 dark:border-indigo-900">
             <h2 className="text-xl font-bold text-indigo-700 dark:text-indigo-300 mb-4">📅 Class Days Configuration</h2>
             <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Select the days of the week when classes are held.</p>
             <div className="flex flex-wrap gap-2">
                 {DAYS_OF_WEEK.map((day, index) => (
                     <button
                        key={day}
                        onClick={() => handleDayToggle(index)}
                        className={`px-4 py-2 rounded-full font-bold text-sm transition-all border ${
                            classDays.includes(index) 
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                            : 'bg-white dark:bg-gray-700 text-gray-400 border-gray-200 dark:border-gray-600 hover:border-indigo-300'
                        }`}
                     >
                         {day}
                     </button>
                 ))}
             </div>
          </div>

          {/* Holiday Management */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-red-100 dark:border-red-900 h-fit">
            <div className="border-b border-red-100 dark:border-red-900 pb-4 mb-4">
                <h2 className="text-2xl font-bold text-red-700 dark:text-red-400">⛔ {t('manageHolidays')}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Block specific dates (e.g. Holidays, Breaks).</p>
            </div>
            
            <div className="flex flex-col gap-3 mb-6">
                <div className="flex gap-2">
                    <div className="flex-1">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400">Start Date</label>
                        <input 
                            type="date" 
                            value={holidayStartDate} 
                            onChange={e => setHolidayStartDate(e.target.value)} 
                            className="border dark:border-gray-600 dark:bg-gray-700 dark:text-white p-2 rounded w-full"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400">End Date (Optional)</label>
                        <input 
                            type="date" 
                            value={holidayEndDate} 
                            onChange={e => setHolidayEndDate(e.target.value)} 
                            className="border dark:border-gray-600 dark:bg-gray-700 dark:text-white p-2 rounded w-full"
                        />
                    </div>
                </div>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        placeholder="Reason (e.g. Christmas Break)" 
                        value={holidayReason} 
                        onChange={e => setHolidayReason(e.target.value)} 
                        className="border dark:border-gray-600 dark:bg-gray-700 dark:text-white p-2 rounded flex-1"
                    />
                    <button 
                        onClick={handleAddHoliday}
                        className="bg-red-600 text-white px-6 rounded hover:bg-red-700 font-bold"
                    >
                        +
                    </button>
                </div>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                {holidays.length === 0 && <p className="text-gray-400 italic text-center">No blocked dates.</p>}
                {holidays.map(h => (
                    <div key={h.id} className="flex justify-between items-center bg-red-50 dark:bg-red-900/20 p-3 rounded border border-red-100 dark:border-red-800">
                        <div>
                            <span className="font-bold text-red-800 dark:text-red-200 mr-3">{h.date}</span>
                            <span className="text-red-600 dark:text-red-300 text-sm">{h.reason}</span>
                        </div>
                        <button 
                            onClick={() => handleDeleteHoliday(h.id)}
                            className="text-red-400 hover:text-red-700 dark:hover:text-red-200"
                        >
                            🗑️
                        </button>
                    </div>
                ))}
            </div>
          </div>
      </div>
    </div>
  );
};
